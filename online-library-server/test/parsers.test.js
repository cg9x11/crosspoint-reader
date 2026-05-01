import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { hakoSource } from "../src/sources/hako.js";
import { truyenFullSource } from "../src/sources/truyenfull.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");

async function readArtifact(name) {
  return readFile(path.join(repoRoot, "artifacts", name), "utf8");
}

test("hako home parser reads items", async () => {
  const html = await readArtifact("docln-home.html");
  const items = hakoSource.parseThumbItems(html);
  assert.ok(items.length > 0);
  assert.ok(items[0].title);
  assert.ok(items[0].url.startsWith("https://docln.sbs/"));
});

test("hako detail parser reads title and genres", async () => {
  const html = await readArtifact("docln-detail-live.html");
  const detail = hakoSource.parseDetail(html, "https://docln.sbs/example");
  assert.ok(detail.title);
  assert.ok(detail.genres.length > 0);
});

test("hako detail parser reads author and status from labeled info rows", () => {
  const html = `
    <html>
      <body>
        <div class="series-name"><a href="/truyen/example">Example</a></div>
        <div class="series-cover"><div class="content img-in-ratio" style="background-image:url('https://example.com/cover.jpg')"></div></div>
        <div class="summary-content"><p>Summary</p></div>
        <div class="info-item">
          <span class="info-name">Tác giả:</span>
          <span class="info-value"><a href="/tac-gia/foo">Foo Bar</a></span>
        </div>
        <div class="info-item">
          <span class="info-name">Tình trạng:</span>
          <span class="info-value"><a href="/dang-tien-hanh">Đang tiến hành</a></span>
        </div>
      </body>
    </html>
  `;
  const detail = hakoSource.parseDetail(html, "https://docln.sbs/truyen/example");
  assert.equal(detail.author, "Foo Bar");
  assert.equal(detail.ongoing, true);
});

test("hako toc parser reads chapters", async () => {
  const html = await readArtifact("docln-detail-live.html");
  const chapters = hakoSource.parseToc(html);
  assert.ok(chapters.length > 0);
  assert.ok(chapters[0].title);
});

test("hako chapter parser reads text", async () => {
  const html = `
    <html>
      <body>
        <h1 class="chapter-title">Chapter 1</h1>
        <div id="chapter-content">
          <p>First line.</p>
          <p>Second line.</p>
        </div>
      </body>
    </html>
  `;
  const chapter = hakoSource.parseChapter(
    html,
    { title: "", url: "https://docln.sbs/example", sectionTitle: "", index: 1 },
    { includeText: true, includeHtml: false }
  );
  assert.ok(chapter.text.length > 0);
});

test("hako protected chapter parser decodes xor chunks", async () => {
  const key = "secret";
  const plain = "<p>Decoded text</p>";
  const source = Buffer.from(plain, "utf8");
  const keyBytes = Buffer.from(key, "utf8");
  const encoded = Buffer.alloc(source.length);
  for (let index = 0; index < source.length; index += 1) {
    encoded[index] = source[index] ^ keyBytes[index % keyBytes.length];
  }
  const chunk = `0001${encoded.toString("base64")}`;
  const html = `
    <html>
      <body>
        <div id="chapter-content">
          <div id="chapter-c-protected" data-s="xor_shuffle" data-k="${key}" data-c='["${chunk}"]'></div>
        </div>
      </body>
    </html>
  `;
  const chapter = hakoSource.parseChapter(
    html,
    { title: "Protected", url: "https://docln.sbs/example", sectionTitle: "", index: 1 },
    { includeText: true, includeHtml: true }
  );
  assert.match(chapter.text, /Decoded text/);
  assert.match(chapter.html, /Decoded text/);
});

test("hako image-only chapter parser returns placeholder text", async () => {
  const html = `
    <html>
      <body>
        <div id="chapter-content">
          <p><img src="https://example.com/a.jpg" alt=""></p>
          <p><img src="https://example.com/b.jpg" alt=""></p>
        </div>
      </body>
    </html>
  `;
  const chapter = hakoSource.parseChapter(
    html,
    { title: "Illustration", url: "https://docln.sbs/example", sectionTitle: "", index: 1 },
    { includeText: true, includeHtml: false }
  );
  assert.equal(chapter.text, "[Illustration only: 2 images]");
});

test("truyenfull home parser reads items", async () => {
  const html = await readArtifact("truyenfull-home.html");
  const items = truyenFullSource.parseListItems(html);
  assert.ok(items.length > 0);
  assert.ok(items[0].title);
  assert.ok(items[0].url.startsWith("https://truyenfull.vision/"));
});

test("truyenfull detail parser reads title and cover", async () => {
  const html = await readArtifact("truyenfull-detail-live.html");
  const detail = truyenFullSource.parseDetail(html, "https://truyenfull.vision/example/");
  assert.ok(detail.title);
  assert.ok(detail.coverUrl);
});

test("truyenfull detail parser reads latest chapter from latest list", () => {
  const html = `
    <html>
      <body>
        <div class="col-info-desc"><h3 class="title">Bach Luyen Thanh Tien</h3></div>
        <div class="book"><img src="https://example.com/cover.jpg"></div>
        <div class="desc"><div class="desc-text">Summary</div></div>
        <div class="l-chapter">
          <ul class="l-chapters">
            <li><a href="/truyen-bach-luyen-thanh-tien-837581/quyen-8-chuong-3448/">Quyen 8 Chuong 3448</a></li>
            <li><a href="/truyen-bach-luyen-thanh-tien-837581/quyen-8-chuong-3447/">Quyen 8 Chuong 3447</a></li>
          </ul>
        </div>
      </body>
    </html>
  `;
  const detail = truyenFullSource.parseDetail(html, "https://truyenfull.vision/bach-luyen-thanh-tien/");
  assert.equal(detail.latestChapterUrl, "https://truyenfull.vision/truyen-bach-luyen-thanh-tien-837581/quyen-8-chuong-3448/");
  assert.equal(detail.latestChapterTitle, "Quyen 8 Chuong 3448");
});

test("truyenfull detail parser falls back to meta description for author and status", () => {
  const html = `
    <html>
      <head>
        <meta name="description" content="Đọc truyện Thần Đạo Đan Tôn của tác giả Cô Đơn Địa Phi, đã full (hoàn thành) mới nhất tại Truyenfull.vn">
      </head>
      <body>
        <div class="col-info-desc"><h3 class="title">Thần Đạo Đan Tôn</h3></div>
        <div class="book"><img src="https://example.com/cover.jpg"></div>
        <div class="desc"><div class="desc-text">Summary</div></div>
      </body>
    </html>
  `;
  const detail = truyenFullSource.parseDetail(html, "https://truyenfull.vision/than-dao-dan-ton/");
  assert.equal(detail.author, "Cô Đơn Địa Phi");
  assert.equal(detail.ongoing, false);
});

test("truyenfull toc page parser reads chapters and page count", async () => {
  const html = await readArtifact("truyenfull-detail-live.html");
  const page = truyenFullSource.parseTocPage(html);
  assert.ok(page.chapters.length > 0);
  assert.ok(page.totalPages >= 1);
});

test("truyenfull chapter parser reads text", async () => {
  const html = await readArtifact("truyenfull-chapter-live.html");
  const chapter = truyenFullSource.parseChapter(
    html,
    { title: "", url: "https://truyenfull.vision/example/chuong-1/", sectionTitle: "", index: 1 },
    { includeText: true, includeHtml: false }
  );
  assert.ok(chapter.text.length > 0);
});
