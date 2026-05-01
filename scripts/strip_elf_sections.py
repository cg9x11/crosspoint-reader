"""
PlatformIO post-link script: strip non-runtime unwind metadata from the ELF
before PlatformIO performs size checks.

On this firmware, `.eh_frame` is emitted by the toolchain but is not needed at
runtime because exceptions are disabled. Removing it saves ~58 KB of flash,
which is enough to keep the added reader fonts within the app partition.
"""

import os
import subprocess
import sys
from pathlib import Path


SECTIONS_TO_REMOVE = [".eh_frame", ".eh_frame_hdr"]


def info(message):
    print(f"[strip_elf_sections] {message}")


def warn(message):
    print(f"[strip_elf_sections] WARNING: {message}", file=sys.stderr)


def resolve_objcopy(env):
    platform = env.PioPlatform()
    package_dir = platform.get_package_dir("toolchain-riscv32-esp")
    if package_dir:
        candidate = Path(package_dir) / "bin" / "riscv32-esp-elf-objcopy.exe"
        if candidate.exists():
            return candidate
        candidate = Path(package_dir) / "bin" / "riscv32-esp-elf-objcopy"
        if candidate.exists():
            return candidate

    compiler_path = env.subst("$CXX") or env.subst("$CC")
    if compiler_path:
        compiler_dir = Path(compiler_path).resolve().parent
        candidate = compiler_dir / "riscv32-esp-elf-objcopy.exe"
        if candidate.exists():
            return candidate
        candidate = compiler_dir / "riscv32-esp-elf-objcopy"
        if candidate.exists():
            return candidate

    return None


def strip_sections(target, source, env):
    elf_path = env.subst("$BUILD_DIR/${PROGNAME}.elf")
    if not os.path.isfile(elf_path):
        warn(f"ELF not found: {elf_path}")
        return

    objcopy = resolve_objcopy(env)
    if objcopy is None:
        warn("Unable to resolve riscv32-esp-elf-objcopy from PlatformIO toolchain")
        return

    cmd = [str(objcopy)]
    for section in SECTIONS_TO_REMOVE:
        cmd.extend(["--remove-section", section])
    cmd.append(elf_path)

    try:
        subprocess.check_call(cmd)
        info(f"Stripped {', '.join(SECTIONS_TO_REMOVE)} from {os.path.basename(elf_path)}")
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(f"objcopy failed while stripping ELF sections: exit {exc.returncode}") from exc


Import("env")  # type: ignore[name-defined]
env.AddPreAction("checkprogsize", strip_sections)
