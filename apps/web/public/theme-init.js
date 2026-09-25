// Applies the saved theme before first paint to avoid a flash of the wrong theme.
// Loaded as an external file so it works under the strict script-src CSP.
(function () {
  try {
    var t = localStorage.getItem('theme') || 'system';
    var dark = t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {
    // Storage or matchMedia unavailable; fall back to the default light theme.
  }
})();
