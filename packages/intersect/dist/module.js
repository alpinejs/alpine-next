// packages/intersect/src/index.js
import {evaluateLater} from "alpinejs/src/evaluator";
var pauseReactions = false;
function intersect(el, {value, modifiers, expression}) {
  let evaluate = evaluateLater(el, expression);
  if (["out", "leave"].includes(value)) {
    el._x_intersectLeave(evaluate, modifiers);
  } else {
    el._x_intersectEnter(evaluate, modifiers);
  }
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
var module_default = intersect;
export {
  module_default as default
};
