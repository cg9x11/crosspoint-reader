import fs from "node:fs";
import path from "node:path";

import { load } from "cheerio";
import yazl from "yazl";

import { ensureDir, sha256Hex } from "../lib/filesystem.js";
import { buildEpubImageAsset } from "../lib/image-assets.js";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildXhtmlDocument(title: string, bodyHtml: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="vi">
  <head>
    <title>${escapeXml(title)}</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" type="text/css" href="styles.css" />
  </head>
  <body>
    <section class="chapter">
      ${bodyHtml}
    </section>
  </body>
</html>`;
}

interface EpubBinaryAsset {
  zipPath: string;
  mediaType: string;
  buffer: Buffer;
}

export interface BuildChapterEpubOptions {
  outputPath: string;
  identifier: string;
  title: string;
  author?: string | null;
  contentHtml: string;
  sourceUrl?: string | null;
  coverImage?: {
    buffer: Buffer;
    mediaType: string;
    fileName?: string;
  } | null;
}

export interface BuildBookEpubOptions {
  outputPath: string;
  identifier: string;
  title: string;
  author?: string | null;
  description?: string | null;
  coverImage?: {
    buffer: Buffer;
    mediaType: string;
    fileName?: string;
  } | null;
  chapters: Array<{
    title: string;
    contentHtml: string;
    sourceUrl?: string | null;
  }>;
  onProgress?: ((completedChapters: number, totalChapters: number) => Promise<void> | void) | null;
}

async function localizeChapterImages(contentHtml: string, sourceUrl?: string | null) {
  const $ = load(`<div id="chapter-root">${contentHtml}</div>`, {
    xmlMode: false
  });
  const root = $("#chapter-root");
  const assets: EpubBinaryAsset[] = [];
  const assetBySource = new Map<string, string>();
  let counter = 0;

  const images = root.find("img").toArray();
  for (const imageNode of images) {
    const image = $(imageNode);
    const rawSrc = String(image.attr("src") || "").trim();
    if (!rawSrc) {
      image.remove();
      continue;
    }

    let resolvedSrc = rawSrc;
    if (!/^data:/i.test(rawSrc)) {
      try {
        resolvedSrc = new URL(rawSrc, sourceUrl || undefined).toString();
      } catch {
        if (!/^https?:\/\//i.test(rawSrc)) {
          image.replaceWith("<p>[Anh minh hoa khong ho tro]</p>");
          continue;
        }
      }
    }

    try {
      let localPath = assetBySource.get(resolvedSrc);
      if (!localPath) {
        counter += 1;
        const asset = await buildEpubImageAsset(resolvedSrc, {
          maxWidth: 1200,
          maxHeight: 1800,
          timeoutMs: 20_000,
          headers: sourceUrl
            ? {
                Referer: sourceUrl
              }
            : undefined
        });
        localPath = `images/img_${String(counter).padStart(3, "0")}${asset.extension}`;
        assetBySource.set(resolvedSrc, localPath);
        assets.push({
          zipPath: `OEBPS/${localPath}`,
          mediaType: asset.mediaType,
          buffer: asset.buffer
        });
      }

      image.attr("src", localPath);
      image.removeAttr("srcset");
      image.removeAttr("sizes");
      image.removeAttr("loading");
      image.removeAttr("decoding");
      image.removeAttr("fetchpriority");
      image.removeAttr("referrerpolicy");
    } catch {
      image.replaceWith("<p>[Khong tai duoc anh minh hoa]</p>");
    }
  }

  return {
    contentHtml: root.html() || "",
    assets
  };
}

export async function buildChapterEpub({
  outputPath,
  identifier,
  title,
  author,
  contentHtml,
  sourceUrl,
  coverImage
}: BuildChapterEpubOptions) {
  await ensureDir(path.dirname(outputPath));

  const zipFile = new yazl.ZipFile();
  const styles = [
    "body{font-family:serif;line-height:1.6;padding:0 0.5rem;color:#111;background:#fff;}",
    "h1{font-size:1.4rem;margin:0 0 1rem;}",
    "p{margin:0 0 1rem;}",
    "img{display:block;max-width:100%;height:auto;margin:1rem auto;page-break-inside:avoid;}",
    ".cover-page{margin:0;padding:0;text-align:center;}",
    ".cover-page img{max-width:100%;max-height:96vh;margin:0 auto;}"
  ].join("");
  const localized = await localizeChapterImages(contentHtml, sourceUrl);
  const chapterXhtml = buildXhtmlDocument(title, localized.contentHtml);

  const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
  <head><title>${escapeXml(title)}</title></head>
  <body>
    <nav epub:type="toc" id="toc">
      <ol><li><a href="chapter.xhtml">${escapeXml(title)}</a></li></ol>
    </nav>
  </body>
</html>`;

  const manifestItems = [
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `<item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/>`,
    `<item id="style" href="styles.css" media-type="text/css"/>`
  ];
  const spineRefs = [`<itemref idref="nav"/>`, `<itemref idref="chapter"/>`];

  localized.assets.forEach((asset, index) => {
    manifestItems.push(
      `<item id="img-${index + 1}" href="${escapeXml(asset.zipPath.replace(/^OEBPS\//, ""))}" media-type="${asset.mediaType}"/>`
    );
  });

  if (coverImage?.buffer?.length) {
    const coverFileName = coverImage.fileName || "images/cover.png";
    manifestItems.push(
      `<item id="cover-image" href="${escapeXml(coverFileName)}" media-type="${coverImage.mediaType}" properties="cover-image"/>`,
      `<item id="cover-page" href="cover.xhtml" media-type="application/xhtml+xml"/>`
    );
    spineRefs.unshift(`<itemref idref="cover-page" linear="no"/>`);
  }

  const packageOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${escapeXml(identifier)}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>${escapeXml(author || "Unknown")}</dc:creator>
    <dc:language>vi</dc:language>
    ${coverImage?.buffer?.length ? `<meta name="cover" content="cover-image"/>` : ""}
  </metadata>
  <manifest>
    ${manifestItems.join("\n    ")}
  </manifest>
  <spine>
    ${spineRefs.join("\n    ")}
  </spine>
</package>`;

  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

  zipFile.addBuffer(Buffer.from("application/epub+zip"), "mimetype", { compress: false });
  zipFile.addBuffer(Buffer.from(containerXml), "META-INF/container.xml");
  zipFile.addBuffer(Buffer.from(packageOpf), "OEBPS/content.opf");
  zipFile.addBuffer(Buffer.from(navXhtml), "OEBPS/nav.xhtml");
  zipFile.addBuffer(Buffer.from(chapterXhtml), "OEBPS/chapter.xhtml");
  zipFile.addBuffer(Buffer.from(styles), "OEBPS/styles.css");

  if (coverImage?.buffer?.length) {
    const coverPath = coverImage.fileName || "images/cover.png";
    const coverXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="vi">
  <head>
    <title>${escapeXml(title)}</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" type="text/css" href="styles.css" />
  </head>
  <body class="cover-page">
    <img src="${escapeXml(coverPath)}" alt="${escapeXml(title)}" />
  </body>
</html>`;
    zipFile.addBuffer(coverImage.buffer, `OEBPS/${coverPath}`);
    zipFile.addBuffer(Buffer.from(coverXhtml), "OEBPS/cover.xhtml");
  }

  localized.assets.forEach((asset) => {
    zipFile.addBuffer(asset.buffer, asset.zipPath);
  });

  const outputStream = fs.createWriteStream(outputPath);
  const outputClosed = new Promise<void>((resolve, reject) => {
    outputStream.on("close", () => resolve());
    outputStream.on("error", reject);
  });

  zipFile.outputStream.pipe(outputStream);
  zipFile.end();
  await outputClosed;

  const buffer = await fs.promises.readFile(outputPath);
  return {
    fileSize: buffer.byteLength,
    checksum: sha256Hex(buffer)
  };
}

export async function buildBookEpub({
  outputPath,
  identifier,
  title,
  author,
  description,
  coverImage,
  chapters,
  onProgress
}: BuildBookEpubOptions) {
  await ensureDir(path.dirname(outputPath));

  const zipFile = new yazl.ZipFile();
  const styles = [
    "body{font-family:serif;line-height:1.6;padding:0 0.5rem;color:#111;background:#fff;}",
    "h1{font-size:1.5rem;margin:0 0 1rem;}",
    "h2{font-size:1.25rem;margin:0 0 1rem;}",
    "p{margin:0 0 1rem;}",
    "img{display:block;max-width:100%;height:auto;margin:1rem auto;page-break-inside:avoid;}",
    ".cover-page{margin:0;padding:0;text-align:center;}",
    ".cover-page img{max-width:100%;max-height:96vh;margin:0 auto;}",
    ".chapter-title{margin-bottom:1rem;}",
    ".book-meta{color:#555;font-size:0.95rem;margin-bottom:1.5rem;}"
  ].join("");

  const localizedChapters = [];
  for (let index = 0; index < chapters.length; index += 1) {
    const chapter = chapters[index];
    if (!chapter) {
      continue;
    }
    const localized = await localizeChapterImages(chapter.contentHtml, chapter.sourceUrl);
    localizedChapters.push({
      title: chapter.title,
      xhtmlPath: `chapter_${String(index + 1).padStart(3, "0")}.xhtml`,
      xhtml: buildXhtmlDocument(
        chapter.title,
        `<h1 class="chapter-title">${escapeXml(chapter.title)}</h1>\n${localized.contentHtml}`
      ),
      assets: localized.assets
    });

    if (onProgress) {
      await onProgress(index + 1, chapters.length);
    }
  }

  const descriptionMeta = description?.trim()
    ? `<dc:description>${escapeXml(description.trim())}</dc:description>`
    : "";

  const navEntries = localizedChapters
    .map(
      (chapter) =>
        `<li><a href="${escapeXml(chapter.xhtmlPath)}">${escapeXml(chapter.title)}</a></li>`
    )
    .join("");

  const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
  <head><title>${escapeXml(title)}</title></head>
  <body>
    <nav epub:type="toc" id="toc">
      <h1>${escapeXml(title)}</h1>
      <ol>${navEntries}</ol>
    </nav>
  </body>
</html>`;

  const manifestItems = [
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `<item id="style" href="styles.css" media-type="text/css"/>`
  ];
  const spineRefs: string[] = [];

  localizedChapters.forEach((chapter, index) => {
    manifestItems.push(
      `<item id="chapter-${index + 1}" href="${escapeXml(chapter.xhtmlPath)}" media-type="application/xhtml+xml"/>`
    );
    spineRefs.push(`<itemref idref="chapter-${index + 1}"/>`);
  });

  let imageCounter = 0;
  localizedChapters.forEach((chapter) => {
    chapter.assets.forEach((asset) => {
      imageCounter += 1;
      manifestItems.push(
        `<item id="img-${imageCounter}" href="${escapeXml(asset.zipPath.replace(/^OEBPS\//, ""))}" media-type="${asset.mediaType}"/>`
      );
    });
  });

  if (coverImage?.buffer?.length) {
    const coverFileName = coverImage.fileName || "images/cover.png";
    manifestItems.push(
      `<item id="cover-image" href="${escapeXml(coverFileName)}" media-type="${coverImage.mediaType}" properties="cover-image"/>`,
      `<item id="cover-page" href="cover.xhtml" media-type="application/xhtml+xml"/>`
    );
    spineRefs.unshift(`<itemref idref="cover-page" linear="no"/>`);
  }

  const packageOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${escapeXml(identifier)}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>${escapeXml(author || "Unknown")}</dc:creator>
    <dc:language>vi</dc:language>
    ${descriptionMeta}
    ${coverImage?.buffer?.length ? `<meta name="cover" content="cover-image"/>` : ""}
  </metadata>
  <manifest>
    ${manifestItems.join("\n    ")}
  </manifest>
  <spine>
    ${spineRefs.join("\n    ")}
  </spine>
</package>`;

  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

  zipFile.addBuffer(Buffer.from("application/epub+zip"), "mimetype", { compress: false });
  zipFile.addBuffer(Buffer.from(containerXml), "META-INF/container.xml");
  zipFile.addBuffer(Buffer.from(packageOpf), "OEBPS/content.opf");
  zipFile.addBuffer(Buffer.from(navXhtml), "OEBPS/nav.xhtml");
  zipFile.addBuffer(Buffer.from(styles), "OEBPS/styles.css");

  if (coverImage?.buffer?.length) {
    const coverPath = coverImage.fileName || "images/cover.png";
    const coverXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="vi">
  <head>
    <title>${escapeXml(title)}</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" type="text/css" href="styles.css" />
  </head>
  <body class="cover-page">
    <img src="${escapeXml(coverPath)}" alt="${escapeXml(title)}" />
  </body>
</html>`;
    zipFile.addBuffer(coverImage.buffer, `OEBPS/${coverPath}`);
    zipFile.addBuffer(Buffer.from(coverXhtml), "OEBPS/cover.xhtml");
  }

  localizedChapters.forEach((chapter) => {
    zipFile.addBuffer(Buffer.from(chapter.xhtml), `OEBPS/${chapter.xhtmlPath}`);
    chapter.assets.forEach((asset) => {
      zipFile.addBuffer(asset.buffer, asset.zipPath);
    });
  });

  const outputStream = fs.createWriteStream(outputPath);
  const outputClosed = new Promise<void>((resolve, reject) => {
    outputStream.on("close", () => resolve());
    outputStream.on("error", reject);
  });

  zipFile.outputStream.pipe(outputStream);
  zipFile.end();
  await outputClosed;

  const buffer = await fs.promises.readFile(outputPath);
  return {
    fileSize: buffer.byteLength,
    checksum: sha256Hex(buffer)
  };
}
