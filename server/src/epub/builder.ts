import fs from "node:fs";
import path from "node:path";

import yazl from "yazl";

import { ensureDir, sha256Hex } from "../lib/filesystem.js";

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
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
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

export interface BuildChapterEpubOptions {
  outputPath: string;
  identifier: string;
  title: string;
  author?: string | null;
  contentHtml: string;
}

export async function buildChapterEpub({
  outputPath,
  identifier,
  title,
  author,
  contentHtml
}: BuildChapterEpubOptions) {
  await ensureDir(path.dirname(outputPath));

  const zipFile = new yazl.ZipFile();
  const styles = `body{font-family:serif;line-height:1.55;padding:0 0.5rem;}h1{font-size:1.4rem;margin-bottom:1rem;}p{margin:0 0 1rem;}`;
  const chapterXhtml = buildXhtmlDocument(title, contentHtml);
  const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
  <head><title>${escapeXml(title)}</title></head>
  <body>
    <nav epub:type="toc" id="toc">
      <ol><li><a href="chapter.xhtml">${escapeXml(title)}</a></li></ol>
    </nav>
  </body>
</html>`;
  const packageOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${escapeXml(identifier)}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>${escapeXml(author || "Unknown")}</dc:creator>
    <dc:language>vi</dc:language>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/>
    <item id="style" href="styles.css" media-type="text/css"/>
  </manifest>
  <spine>
    <itemref idref="nav"/>
    <itemref idref="chapter"/>
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
