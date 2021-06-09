var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {get: all[name], enumerable: true});
};

// packages/intersect/builds/module.js
__markAsModule(exports);
__export(exports, {
  default: () => module_default
});

// packages/intersect/src/index.js
var pauseReactions = false;
function src_default(Alpine) {
  Alpine.directive("intersect", (el, {value, modifiers, expression}, {evaluateLater}) => {
    let evaluate = evaluateLater(expression);
    if (["out", "leave"].includes(value)) {
      el._x_intersectLeave(evaluate, modifiers);
    } else {
      el._x_intersectEnter(evaluate, modifiers);
    }
  });
}
window.Element.prototype._x_intersectEnter = function(callback, modifiers) {
  this._x_intersect((entry, observer) => {
    if (pauseReactions)
      return;
    pauseReactions = true;
    if (entry.intersectionRatio > 0) {
      callback();
      modifiers.includes("once") && observer.unobserve(this);
    }
    setTimeout(() => {
      pauseReactions = false;
    }, 100);
  });
};
window.Element.prototype._x_intersectLeave = function(callback, modifiers) {
  this._x_intersect((entry, observer) => {
    if (pauseReactions)
      return;
    pauseReactions = true;
    if (!entry.intersectionRatio > 0) {
      callback();
      modifiers.includes("once") && observer.unobserve(this);
    }
    setTimeout(() => {
      pauseReactions = false;
    }, 100);
  });
};
window.Element.prototype._x_intersect = function(callback) {
  let observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => callback(entry, observer));
  }, {});
  observer.observe(this);
  return observer;
};

// packages/intersect/builds/module.js
var module_default = src_default;
