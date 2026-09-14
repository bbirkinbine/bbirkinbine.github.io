(() => {
  const storageKey = "bb-theme";
  const root = document.documentElement;

  try {
    const savedTheme = localStorage.getItem(storageKey);
    if (savedTheme === "light" || savedTheme === "dark") {
      root.dataset.theme = savedTheme;
    }
  } catch {
    // The system theme still works when storage is unavailable.
  }

  document.addEventListener("DOMContentLoaded", () => {
    const toggles = document.querySelectorAll(".theme-toggle");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

    const resolvedTheme = () => root.dataset.theme || (systemTheme.matches ? "dark" : "light");

    const updateLabels = () => {
      const nextTheme = resolvedTheme() === "dark" ? "light" : "dark";
      toggles.forEach((toggle) => {
        toggle.setAttribute("aria-label", `Switch to ${nextTheme} theme`);
      });
    };

    toggles.forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const nextTheme = resolvedTheme() === "dark" ? "light" : "dark";
        root.dataset.theme = nextTheme;
        try {
          localStorage.setItem(storageKey, nextTheme);
        } catch {
          // The selected theme remains active for this page view.
        }
        updateLabels();
      });
    });

    systemTheme.addEventListener("change", updateLabels);
    updateLabels();
  });
})();
