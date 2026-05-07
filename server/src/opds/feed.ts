interface FeedLink {
  href: string;
  rel?: string;
  type?: string;
  title?: string;
}

interface FeedEntry {
  id: string;
  title: string;
  updatedAt: string;
  summary?: string;
  author?: string;
  content?: string;
  links: FeedLink[];
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function renderLinks(links: FeedLink[]) {
  return links
    .map(
      (link) =>
        `<link href="${escapeXml(link.href)}"${link.rel ? ` rel="${escapeXml(link.rel)}"` : ""}${
          link.type ? ` type="${escapeXml(link.type)}"` : ""
        }${link.title ? ` title="${escapeXml(link.title)}"` : ""} />`
    )
    .join("");
}

export function buildOpdsFeed(params: {
  id: string;
  title: string;
  updatedAt: string;
  links: FeedLink[];
  entries: FeedEntry[];
}) {
  const entriesXml = params.entries
    .map((entry) => {
      const summary = entry.summary ? `<summary>${escapeXml(entry.summary)}</summary>` : "";
      const content = entry.content ? `<content type="text">${escapeXml(entry.content)}</content>` : "";
      const author = entry.author
        ? `<author><name>${escapeXml(entry.author)}</name></author>`
        : "";

      return `<entry>
  <id>${escapeXml(entry.id)}</id>
  <title>${escapeXml(entry.title)}</title>
  <updated>${escapeXml(entry.updatedAt)}</updated>
  ${author}
  ${summary}
  ${content}
  ${renderLinks(entry.links)}
</entry>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:opds="http://opds-spec.org/2010/catalog">
  <id>${escapeXml(params.id)}</id>
  <title>${escapeXml(params.title)}</title>
  <updated>${escapeXml(params.updatedAt)}</updated>
  ${renderLinks(params.links)}
  ${entriesXml}
</feed>`;
}
