// Simple hash-based navigation between pages.
(function () {
  const pages = ["home", "binomial", "poisson", "geometric"];

  function show() {
    let name = location.hash.replace("#", "");
    if (!pages.includes(name)) name = "home";

    document.querySelectorAll(".page").forEach(function (el) {
      el.classList.toggle("active", el.id === "page-" + name);
    });
    document.querySelectorAll("nav a").forEach(function (a) {
      a.classList.toggle("active", a.dataset.page === name);
      if (a.dataset.page === name) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });

    // Re-render once visible so the chart takes the real width and the table
    // can scroll the selected row into view.
    if (name !== "home") {
      document.getElementById("page-" + name).dispatchEvent(new Event("input"));
    }
  }

  window.addEventListener("hashchange", show);

  // Redraw the visible chart at its new width when the window is resized.
  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(show, 150);
  });
  show();
})();
