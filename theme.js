(() => {
  const storageKey = "bb-style";
  const originUnlockKey = "bb-origin-code-unlocked";
  const joshuaUnlockKey = "bb-joshua-game-unlocked";
  const woprUnlockKey = "bb-wopr-theme-unlocked";
  const root = document.documentElement;
  const standardStyles = [
    { id: "terminal", label: "Terminal" },
    { id: "arcade-night", label: "Arcade Night" },
    { id: "vector-field", label: "Vector Field" },
    { id: "red-grid", label: "Red Grid City" },
  ];
  const originStyle = { id: "origin-code", label: "Origin Code" };
  const woprStyle = { id: "wopr", label: "WOPR" };
  let styles = [...standardStyles];
  let savedStyleId;
  let originUnlocked = false;
  let woprUnlocked = false;
  let updateLabels = () => {};

  const rebuildStyles = () => {
    styles = [
      ...standardStyles,
      ...(originUnlocked ? [originStyle] : []),
      ...(woprUnlocked ? [woprStyle] : []),
    ];
  };

  const resetRequested = /(?:^|[?&])reset-easter-eggs=1(?:&|$)/.test(
    globalThis.location?.search ?? "",
  );

  if (resetRequested) {
    try {
      [storageKey, originUnlockKey, joshuaUnlockKey, woprUnlockKey]
        .forEach((key) => localStorage.removeItem(key));
    } catch {
      // The normal defaults still apply when storage is unavailable.
    }

    if (globalThis.history?.replaceState && globalThis.location) {
      globalThis.history.replaceState(
        null,
        "",
        `${globalThis.location.pathname}${globalThis.location.hash}`,
      );
    }
  }

  const findStyle = (id) => styles.find((style) => style.id === id);

  try {
    savedStyleId = localStorage.getItem(storageKey);
    originUnlocked = localStorage.getItem(originUnlockKey) === "1"
      || savedStyleId === originStyle.id;
    woprUnlocked = localStorage.getItem(woprUnlockKey) === "1"
      || savedStyleId === woprStyle.id;
  } catch {
    // The default style still works when storage is unavailable.
  }

  rebuildStyles();

  let selectedStyle = findStyle(savedStyleId);

  if (!selectedStyle) selectedStyle = findStyle("vector-field");

  root.dataset.style = selectedStyle.id;

  document.addEventListener("bb:unlock-origin-code", () => {
    originUnlocked = true;
    rebuildStyles();
    root.dataset.style = originStyle.id;

    try {
      localStorage.setItem(originUnlockKey, "1");
      localStorage.setItem(storageKey, originStyle.id);
    } catch {
      // The unlocked style remains active for this page view.
    }

    updateLabels();
  });

  document.addEventListener("bb:unlock-wopr", () => {
    woprUnlocked = true;
    rebuildStyles();
    root.dataset.style = woprStyle.id;

    try {
      localStorage.setItem(woprUnlockKey, "1");
      localStorage.setItem(storageKey, woprStyle.id);
    } catch {
      // The unlocked style remains active for this page view.
    }

    updateLabels();
  });

  document.addEventListener("DOMContentLoaded", () => {
    const toggles = document.querySelectorAll(".style-toggle");

    const currentIndex = () => {
      const index = styles.findIndex((style) => style.id === root.dataset.style);
      return index === -1 ? 0 : index;
    };

    updateLabels = () => {
      const current = styles[currentIndex()];
      const next = styles[(currentIndex() + 1) % styles.length];

      toggles.forEach((toggle) => {
        toggle.setAttribute(
          "aria-label",
          `Switch visual style. Current: ${current.label}. Next: ${next.label}`,
        );
        toggle.setAttribute("title", `Style: ${current.label}`);
      });
    };

    toggles.forEach((toggle) => {
      toggle.addEventListener("click", (event) => {
        const next = styles[(currentIndex() + 1) % styles.length];
        root.dataset.style = next.id;

        try {
          localStorage.setItem(storageKey, next.id);
        } catch {
          // The selected style remains active for this page view.
        }

        updateLabels();

        if (event.detail > 0) toggle.blur();
      });
    });

    updateLabels();
  });
})();
