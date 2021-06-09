(() => {
  // packages/persist/src/index.js
  function src_default(Alpine) {
    Alpine.magic("persist", (el, {interceptor}) => {
      return interceptor((key, path) => {
        return {
          init(initialValue, setter) {
            if (localStorage.getItem(path)) {
              setter(localStorage.getItem(path));
            } else {
              setter(initialValue);
            }
          },
          set(value, setter) {
            localStorage.setItem(path, value);
            setter(value);
          }
        };
      });
    });
  }

  // packages/persist/builds/cdn.js
  document.addEventListener("alpine:initializing", () => {
    window.Alpine.plugin(src_default);
  });
})();
