import type {
  SourceChapterContentPayload,
  SourceChapterPayload,
  SourceDetailPayload,
  SourceHandler,
  SourceHomeItem,
  SourceHomePayload,
  SourceListItem,
  SourceSearchPayload
} from "../types.js";

interface DemoChapter {
  title: string;
  html: string;
}

interface DemoNovel {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  description: string;
  status: string;
  genres: string[];
  chapters: DemoChapter[];
}

const demoNovels: DemoNovel[] = [
  {
    id: "dao-lo-trinh",
    title: "Dao Lo Trinh",
    author: "Core Demo",
    coverUrl: "https://placehold.co/240x320?text=Dao+Lo+Trinh",
    description:
      "Nguon core de test end-to-end. Truyen nay duoc dong goi san de kiem tra home, search, sync, build EPUB va OPDS.",
    status: "ongoing",
    genres: ["fantasy", "demo"],
    chapters: [
      {
        title: "Chuong 1: Khoi hanh",
        html: "<h1>Chuong 1</h1><p>Con duong doc sach bat dau tu mot server nhe.</p><p>Chapter nay dung de test build EPUB.</p>"
      },
      {
        title: "Chuong 2: Dong bo",
        html: "<h1>Chuong 2</h1><p>Worker dong bo danh sach chapter va dua noi dung qua pipeline.</p>"
      },
      {
        title: "Chuong 3: Phat hanh",
        html: "<h1>Chuong 3</h1><p>EPUB duoc publish vao OPDS voi _series.json canh chapter files.</p>"
      }
    ]
  },
  {
    id: "vu-tru-thu-vien",
    title: "Vu Tru Thu Vien",
    author: "Core Demo",
    coverUrl: "https://placehold.co/240x320?text=Vu+Tru+Thu+Vien",
    description:
      "Demo source thu hai de test search va library list. Noi dung don gian, toi uu cho smoke test tren Raspberry Pi.",
    status: "completed",
    genres: ["sci-fi", "demo"],
    chapters: [
      {
        title: "Chuong 1: Kho du lieu",
        html: "<h1>Kho du lieu</h1><p>Mot thu vien tot can metadata on dinh va queue nhe.</p>"
      },
      {
        title: "Chuong 2: OPDS",
        html: "<h1>OPDS</h1><p>Feed Atom la cau noi giua server va firmware CrossPoint.</p>"
      }
    ]
  }
];

function detailUrl(id: string) {
  return `builtin://core-demo/${id}`;
}

function chapterUrl(novelId: string, chapterIndex: number) {
  return `builtin://core-demo/${novelId}/chapters/${chapterIndex}`;
}

function toHomeItem(novel: DemoNovel): SourceHomeItem {
  return {
    id: novel.id,
    title: novel.title,
    author: novel.author,
    coverUrl: novel.coverUrl,
    description: novel.description,
    status: novel.status,
    detailUrl: detailUrl(novel.id)
  };
}

function findNovelByDetailUrl(url: string) {
  const novelId = url.split("/").at(-1) ?? "";
  return demoNovels.find((novel) => novel.id === novelId) ?? null;
}

export const coreDemoSource: SourceListItem = {
  id: "core-demo",
  name: "Core Demo Source",
  trustType: "core",
  version: "1.0.0",
  enabled: true,
  runtimeKind: "builtin",
  runtimeSupported: true,
  description: "Bundled source for end-to-end smoke tests and first deploy validation.",
  sourceUrl: "builtin://core-demo",
  author: "CrossPoint Reader",
  locale: "vi_VN",
  type: "novel",
  supportsHome: true,
  supportsSearch: true,
  supportsGenre: false,
  supportsPagination: false,
  supportsDetailDescription: true,
  supportsBrowserAutomation: false
};

export const coreDemoRuntime: SourceHandler = {
  async home(): Promise<SourceHomePayload> {
    return {
      source: {
        id: coreDemoSource.id,
        name: coreDemoSource.name,
        description: coreDemoSource.description,
        runtimeSupported: true
      },
      sections: [
        {
          id: "featured",
          title: "Trang chu",
          items: demoNovels.map(toHomeItem)
        }
      ]
    };
  },

  async search(query: string, page?: string): Promise<SourceSearchPayload> {
    const normalizedQuery = query.trim().toLowerCase();
    const items = demoNovels
      .filter((novel) => {
        if (!normalizedQuery) {
          return true;
        }
        return [novel.title, novel.author, novel.description]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .map(toHomeItem);

    return {
      source: {
        id: coreDemoSource.id,
        name: coreDemoSource.name,
        runtimeSupported: true
      },
      query,
      page: page ?? null,
      nextPage: null,
      items
    };
  },

  async detail(detailLink: string): Promise<SourceDetailPayload> {
    const novel = findNovelByDetailUrl(detailLink);
    if (!novel) {
      throw new Error("Demo novel not found");
    }

    return {
      id: novel.id,
      sourceId: coreDemoSource.id,
      title: novel.title,
      author: novel.author,
      coverUrl: novel.coverUrl,
      description: novel.description,
      status: novel.status,
      genres: novel.genres,
      sourceUrl: detailUrl(novel.id)
    };
  },

  async chapters(detailLink: string): Promise<SourceChapterPayload[]> {
    const novel = findNovelByDetailUrl(detailLink);
    if (!novel) {
      throw new Error("Demo novel not found");
    }

    return novel.chapters.map((chapter, index) => ({
      chapterIndex: index + 1,
      title: chapter.title,
      sourceUrl: chapterUrl(novel.id, index + 1)
    }));
  },

  async chapterContent(chapterLink: string): Promise<SourceChapterContentPayload> {
    const parts = chapterLink.split("/");
    const chapterIndex = Number(parts.at(-1) ?? "0");
    const novelId = parts.at(-3) ?? "";
    const novel = demoNovels.find((entry) => entry.id === novelId);
    const chapter = novel?.chapters[chapterIndex - 1];

    if (!novel || !chapter) {
      throw new Error("Demo chapter not found");
    }

    return {
      title: chapter.title,
      html: chapter.html
    };
  }
};
