"use strict";

(async () => {
  const chunkPaths = [
    "/assets/app.state.js",
    "/assets/app.utils.js",
    "/assets/app.api.js",
    "/assets/app.router.js",
    "/assets/app.dom.js",
    "/assets/app.library.js",
    "/assets/app.sources.js",
    "/assets/app.detail.js",
    "/assets/app.server.tasks.js",
    "/assets/app.server.extensions.js",
    "/assets/app.server.settings.js",
    "/assets/app.actions.js",
    "/assets/app.translations.js",
    "/assets/app.bootstrap.js"
  ];

  try {
    const responses = await Promise.all(
      chunkPaths.map(async (chunkPath) => {
        const response = await fetch(chunkPath, { credentials: "same-origin" });
        if (!response.ok) {
          throw new Error(`Failed to load ${chunkPath}: ${response.status}`);
        }
        return response.text();
      })
    );

    const source = ['"use strict";', '', '(() => {', responses.join("\n"), '})();'].join("\n");
    const appFactory = new Function(source);
    appFactory();
  } catch (error) {
    console.error("Failed to bootstrap app UI", error);
    document.documentElement.dataset.appLoadError = "true";
  }
})();

