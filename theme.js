(() => {
  const storageKey = "bb-style";
  const root = document.documentElement;
  const styles = [
    { id: "terminal", label: "Terminal" },
    { id: "arcade-night", label: "Arcade Night" },
    { id: "vector-field", label: "Vector Field" },
    { id: "red-grid", label: "Red Grid City" },
  ];

  const findStyle = (id) => styles.find((style) => style.id === id);

  let selectedStyle;
  try {
    selectedStyle = findStyle(localStorage.getItem(storageKey));
  } catch {
    // The default style still works when storage is unavailable.
  }

  if (!selectedStyle) selectedStyle = findStyle("vector-field");

  root.dataset.style = selectedStyle.id;

  document.addEventListener("DOMContentLoaded", () => {
    const toggles = document.querySelectorAll(".style-toggle");

    const currentIndex = () => {
      const index = styles.findIndex((style) => style.id === root.dataset.style);
      return index === -1 ? 0 : index;
    };

    const updateLabels = () => {
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
