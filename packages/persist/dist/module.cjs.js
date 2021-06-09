var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {get: all[name], enumerable: true});
};

// packages/persist/builds/module.js
__markAsModule(exports);
__export(exports, {
  default: () => module_default
});

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

// packages/persist/builds/module.js
var module_default = src_default;
