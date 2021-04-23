(() => {
  // packages/alpinejs/src/magics.js
  var magics = {};
  function injectMagics(obj, el) {
    Object.entries(magics).forEach(([name, callback]) => {
      Object.defineProperty(obj, `$${name}`, {
        get() {
          return callback(el);
        },
        enumerable: true
      });
    });
  }

  // packages/alpinejs/src/scope.js
  function closestDataStack(node) {
    if (node._x_dataStack)
      return node._x_dataStack;
    if (node instanceof ShadowRoot) {
      return closestDataStack(node.host);
    }
    if (!node.parentNode) {
      return [];
    }
    return closestDataStack(node.parentNode);
  }
  function mergeProxies(objects) {
    return new Proxy({}, {
      ownKeys: () => {
        return Array.from(new Set(objects.flatMap((i) => Object.keys(i))));
      },
      has: (target, name) => {
        return (objects.find((object) => Object.keys(object).includes(name)) || {})[name] !== void 0;
      },
      get: (target, name) => {
        return (objects.find((object) => Object.keys(object).includes(name)) || {})[name];
      },
      set: (target, name, value) => {
        let closestObjectWithKey = objects.find((object) => Object.keys(object).includes(name));
        if (closestObjectWithKey) {
          closestObjectWithKey[name] = value;
        } else {
          objects[objects.length - 1][name] = value;
        }
        return true;
      }
    });
  }

  // packages/alpinejs/src/evaluator.js
  function evaluateLater(...args) {
    return theEvaluatorFunction(...args);
  }
  var theEvaluatorFunction = normalEvaluator;
  function normalEvaluator(el, expression) {
    let overriddenMagics = {};
    injectMagics(overriddenMagics, el);
    let dataStack = [overriddenMagics, ...closestDataStack(el)];
    if (typeof expression === "function") {
      return generateEvaluatorFromFunction(dataStack, expression);
    }
    let evaluator = generateEvaluatorFromString(dataStack, expression);
    return tryCatch.bind(null, el, expression, evaluator);
  }
  function generateEvaluatorFromFunction(dataStack, func) {
    return (receiver = () => {
    }, {scope = {}, params = []} = {}) => {
      let result = func.apply(mergeProxies([scope, ...dataStack]), params);
      if (result instanceof Promise) {
        result.then((i) => runIfTypeOfFunction(receiver, i));
      }
      runIfTypeOfFunction(receiver, result);
    };
  }
  function generateEvaluatorFromString(dataStack, expression) {
    let AsyncFunction = Object.getPrototypeOf(async function() {
    }).constructor;
    let func = new AsyncFunction(["__self", "scope"], `with (scope) { __self.result = ${expression} }; __self.finished = true; return __self.result;`);
    return (receiver = () => {
    }, {scope = {}, params = []} = {}) => {
      func.result = void 0;
      func.finished = false;
      let completeScope = mergeProxies([scope, ...dataStack]);
      let promise = func(func, completeScope);
      if (func.finished) {
        runIfTypeOfFunction(receiver, func.result, completeScope, params);
      } else {
        promise.then((result) => {
          runIfTypeOfFunction(receiver, result, completeScope, params);
        });
      }
    };
  }
  function runIfTypeOfFunction(receiver, value, scope, params) {
    if (typeof value === "function") {
      receiver(value.apply(scope, params));
    } else {
      receiver(value);
    }
  }
  function tryCatch(el, expression, callback, ...args) {
    try {
      return callback(...args);
    } catch (e) {
      console.log(callback.toString());
      console.warn(`Alpine Expression Error: ${e.message}

Expression: "${expression}"

`, el);
      throw e;
    }
  }

  // packages/intersect/src/index.js
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

  // packages/intersect/builds/cdn.js
  document.addEventListener("alpine:initializing", () => {
    window.Alpine.directive("intersect", intersect);
  });
})();
