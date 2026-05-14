  function renderLibrary() {
    const grid = $id("library-grid");
    const empty = $id("library-empty");
    if (!grid || !empty) {
      return;
    }

    let items = [...state.libraryItems];
    if (state.activeFilter === "ongoing") {
      items = items.filter((item) => String(item.status).toLowerCase() !== "completed");
    } else if (state.activeFilter === "completed") {
      items = items.filter((item) => String(item.status).toLowerCase() === "completed");
    } else if (state.activeFilter === "downloaded") {
      items = items.filter((item) => hasDownloadedChapters(item));
    }

    grid.innerHTML = "";
    if (!items.length) {
      grid.style.display = "none";
      empty.style.display = "flex";
      return;
    }

    grid.style.display = "grid";
    empty.style.display = "none";

    items.forEach((item) => {
      grid.appendChild(
        createNovelCard(item, {
          showProgress: true,
          onClick: () => navigateTo(libraryDetailPath(item.id))
        })
      );
    });
  }

