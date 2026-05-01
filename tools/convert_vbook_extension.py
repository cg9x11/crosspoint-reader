#!/usr/bin/env python3
import argparse
import json
import pathlib
import re
import sys
import urllib.request
import unicodedata
from typing import Dict, Tuple
from zipfile import ZipFile


SUPPORTED_PROFILES = ("hako", "truyenfull")


def setup_utf8_stdio() -> None:
    for stream_name in ("stdout", "stderr"):
        stream = getattr(sys, stream_name, None)
        reconfigure = getattr(stream, "reconfigure", None)
        if callable(reconfigure):
            reconfigure(encoding="utf-8", errors="replace")


def repair_text(value: str) -> str:
    text = str(value or "").strip()
    if not text:
        return ""
    if any(marker in text for marker in ("Ã", "Ä", "Â", "á»", "áº")):
        for source_encoding in ("latin1", "cp1252"):
            try:
                repaired = text.encode(source_encoding).decode("utf-8")
                if repaired:
                    return repaired.strip()
            except UnicodeError:
                continue
    return text


def read_extension_payload(path: pathlib.Path) -> Tuple[dict, Dict[str, str]]:
    if path.is_dir():
      plugin_path = path / "plugin.json"
      if not plugin_path.exists():
        raise ValueError(f"Missing plugin.json in {path}")
      plugin = json.loads(plugin_path.read_text(encoding="utf-8"))
      src_dir = path / "src"
      sources = {}
      if src_dir.exists():
        for file_path in src_dir.glob("*.js"):
          sources[file_path.name] = file_path.read_text(encoding="utf-8")
      return plugin, sources

    if path.is_file() and path.suffix.lower() == ".zip":
      with ZipFile(path, "r") as archive:
        names = set(archive.namelist())
        plugin_name = "plugin.json" if "plugin.json" in names else next(
            (name for name in names if name.endswith("/plugin.json")), None
        )
        if plugin_name is None:
          raise ValueError(f"Missing plugin.json in zip {path}")
        base_dir = plugin_name[: -len("plugin.json")]
        plugin = json.loads(archive.read(plugin_name).decode("utf-8"))
        sources = {}
        for name in names:
          if not name.startswith(base_dir + "src/") or not name.endswith(".js"):
            continue
          sources[pathlib.Path(name).name] = archive.read(name).decode("utf-8")
        return plugin, sources

    raise ValueError(f"Unsupported extension path: {path}")


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", normalized.lower()).strip("-")
    return slug or "vbook-adapter"


def detect_profile(metadata: dict, sources: Dict[str, str]) -> str:
    source = str(metadata.get("source", "")).lower()
    regexp = str(metadata.get("regexp", "")).lower()
    joined = "\n".join(sources.values()).lower()

    if any(token in source or token in regexp for token in ("docln", "hako")):
        return "hako"
    if "chapter-c-protected" in joined or "xor_shuffle" in joined:
        return "hako"

    if any(token in source or token in regexp for token in ("truyenfull", "truyencom", "webtruyen", "truyenhoan", "santruyen")):
        return "truyenfull"
    if "ajax.php?type=list_chapter" in joined or "div.chapter-c" in joined or "list-chapter" in joined:
        return "truyenfull"

    raise ValueError(
        "Unsupported extension profile. Currently supported: " + ", ".join(SUPPORTED_PROFILES)
    )


def convert_to_cpplugin(plugin: dict, sources: Dict[str, str], plugin_id: str | None) -> dict:
    metadata = plugin.get("metadata") or {}
    script_map = plugin.get("script") or {}
    if not metadata:
        raise ValueError("plugin.json is missing metadata")

    profile = detect_profile(metadata, sources)
    repaired_name = repair_text(metadata.get("name", profile))
    resolved_plugin_id = plugin_id or profile

    description = repair_text(metadata.get("description", ""))
    author = repair_text(metadata.get("author", "vBook")) or "vBook"
    locale = str(metadata.get("locale", "vi_VN")).replace("_", "-")
    base_url = str(metadata.get("source", "")).strip()
    content_type = "webnovel" if str(metadata.get("type", "novel")).lower().endswith("novel") else str(
        metadata.get("type", "novel")
    )

    return {
        "plugin": {
            "id": resolved_plugin_id,
            "name": repaired_name or profile.title(),
            "version": int(metadata.get("version", 1)),
            "author": author,
            "deviceSupport": ["x3", "x4"],
            "description": description,
        },
        "runtime": {
            "mode": "adapter",
            "adapter": {
                "origin": "vbook",
                "profile": profile,
                "sourceLanguage": str(metadata.get("language", "javascript")),
                "scriptFiles": sorted(sources.keys()),
                "entrypoints": {
                    str(key): str(value)
                    for key, value in script_map.items()
                    if str(key).strip() and str(value).strip()
                },
            },
        },
        "source": {
            "baseUrl": base_url,
            "locale": locale,
            "contentType": content_type,
            "supportsSearch": bool(plugin.get("script", {}).get("search")),
            "supportsTrackedUpdates": profile == "hako",
            "regexp": str(metadata.get("regexp", "")).strip(),
        },
    }


def install_plugin(cpplugin: dict, install_url: str) -> None:
    request = urllib.request.Request(
        install_url.rstrip("/"),
        method="POST",
        headers={"Content-Type": "application/json"},
        data=json.dumps(cpplugin, ensure_ascii=False, indent=2).encode("utf-8"),
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        body = response.read().decode("utf-8", errors="replace")
        if response.status < 200 or response.status >= 300:
            raise RuntimeError(f"Install failed ({response.status}): {body}")


def main() -> int:
    setup_utf8_stdio()
    parser = argparse.ArgumentParser(
        description="Convert a vBook extension directory/zip into a Crosspoint adapter cpplugin."
    )
    parser.add_argument("extension_path", help="Path to a vBook extension directory or plugin zip")
    parser.add_argument("--plugin-id", help="Override generated plugin id")
    parser.add_argument("--output", help="Write cpplugin JSON to this file instead of stdout")
    parser.add_argument(
        "--install-url",
        help="Optional Crosspoint import endpoint, for example http://crosspoint.local/api/plugins/import",
    )
    args = parser.parse_args()

    try:
        extension_path = pathlib.Path(args.extension_path).expanduser().resolve()
        plugin, sources = read_extension_payload(extension_path)
        cpplugin = convert_to_cpplugin(plugin, sources, args.plugin_id)
        payload = json.dumps(cpplugin, ensure_ascii=False, indent=2) + "\n"

        if args.output:
            output_path = pathlib.Path(args.output).expanduser().resolve()
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(payload, encoding="utf-8")
            print(f"Wrote {output_path}")
        else:
            sys.stdout.write(payload)

        if args.install_url:
            install_plugin(cpplugin, args.install_url)
            print(f"Installed via {args.install_url}")
        return 0
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
