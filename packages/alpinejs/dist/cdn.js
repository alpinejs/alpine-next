(() => {
  // packages/alpinejs/src/reactivity.js
  var reactive;
  var effect;
  function setReactivity(reactiveFunction, effectFunction) {
    window.effect = effectFunction;
    window.reactive = reactiveFunction;
    reactive = reactiveFunction;
    effect = effectFunction;
  }

  // packages/alpinejs/src/directives.js
  var prefixAsString = "x-";
  function prefix(subject = "") {
    return prefixAsString + subject;
  }
  function setPrefix(newPrefix) {
    prefixAsString = newPrefix;
  }
  var directiveHandlers = {};
  function directive(name, callback) {
    directiveHandlers[name] = callback;
  }
  function handleDirective(el, directive2) {
    getDirectiveHandler(el, directive2)();
  }
  function getDirectiveHandler(el, directive2) {
    let noop = () => {
    };
    let handler3 = directiveHandlers[directive2.type] || noop;
    handler3.inline && handler3.inline(el, directive2);
    return handler3.bind(handler3, el, directive2);
  }
  function directives(el, alternativeAttributes) {
    return Array.from(alternativeAttributes || el.attributes).map(toTransformedAttributes).filter(outNonAlpineAttributes).map(toParsedDirectives).sort(byPriority);
  }
  var startingWith = (subject, replacement) => ({name, value}) => {
    if (name.startsWith(subject))
      name = name.replace(subject, replacement);
    return {name, value};
  };
  var into = (i2) => i2;
  function toTransformedAttributes({name, value}) {
    return attributeTransformers.reduce((carry, transform) => {
      return transform(carry);
    }, {name, value});
  }
  var attributeTransformers = [];
  function mapAttributes(callback) {
    attributeTransformers.push(callback);
  }
  function outNonAlpineAttributes({name}) {
    return alpineAttributeRegex().test(name);
  }
  var alpineAttributeRegex = () => new RegExp(`^${prefixAsString}([^:^.]+)\\b`);
  function toParsedDirectives({name, value}) {
    let typeMatch = name.match(alpineAttributeRegex());
    let valueMatch = name.match(/:([a-zA-Z0-9\-:]+)/);
    let modifiers = name.match(/\.[^.\]]+(?=[^\]]*$)/g) || [];
    return {
      type: typeMatch ? typeMatch[1] : null,
      value: valueMatch ? valueMatch[1] : null,
      modifiers: modifiers.map((i2) => i2.replace(".", "")),
      expression: value
    };
  }
  var DEFAULT = "DEFAULT";
  var directiveOrder = [
    "ignore",
    "data",
    "bind",
    "ref",
    "init",
    "for",
    "model",
    "transition",
    "show",
    "if",
    DEFAULT,
    "element"
  ];
  function byPriority(a2, b2) {
    let typeA = directiveOrder.indexOf(a2.type) === -1 ? DEFAULT : a2.type;
    let typeB = directiveOrder.indexOf(b2.type) === -1 ? DEFAULT : b2.type;
    return directiveOrder.indexOf(typeA) - directiveOrder.indexOf(typeB);
  }

  // packages/alpinejs/src/utils/dispatch.js
  function dispatch(el, name, detail = {}) {
    el.dispatchEvent(new CustomEvent(name, {
      detail,
      bubbles: true,
      composed: true
    }));
  }

  // packages/alpinejs/src/nextTick.js
  var tickStack = [];
  var isHolding = false;
  function nextTick(callback) {
    tickStack.push(callback);
    queueMicrotask(() => {
      isHolding || setTimeout(() => {
        releaseNextTicks();
      });
    });
  }
  function releaseNextTicks() {
    isHolding = false;
    while (tickStack.length)
      tickStack.shift()();
  }
  function holdNextTicks() {
    isHolding = true;
  }

  // packages/alpinejs/src/utils/walk.js
  function walk(el, callback) {
    if (el instanceof ShadowRoot) {
      Array.from(el.children).forEach((el2) => walk(el2, callback));
      return;
    }
    let skip = false;
    callback(el, () => skip = true);
    if (skip)
      return;
    let node = el.firstElementChild;
    while (node) {
      walk(node, callback, false);
      node = node.nextElementSibling;
    }
  }

  // packages/alpinejs/src/utils/warn.js
  function warn(message, ...args) {
    console.warn(`Alpine Warning: ${message}`, ...args);
  }

  // packages/alpinejs/src/lifecycle.js
  function start() {
    if (!document.body)
      warn("Unable to initialize. Trying to load Alpine before `<body>` is available. Did you forget to add `defer` in Alpine's `<script>` tag?");
    dispatch(document, "alpine:initializing");
    listenForAndReactToDomManipulations(document.body);
    let outNestedComponents = (el) => !closestRoot(el.parentNode || closestRoot(el));
    Array.from(document.querySelectorAll(rootSelectors().join(", "))).filter(outNestedComponents).forEach((el) => initTree(el));
    dispatch(document, "alpine:initialized");
  }
  var rootSelectorCallbacks = [];
  function rootSelectors() {
    return rootSelectorCallbacks.map((fn) => fn());
  }
  function addRootSelector(selectorCallback) {
    rootSelectorCallbacks.push(selectorCallback);
  }
  function closestRoot(el) {
    if (rootSelectors().some((selector) => el.matches(selector)))
      return el;
    if (!el.parentElement)
      return;
    return closestRoot(el.parentElement);
  }
  function initTree(el) {
    deferHandlingDirectives((handleDirective2) => {
      walk(el, (el2, skip) => {
        directives(el2).forEach((directive2) => {
          if (el2._x_ignore || el2._x_ignore_self)
            return;
          handleDirective2(el2, directive2);
        });
        if (el2._x_ignore)
          skip();
      });
    });
  }
  var onDestroys = new WeakMap();
  function onDestroy(el, callback) {
    if (!onDestroys.get(el))
      onDestroys.set(el, []);
    onDestroys.get(el).push(callback);
  }
  function destroyTree(root) {
    walk(root, (el) => {
      let callbacks = onDestroys.get(el);
      callbacks && callbacks.forEach((callback) => callback());
    });
  }
  function listenForAndReactToDomManipulations(el) {
    let observer = new MutationObserver((mutations) => {
      let addeds = mutations.flatMap((i2) => Array.from(i2.addedNodes));
      let removeds = mutations.flatMap((i2) => Array.from(i2.removedNodes));
      for (let node of addeds) {
        if (node.nodeType !== 1)
          continue;
        if (removeds.includes(node))
          continue;
        if (node._x_ignoreMutationObserver)
          continue;
        initTree(node);
      }
      for (let node of removeds) {
        if (node.nodeType !== 1)
          continue;
        if (addeds.includes(node))
          continue;
        if (node._x_ignoreMutationObserver)
          continue;
        nextTick(() => destroyTree(node));
      }
    });
    observer.observe(el, {subtree: true, childList: true, deep: false});
  }

  // packages/alpinejs/src/magics.js
  var magics = {};
  function magic(name, callback) {
    magics[name] = callback;
  }
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
  function addScopeToNode(node, data, referenceNode) {
    node._x_dataStack = [data, ...closestDataStack(referenceNode || node)];
  }
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
        return Array.from(new Set(objects.flatMap((i2) => Object.keys(i2))));
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
  function evaluate(el, expression, extras = {}) {
    let result;
    evaluateLater(el, expression)((value) => result = value, extras);
    return result;
  }
  function evaluateLater(...args) {
    return theEvaluatorFunction(...args);
  }
  var theEvaluatorFunction = normalEvaluator;
  function setEvaluator(newEvaluator) {
    theEvaluatorFunction = newEvaluator;
  }
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
        result.then((i2) => runIfTypeOfFunction(receiver, i2));
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

  // packages/alpinejs/src/components.js
  var components = {};
  function component(name, callback) {
    components[name] = callback;
  }
  function getComponent(name) {
    return components[name];
  }

  // packages/alpinejs/src/store.js
  var stores = {};
  function store(name, object) {
    stores[name] = this.reactive(object);
  }
  function getStore(name) {
    return stores[name];
  }

  // packages/alpinejs/src/clone.js
  var isCloning = false;
  function skipDuringClone(callback) {
    return (...args) => isCloning || callback(...args);
  }
  function clone(oldEl, newEl) {
    newEl._x_dataStack = oldEl._x_dataStack;
    isCloning = true;
    initTree(newEl);
    isCloning = false;
  }

  // packages/alpinejs/src/alpine.js
  var Alpine = {
    addRootSelector,
    setReactivity,
    mapAttributes,
    setEvaluator,
    evaluate,
    evaluateLater,
    component,
    directive,
    nextTick,
    reactive,
    effect,
    prefix: setPrefix,
    magic,
    store,
    start,
    clone
  };
  var alpine_default = Alpine;

  // node_modules/@vue/reactivity/dist/reactivity.esm-browser.prod.js
  var t = {};
  var n = Object.assign;
  var r = Object.prototype.hasOwnProperty;
  var s = (t2, e) => r.call(t2, e);
  var i = Array.isArray;
  var o = (t2) => f(t2) === "[object Map]";
  var u = (t2) => typeof t2 == "symbol";
  var a = (t2) => t2 !== null && typeof t2 == "object";
  var l = Object.prototype.toString;
  var f = (t2) => l.call(t2);
  var h = (t2) => typeof t2 == "string" && t2 !== "NaN" && t2[0] !== "-" && "" + parseInt(t2, 10) === t2;
  var _ = (t2, e) => t2 !== e && (t2 == t2 || e == e);
  var v = new WeakMap();
  var d = [];
  var p;
  var g = Symbol("");
  var y = Symbol("");
  function w(e, n2 = t) {
    (function(t2) {
      return t2 && t2._isEffect === true;
    })(e) && (e = e.raw);
    const r2 = function(t2, e2) {
      const n3 = function() {
        if (!n3.active)
          return e2.scheduler ? void 0 : t2();
        if (!d.includes(n3)) {
          S(n3);
          try {
            return j(), d.push(n3), p = n3, t2();
          } finally {
            d.pop(), O(), p = d[d.length - 1];
          }
        }
      };
      return n3.id = b++, n3.allowRecurse = !!e2.allowRecurse, n3._isEffect = true, n3.active = true, n3.raw = t2, n3.deps = [], n3.options = e2, n3;
    }(e, n2);
    return n2.lazy || r2(), r2;
  }
  var b = 0;
  function S(t2) {
    const {deps: e} = t2;
    if (e.length) {
      for (let n2 = 0; n2 < e.length; n2++)
        e[n2].delete(t2);
      e.length = 0;
    }
  }
  var k = true;
  var E = [];
  function m() {
    E.push(k), k = false;
  }
  function j() {
    E.push(k), k = true;
  }
  function O() {
    const t2 = E.pop();
    k = t2 === void 0 || t2;
  }
  function P(t2, e, n2) {
    if (!k || p === void 0)
      return;
    let r2 = v.get(t2);
    r2 || v.set(t2, r2 = new Map());
    let s2 = r2.get(n2);
    s2 || r2.set(n2, s2 = new Set()), s2.has(p) || (s2.add(p), p.deps.push(s2));
  }
  function x(t2, e, n2, r2, s2, c) {
    const u2 = v.get(t2);
    if (!u2)
      return;
    const a2 = new Set(), l2 = (t3) => {
      t3 && t3.forEach((t4) => {
        (t4 !== p || t4.allowRecurse) && a2.add(t4);
      });
    };
    if (e === "clear")
      u2.forEach(l2);
    else if (n2 === "length" && i(t2))
      u2.forEach((t3, e2) => {
        (e2 === "length" || e2 >= r2) && l2(t3);
      });
    else
      switch (n2 !== void 0 && l2(u2.get(n2)), e) {
        case "add":
          i(t2) ? h(n2) && l2(u2.get("length")) : (l2(u2.get(g)), o(t2) && l2(u2.get(y)));
          break;
        case "delete":
          i(t2) || (l2(u2.get(g)), o(t2) && l2(u2.get(y)));
          break;
        case "set":
          o(t2) && l2(u2.get(g));
      }
    a2.forEach((t3) => {
      t3.options.scheduler ? t3.options.scheduler(t3) : t3();
    });
  }
  var z = new Set(Object.getOwnPropertyNames(Symbol).map((t2) => Symbol[t2]).filter(u));
  var M = I();
  var A = I(false, true);
  var W = I(true);
  var N = I(true, true);
  var V = {};
  function I(t2 = false, e = false) {
    return function(n2, r2, o2) {
      if (r2 === "__v_isReactive")
        return !t2;
      if (r2 === "__v_isReadonly")
        return t2;
      if (r2 === "__v_raw" && o2 === (t2 ? lt : at).get(n2))
        return n2;
      const c = i(n2);
      if (!t2 && c && s(V, r2))
        return Reflect.get(V, r2, o2);
      const l2 = Reflect.get(n2, r2, o2);
      if (u(r2) ? z.has(r2) : r2 === "__proto__" || r2 === "__v_isRef")
        return l2;
      if (t2 || P(n2, 0, r2), e)
        return l2;
      if (kt(l2)) {
        return !c || !h(r2) ? l2.value : l2;
      }
      return a(l2) ? t2 ? vt(l2) : ht(l2) : l2;
    };
  }
  ["includes", "indexOf", "lastIndexOf"].forEach((t2) => {
    const e = Array.prototype[t2];
    V[t2] = function(...t3) {
      const n2 = Rt(this);
      for (let e2 = 0, s2 = this.length; e2 < s2; e2++)
        P(n2, 0, e2 + "");
      const r2 = e.apply(n2, t3);
      return r2 === -1 || r2 === false ? e.apply(n2, t3.map(Rt)) : r2;
    };
  }), ["push", "pop", "shift", "unshift", "splice"].forEach((t2) => {
    const e = Array.prototype[t2];
    V[t2] = function(...t3) {
      m();
      const n2 = e.apply(this, t3);
      return O(), n2;
    };
  });
  function K(t2 = false) {
    return function(e, n2, r2, o2) {
      const c = e[n2];
      if (!t2 && (r2 = Rt(r2), !i(e) && kt(c) && !kt(r2)))
        return c.value = r2, true;
      const u2 = i(e) && h(n2) ? Number(n2) < e.length : s(e, n2), a2 = Reflect.set(e, n2, r2, o2);
      return e === Rt(o2) && (u2 ? _(r2, c) && x(e, "set", n2, r2) : x(e, "add", n2, r2)), a2;
    };
  }
  var B = {get: M, set: K(), deleteProperty: function(t2, e) {
    const n2 = s(t2, e), r2 = Reflect.deleteProperty(t2, e);
    return r2 && n2 && x(t2, "delete", e, void 0), r2;
  }, has: function(t2, e) {
    const n2 = Reflect.has(t2, e);
    return u(e) && z.has(e) || P(t2, 0, e), n2;
  }, ownKeys: function(t2) {
    return P(t2, 0, i(t2) ? "length" : g), Reflect.ownKeys(t2);
  }};
  var q = {get: W, set: (t2, e) => true, deleteProperty: (t2, e) => true};
  var C = n({}, B, {get: A, set: K(true)});
  var D = n({}, q, {get: N});
  var F = (t2) => a(t2) ? ht(t2) : t2;
  var G = (t2) => a(t2) ? vt(t2) : t2;
  var H = (t2) => t2;
  var J = (t2) => Reflect.getPrototypeOf(t2);
  function L(t2, e, n2 = false, r2 = false) {
    const s2 = Rt(t2 = t2.__v_raw), i2 = Rt(e);
    e !== i2 && !n2 && P(s2, 0, e), !n2 && P(s2, 0, i2);
    const {has: o2} = J(s2), c = n2 ? G : r2 ? H : F;
    return o2.call(s2, e) ? c(t2.get(e)) : o2.call(s2, i2) ? c(t2.get(i2)) : void 0;
  }
  function Q(t2, e = false) {
    const n2 = this.__v_raw, r2 = Rt(n2), s2 = Rt(t2);
    return t2 !== s2 && !e && P(r2, 0, t2), !e && P(r2, 0, s2), t2 === s2 ? n2.has(t2) : n2.has(t2) || n2.has(s2);
  }
  function T(t2, e = false) {
    return t2 = t2.__v_raw, !e && P(Rt(t2), 0, g), Reflect.get(t2, "size", t2);
  }
  function U(t2) {
    t2 = Rt(t2);
    const e = Rt(this), n2 = J(e).has.call(e, t2);
    return e.add(t2), n2 || x(e, "add", t2, t2), this;
  }
  function X(t2, e) {
    e = Rt(e);
    const n2 = Rt(this), {has: r2, get: s2} = J(n2);
    let i2 = r2.call(n2, t2);
    i2 || (t2 = Rt(t2), i2 = r2.call(n2, t2));
    const o2 = s2.call(n2, t2);
    return n2.set(t2, e), i2 ? _(e, o2) && x(n2, "set", t2, e) : x(n2, "add", t2, e), this;
  }
  function Y(t2) {
    const e = Rt(this), {has: n2, get: r2} = J(e);
    let s2 = n2.call(e, t2);
    s2 || (t2 = Rt(t2), s2 = n2.call(e, t2));
    r2 && r2.call(e, t2);
    const i2 = e.delete(t2);
    return s2 && x(e, "delete", t2, void 0), i2;
  }
  function Z() {
    const t2 = Rt(this), e = t2.size !== 0, n2 = t2.clear();
    return e && x(t2, "clear", void 0, void 0), n2;
  }
  function $(t2, e) {
    return function(n2, r2) {
      const s2 = this, i2 = s2.__v_raw, o2 = Rt(i2), c = t2 ? G : e ? H : F;
      return !t2 && P(o2, 0, g), i2.forEach((t3, e2) => n2.call(r2, c(t3), c(e2), s2));
    };
  }
  function tt(t2, e, n2) {
    return function(...r2) {
      const s2 = this.__v_raw, i2 = Rt(s2), c = o(i2), u2 = t2 === "entries" || t2 === Symbol.iterator && c, a2 = t2 === "keys" && c, l2 = s2[t2](...r2), f2 = e ? G : n2 ? H : F;
      return !e && P(i2, 0, a2 ? y : g), {next() {
        const {value: t3, done: e2} = l2.next();
        return e2 ? {value: t3, done: e2} : {value: u2 ? [f2(t3[0]), f2(t3[1])] : f2(t3), done: e2};
      }, [Symbol.iterator]() {
        return this;
      }};
    };
  }
  function et(t2) {
    return function(...e) {
      return t2 !== "delete" && this;
    };
  }
  var nt = {get(t2) {
    return L(this, t2);
  }, get size() {
    return T(this);
  }, has: Q, add: U, set: X, delete: Y, clear: Z, forEach: $(false, false)};
  var rt = {get(t2) {
    return L(this, t2, false, true);
  }, get size() {
    return T(this);
  }, has: Q, add: U, set: X, delete: Y, clear: Z, forEach: $(false, true)};
  var st = {get(t2) {
    return L(this, t2, true);
  }, get size() {
    return T(this, true);
  }, has(t2) {
    return Q.call(this, t2, true);
  }, add: et("add"), set: et("set"), delete: et("delete"), clear: et("clear"), forEach: $(true, false)};
  function it(t2, e) {
    const n2 = e ? rt : t2 ? st : nt;
    return (e2, r2, i2) => r2 === "__v_isReactive" ? !t2 : r2 === "__v_isReadonly" ? t2 : r2 === "__v_raw" ? e2 : Reflect.get(s(n2, r2) && r2 in e2 ? n2 : e2, r2, i2);
  }
  ["keys", "values", "entries", Symbol.iterator].forEach((t2) => {
    nt[t2] = tt(t2, false, false), st[t2] = tt(t2, true, false), rt[t2] = tt(t2, false, true);
  });
  var ot = {get: it(false, false)};
  var ct = {get: it(false, true)};
  var ut = {get: it(true, false)};
  var at = new WeakMap();
  var lt = new WeakMap();
  function ft(t2) {
    return t2.__v_skip || !Object.isExtensible(t2) ? 0 : function(t3) {
      switch (t3) {
        case "Object":
        case "Array":
          return 1;
        case "Map":
        case "Set":
        case "WeakMap":
        case "WeakSet":
          return 2;
        default:
          return 0;
      }
    }(((t3) => f(t3).slice(8, -1))(t2));
  }
  function ht(t2) {
    return t2 && t2.__v_isReadonly ? t2 : pt(t2, false, B, ot);
  }
  function vt(t2) {
    return pt(t2, true, q, ut);
  }
  function pt(t2, e, n2, r2) {
    if (!a(t2))
      return t2;
    if (t2.__v_raw && (!e || !t2.__v_isReactive))
      return t2;
    const s2 = e ? lt : at, i2 = s2.get(t2);
    if (i2)
      return i2;
    const o2 = ft(t2);
    if (o2 === 0)
      return t2;
    const c = new Proxy(t2, o2 === 2 ? r2 : n2);
    return s2.set(t2, c), c;
  }
  function Rt(t2) {
    return t2 && Rt(t2.__v_raw) || t2;
  }
  function kt(t2) {
    return Boolean(t2 && t2.__v_isRef === true);
  }

  // packages/alpinejs/src/magics/$nextTick.js
  magic("nextTick", () => nextTick);

  // packages/alpinejs/src/magics/$dispatch.js
  magic("dispatch", (el) => dispatch.bind(dispatch, el));

  // packages/alpinejs/src/magics/$effect.js
  magic("effect", () => (callback) => effect(callback));

  // packages/alpinejs/src/magics/$watch.js
  magic("watch", (el) => (key, callback) => {
    let evaluate2 = evaluateLater(el, key);
    let firstTime = true;
    effect(() => evaluate2((value) => {
      let div = document.createElement("div");
      div.dataset.throwAway = value;
      if (!firstTime)
        callback(value);
      firstTime = false;
    }));
  });

  // packages/alpinejs/src/magics/$store.js
  magic("store", () => (name) => getStore(name));

  // packages/alpinejs/src/magics/$refs.js
  magic("refs", (el) => closestRoot(el)._x_refs || {});

  // packages/alpinejs/src/magics/$el.js
  magic("el", (el) => el);

  // packages/alpinejs/src/utils/classes.js
  function setClasses(el, value) {
    if (Array.isArray(value)) {
      return setClassesFromString(el, value.join(" "));
    } else if (typeof value === "object" && value !== null) {
      return setClassesFromObject(el, value);
    }
    return setClassesFromString(el, value);
  }
  function setClassesFromString(el, classString) {
    let split = (classString2) => classString2.split(" ").filter(Boolean);
    let missingClasses = (classString2) => classString2.split(" ").filter((i2) => !el.classList.contains(i2)).filter(Boolean);
    let addClassesAndReturnUndo = (classes) => {
      el.classList.add(...classes);
      return () => {
        el.classList.remove(...classes);
      };
    };
    classString = classString === true ? classString = "" : classString || "";
    return addClassesAndReturnUndo(missingClasses(classString));
  }
  function setClassesFromObject(el, classObject) {
    let split = (classString) => classString.split(" ").filter(Boolean);
    let forAdd = Object.entries(classObject).flatMap(([classString, bool]) => bool ? split(classString) : false).filter(Boolean);
    let forRemove = Object.entries(classObject).flatMap(([classString, bool]) => !bool ? split(classString) : false).filter(Boolean);
    let added = [];
    let removed = [];
    forAdd.forEach((i2) => {
      if (!el.classList.contains(i2)) {
        el.classList.add(i2);
        added.push(i2);
      }
    });
    forRemove.forEach((i2) => {
      if (el.classList.contains(i2)) {
        el.classList.remove(i2);
        removed.push(i2);
      }
    });
    return () => {
      added.forEach((i2) => el.classList.remove(i2));
      removed.forEach((i2) => el.classList.add(i2));
    };
  }

  // packages/alpinejs/src/utils/styles.js
  function setStyles(el, value) {
    if (typeof value === "object" && value !== null) {
      return setStylesFromObject(el, value);
    }
    return setStylesFromString(el, value);
  }
  function setStylesFromObject(el, value) {
    let previousStyles = {};
    Object.entries(value).forEach(([key, value2]) => {
      previousStyles[key] = el.style[key];
      el.style[key] = value2;
    });
    setTimeout(() => {
      if (el.style.length === 0) {
        el.removeAttribute("style");
      }
    });
    return () => {
      setStyles(el, previousStyles);
    };
  }
  function setStylesFromString(el, value) {
    let cache = el.getAttribute("style", value);
    el.setAttribute("style", value);
    return () => {
      el.setAttribute("style", cache);
    };
  }

  // packages/alpinejs/src/utils/once.js
  function once(callback, fallback = () => {
  }) {
    let called = false;
    return function() {
      if (!called) {
        called = true;
        callback.apply(this, arguments);
      } else {
        fallback.apply(this, arguments);
      }
    };
  }

  // packages/alpinejs/src/directives/x-transition.js
  directive("transition", (el, {value, modifiers, expression}) => {
    if (!expression) {
      registerTransitionsFromHelper(el, modifiers, value);
    } else {
      registerTransitionsFromClassString(el, expression, value);
    }
  });
  function registerTransitionsFromClassString(el, classString, stage) {
    registerTransitionObject(el, setClasses, "");
    let directiveStorageMap = {
      enter: (classes) => {
        el._x_transition.enter.during = classes;
      },
      "enter-start": (classes) => {
        el._x_transition.enter.start = classes;
      },
      "enter-end": (classes) => {
        el._x_transition.enter.end = classes;
      },
      leave: (classes) => {
        el._x_transition.leave.during = classes;
      },
      "leave-start": (classes) => {
        el._x_transition.leave.start = classes;
      },
      "leave-end": (classes) => {
        el._x_transition.leave.end = classes;
      }
    };
    directiveStorageMap[stage](classString);
  }
  function registerTransitionsFromHelper(el, modifiers, stage) {
    registerTransitionObject(el, setStyles);
    let doesntSpecify = !modifiers.includes("in") && !modifiers.includes("out") && !stage;
    let transitioningIn = doesntSpecify || modifiers.includes("in") || ["enter"].includes(stage);
    let transitioningOut = doesntSpecify || modifiers.includes("out") || ["leave"].includes(stage);
    if (modifiers.includes("in") && !doesntSpecify) {
      modifiers = modifiers.filter((i2, index) => index < modifiers.indexOf("out"));
    }
    if (modifiers.includes("out") && !doesntSpecify) {
      modifiers = modifiers.filter((i2, index) => index > modifiers.indexOf("out"));
    }
    let wantsAll = !modifiers.includes("opacity") && !modifiers.includes("scale");
    let wantsOpacity = wantsAll || modifiers.includes("opacity");
    let wantsScale = wantsAll || modifiers.includes("scale");
    let opacityValue = wantsOpacity ? 0 : 1;
    let scaleValue = wantsScale ? modifierValue(modifiers, "scale", 95) / 100 : 1;
    let delay = modifierValue(modifiers, "delay", 0);
    let origin = modifierValue(modifiers, "origin", "center");
    let property = "opacity, transform";
    let durationIn = modifierValue(modifiers, "duration", 150) / 1e3;
    let durationOut = modifierValue(modifiers, "duration", 75) / 1e3;
    let easing = `cubic-bezier(0.4, 0.0, 0.2, 1)`;
    if (transitioningIn) {
      el._x_transition.enter.during = {
        transformOrigin: origin,
        transitionDelay: delay,
        transitionProperty: property,
        transitionDuration: `${durationIn}s`,
        transitionTimingFunction: easing
      };
      el._x_transition.enter.start = {
        opacity: opacityValue,
        transform: `scale(${scaleValue})`
      };
      el._x_transition.enter.end = {
        opacity: 1,
        transform: `scale(1)`
      };
    }
    if (transitioningOut) {
      el._x_transition.leave.during = {
        transformOrigin: origin,
        transitionDelay: delay,
        transitionProperty: property,
        transitionDuration: `${durationOut}s`,
        transitionTimingFunction: easing
      };
      el._x_transition.leave.start = {
        opacity: 1,
        transform: `scale(1)`
      };
      el._x_transition.leave.end = {
        opacity: opacityValue,
        transform: `scale(${scaleValue})`
      };
    }
  }
  function registerTransitionObject(el, setFunction, defaultValue = {}) {
    if (!el._x_transition)
      el._x_transition = {
        enter: {during: defaultValue, start: defaultValue, end: defaultValue},
        leave: {during: defaultValue, start: defaultValue, end: defaultValue},
        in(before = () => {
        }, after = () => {
        }) {
          return transition(el, setFunction, {
            during: this.enter.during,
            start: this.enter.start,
            end: this.enter.end
          }, before, after);
        },
        out(before = () => {
        }, after = () => {
        }) {
          return transition(el, setFunction, {
            during: this.leave.during,
            start: this.leave.start,
            end: this.leave.end
          }, before, after);
        }
      };
  }
  window.Element.prototype._x_toggleAndCascadeWithTransitions = function(el, value, show, hide) {
    let clickAwayCompatibleShow = () => setTimeout(show);
    if (value) {
      el._x_transition ? el._x_transition.in(show) : clickAwayCompatibleShow();
      return;
    }
    el._x_hide_promise = el._x_transition ? new Promise((resolve, reject) => {
      el._x_transition.out(() => {
      }, () => resolve(hide));
      el._x_transitioning.beforeCancel(() => reject({isFromCancelledTransition: true}));
    }) : Promise.resolve(hide);
    queueMicrotask(() => {
      let closest = closestHide(el);
      if (closest) {
        if (!closest._x_hide_children)
          closest._x_hide_children = [];
        closest._x_hide_children.push(el);
      } else {
        queueMicrotask(() => {
          let hideAfterChildren = (el2) => {
            let carry = Promise.all([
              el2._x_hide_promise,
              ...(el2._x_hide_children || []).map(hideAfterChildren)
            ]).then(([i2]) => i2());
            delete el2._x_hide_children;
            return carry;
          };
          hideAfterChildren(el).catch((e) => {
            if (!e.isFromCancelledTransition)
              throw e;
          });
        });
      }
    });
  };
  function closestHide(el) {
    let parent = el.parentNode;
    if (!parent)
      return;
    return parent._x_hide_promise ? parent : closestHide(parent);
  }
  function transition(el, setFunction, {during, start: start2, end} = {}, before = () => {
  }, after = () => {
  }) {
    if (el._x_transitioning)
      el._x_transitioning.cancel();
    let undoStart, undoDuring, undoEnd;
    performTransition(el, {
      start() {
        undoStart = setFunction(el, start2);
      },
      during() {
        undoDuring = setFunction(el, during);
      },
      before,
      end() {
        undoStart();
        undoEnd = setFunction(el, end);
      },
      after,
      cleanup() {
        undoDuring();
        undoEnd();
      }
    });
  }
  function performTransition(el, stages) {
    let interrupted, reachedBefore, reachedEnd;
    let finish = once(() => {
      interrupted = true;
      if (!reachedBefore)
        stages.before();
      if (!reachedEnd) {
        stages.end();
        releaseNextTicks();
      }
      stages.after();
      if (el.isConnected)
        stages.cleanup();
      delete el._x_transitioning;
    });
    el._x_transitioning = {
      beforeCancels: [],
      beforeCancel(callback) {
        this.beforeCancels.push(callback);
      },
      cancel: once(function() {
        while (this.beforeCancels.length) {
          this.beforeCancels.shift()();
        }
        ;
        finish();
      }),
      finish
    };
    stages.start();
    stages.during();
    holdNextTicks();
    requestAnimationFrame(() => {
      if (interrupted)
        return;
      let duration = Number(getComputedStyle(el).transitionDuration.replace(/,.*/, "").replace("s", "")) * 1e3;
      let delay = Number(getComputedStyle(el).transitionDelay.replace(/,.*/, "").replace("s", "")) * 1e3;
      if (duration === 0)
        duration = Number(getComputedStyle(el).animationDuration.replace("s", "")) * 1e3;
      stages.before();
      reachedBefore = true;
      requestAnimationFrame(() => {
        if (interrupted)
          return;
        stages.end();
        releaseNextTicks();
        setTimeout(el._x_transitioning.finish, duration + delay);
        reachedEnd = true;
      });
    });
  }
  function modifierValue(modifiers, key, fallback) {
    if (modifiers.indexOf(key) === -1)
      return fallback;
    const rawValue = modifiers[modifiers.indexOf(key) + 1];
    if (!rawValue)
      return fallback;
    if (key === "scale") {
      if (isNaN(rawValue))
        return fallback;
    }
    if (key === "duration") {
      let match = rawValue.match(/([0-9]+)ms/);
      if (match)
        return match[1];
    }
    if (key === "origin") {
      if (["top", "right", "left", "center", "bottom"].includes(modifiers[modifiers.indexOf(key) + 2])) {
        return [rawValue, modifiers[modifiers.indexOf(key) + 2]].join(" ");
      }
    }
    return rawValue;
  }

  // packages/alpinejs/src/directives/x-destroy.js
  directive("destroy", (el, {expression}) => {
    onDestroy(el, evaluateLater(el, expression));
  });

  // packages/alpinejs/src/directives/x-ignore.js
  var handler = () => {
  };
  handler.inline = (el, {modifiers}) => modifiers.includes("self") ? el._x_ignore_self = true : el._x_ignore = true;
  directive("ignore", handler);

  // packages/alpinejs/src/directives/x-effect.js
  directive("effect", (el, {expression}) => effect(evaluateLater(el, expression)));

  // packages/alpinejs/src/utils/bind.js
  function bind(el, name, value, modifiers = []) {
    if (!el._x_bindings)
      el._x_bindings = reactive({});
    el._x_bindings[name] = value;
    name = modifiers.includes("camel") ? camelCase(name) : name;
    switch (name) {
      case "value":
        bindInputValue(el, value);
        break;
      case "style":
        bindStyles(el, value);
        break;
      case "class":
        bindClasses(el, value);
        break;
      default:
        bindAttribute(el, name, value);
        break;
    }
  }
  function bindInputValue(el, value) {
    if (el.type === "radio") {
      if (el.attributes.value === void 0) {
        el.value = value;
      }
      if (window.fromModel) {
        el.checked = checkedAttrLooseCompare(el.value, value);
      }
    } else if (el.type === "checkbox") {
      if (Number.isInteger(value)) {
        el.value = value;
      } else if (!Number.isInteger(value) && !Array.isArray(value) && typeof value !== "boolean" && ![null, void 0].includes(value)) {
        el.value = String(value);
      } else {
        if (Array.isArray(value)) {
          el.checked = value.some((val) => checkedAttrLooseCompare(val, el.value));
        } else {
          el.checked = !!value;
        }
      }
    } else if (el.tagName === "SELECT") {
      updateSelect(el, value);
    } else {
      if (el.value === value)
        return;
      el.value = value;
    }
  }
  function bindClasses(el, value) {
    if (el._x_undoAddedClasses)
      el._x_undoAddedClasses();
    el._x_undoAddedClasses = setClasses(el, value);
  }
  function bindStyles(el, value) {
    if (el._x_undoAddedStyles)
      el._x_undoAddedStyles();
    el._x_undoAddedStyles = setStyles(el, value);
  }
  function bindAttribute(el, name, value) {
    if ([null, void 0, false].includes(value) && attributeShouldntBePreservedIfFalsy(name)) {
      el.removeAttribute(name);
    } else {
      if (isBooleanAttr(name))
        value = name;
      setIfChanged(el, name, value);
    }
  }
  function setIfChanged(el, attrName, value) {
    if (el.getAttribute(attrName) != value) {
      el.setAttribute(attrName, value);
    }
  }
  function updateSelect(el, value) {
    const arrayWrappedValue = [].concat(value).map((value2) => {
      return value2 + "";
    });
    Array.from(el.options).forEach((option) => {
      option.selected = arrayWrappedValue.includes(option.value);
    });
  }
  function camelCase(subject) {
    return subject.toLowerCase().replace(/-(\w)/g, (match, char) => char.toUpperCase());
  }
  function checkedAttrLooseCompare(valueA, valueB) {
    return valueA == valueB;
  }
  function isBooleanAttr(attrName) {
    const booleanAttributes = [
      "disabled",
      "checked",
      "required",
      "readonly",
      "hidden",
      "open",
      "selected",
      "autofocus",
      "itemscope",
      "multiple",
      "novalidate",
      "allowfullscreen",
      "allowpaymentrequest",
      "formnovalidate",
      "autoplay",
      "controls",
      "loop",
      "muted",
      "playsinline",
      "default",
      "ismap",
      "reversed",
      "async",
      "defer",
      "nomodule"
    ];
    return booleanAttributes.includes(attrName);
  }
  function attributeShouldntBePreservedIfFalsy(name) {
    return !["aria-pressed", "aria-checked"].includes(name);
  }

  // packages/alpinejs/src/utils/on.js
  function on(el, event, modifiers, callback) {
    let listenerTarget = el;
    let handler3 = (e) => callback(e);
    let options = {};
    let wrapHandler = (callback2, wrapper) => (e) => wrapper(callback2, e);
    if (modifiers.includes("camel"))
      event = camelCase2(event);
    if (modifiers.includes("passive"))
      options.passive = true;
    if (modifiers.includes("window"))
      listenerTarget = window;
    if (modifiers.includes("document"))
      listenerTarget = document;
    if (modifiers.includes("prevent"))
      handler3 = wrapHandler(handler3, (next, e) => {
        e.preventDefault();
        next(e);
      });
    if (modifiers.includes("stop"))
      handler3 = wrapHandler(handler3, (next, e) => {
        e.stopPropagation();
        next(e);
      });
    if (modifiers.includes("self"))
      handler3 = wrapHandler(handler3, (next, e) => {
        e.target === el && next(e);
      });
    if (modifiers.includes("away") || modifiers.includes("outside")) {
      listenerTarget = document;
      handler3 = wrapHandler(handler3, (next, e) => {
        if (el.contains(e.target))
          return;
        if (el.offsetWidth < 1 && el.offsetHeight < 1)
          return;
        next(e);
      });
    }
    handler3 = wrapHandler(handler3, (next, e) => {
      if (isKeyEvent(event)) {
        if (isListeningForASpecificKeyThatHasntBeenPressed(e, modifiers)) {
          return;
        }
      }
      next(e);
    });
    if (modifiers.includes("debounce")) {
      let nextModifier = modifiers[modifiers.indexOf("debounce") + 1] || "invalid-wait";
      let wait = isNumeric(nextModifier.split("ms")[0]) ? Number(nextModifier.split("ms")[0]) : 250;
      handler3 = debounce(handler3, wait, this);
    }
    if (modifiers.includes("throttle")) {
      let nextModifier = modifiers[modifiers.indexOf("throttle") + 1] || "invalid-wait";
      let wait = isNumeric(nextModifier.split("ms")[0]) ? Number(nextModifier.split("ms")[0]) : 250;
      handler3 = throttle(handler3, wait, this);
    }
    if (modifiers.includes("once")) {
      handler3 = wrapHandler(handler3, (next, e) => {
        next(e);
        listenerTarget.removeEventListener(event, handler3, options);
      });
    }
    listenerTarget.addEventListener(event, handler3, options);
    return () => {
      listenerTarget.removeEventListener(event, handler3, options);
    };
  }
  function camelCase2(subject) {
    return subject.toLowerCase().replace(/-(\w)/g, (match, char) => char.toUpperCase());
  }
  function debounce(func, wait) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  function throttle(func, limit) {
    let inThrottle;
    return function() {
      let context = this, args = arguments;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  function isNumeric(subject) {
    return !Array.isArray(subject) && !isNaN(subject);
  }
  function kebabCase(subject) {
    return subject.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[_\s]/, "-").toLowerCase();
  }
  function isKeyEvent(event) {
    return ["keydown", "keyup"].includes(event);
  }
  function isListeningForASpecificKeyThatHasntBeenPressed(e, modifiers) {
    let keyModifiers = modifiers.filter((i2) => {
      return !["window", "document", "prevent", "stop", "once"].includes(i2);
    });
    if (keyModifiers.includes("debounce")) {
      let debounceIndex = keyModifiers.indexOf("debounce");
      keyModifiers.splice(debounceIndex, isNumeric((keyModifiers[debounceIndex + 1] || "invalid-wait").split("ms")[0]) ? 2 : 1);
    }
    if (keyModifiers.length === 0)
      return false;
    if (keyModifiers.length === 1 && keyModifiers[0] === keyToModifier(e.key))
      return false;
    const systemKeyModifiers = ["ctrl", "shift", "alt", "meta", "cmd", "super"];
    const selectedSystemKeyModifiers = systemKeyModifiers.filter((modifier) => keyModifiers.includes(modifier));
    keyModifiers = keyModifiers.filter((i2) => !selectedSystemKeyModifiers.includes(i2));
    if (selectedSystemKeyModifiers.length > 0) {
      const activelyPressedKeyModifiers = selectedSystemKeyModifiers.filter((modifier) => {
        if (modifier === "cmd" || modifier === "super")
          modifier = "meta";
        return e[`${modifier}Key`];
      });
      if (activelyPressedKeyModifiers.length === selectedSystemKeyModifiers.length) {
        if (keyModifiers[0] === keyToModifier(e.key))
          return false;
      }
    }
    return true;
  }
  function keyToModifier(key) {
    switch (key) {
      case "/":
        return "slash";
      case " ":
      case "Spacebar":
        return "space";
      default:
        return key && kebabCase(key);
    }
  }

  // packages/alpinejs/src/directives/x-model.js
  directive("model", (el, {value, modifiers, expression}) => {
    let evaluate2 = evaluateLater(el, expression);
    let assignmentExpression = `${expression} = rightSideOfExpression($event, ${expression})`;
    let evaluateAssignment = evaluateLater(el, assignmentExpression);
    var event = el.tagName.toLowerCase() === "select" || ["checkbox", "radio"].includes(el.type) || modifiers.includes("lazy") ? "change" : "input";
    let assigmentFunction = generateAssignmentFunction(el, modifiers, expression);
    let removeListener = on(el, event, modifiers, (e) => {
      evaluateAssignment(() => {
      }, {scope: {
        $event: e,
        rightSideOfExpression: assigmentFunction
      }});
    });
    el._x_forceModelUpdate = () => {
      evaluate2((value2) => {
        if (value2 === void 0 && expression.match(/\./))
          value2 = "";
        window.fromModel = true;
        bind(el, "value", value2);
        delete window.fromModel;
      });
    };
    effect(() => {
      if (modifiers.includes("unintrusive") && document.activeElement.isSameNode(el))
        return;
      el._x_forceModelUpdate();
    });
  });
  function generateAssignmentFunction(el, modifiers, expression) {
    if (el.type === "radio") {
      if (!el.hasAttribute("name"))
        el.setAttribute("name", expression);
    }
    return (event, currentValue) => {
      if (event instanceof CustomEvent && event.detail !== void 0) {
        return event.detail;
      } else if (el.type === "checkbox") {
        if (Array.isArray(currentValue)) {
          let newValue = modifiers.includes("number") ? safeParseNumber(event.target.value) : event.target.value;
          return event.target.checked ? currentValue.concat([newValue]) : currentValue.filter((el2) => !checkedAttrLooseCompare2(el2, newValue));
        } else {
          return event.target.checked;
        }
      } else if (el.tagName.toLowerCase() === "select" && el.multiple) {
        return modifiers.includes("number") ? Array.from(event.target.selectedOptions).map((option) => {
          let rawValue = option.value || option.text;
          return safeParseNumber(rawValue);
        }) : Array.from(event.target.selectedOptions).map((option) => {
          return option.value || option.text;
        });
      } else {
        let rawValue = event.target.value;
        return modifiers.includes("number") ? safeParseNumber(rawValue) : modifiers.includes("trim") ? rawValue.trim() : rawValue;
      }
    };
  }
  function safeParseNumber(rawValue) {
    let number = rawValue ? parseFloat(rawValue) : null;
    return isNumeric2(number) ? number : rawValue;
  }
  function checkedAttrLooseCompare2(valueA, valueB) {
    return valueA == valueB;
  }
  function isNumeric2(subject) {
    return !Array.isArray(subject) && !isNaN(subject);
  }

  // packages/alpinejs/src/directives/x-cloak.js
  directive("cloak", (el) => nextTick(() => el.removeAttribute(prefix("cloak"))));

  // packages/alpinejs/src/directives/x-init.js
  directive("init", skipDuringClone((el, {expression}) => evaluate(el, expression, {}, false)));

  // packages/alpinejs/src/directives/x-text.js
  directive("text", (el, {expression}) => {
    let evaluate2 = evaluateLater(el, expression);
    effect(() => evaluate2((value) => el.textContent = value));
  });

  // packages/alpinejs/src/directives/x-bind.js
  mapAttributes(startingWith(":", into(prefix("bind:"))));
  directive("bind", (el, {value, modifiers, expression}) => {
    if (!value)
      return applyBindingsObject(el, expression);
    if (value === "key")
      return storeKeyForXFor(el, expression);
    let evaluate2 = evaluateLater(el, expression);
    effect(() => evaluate2((result) => {
      bind(el, value, result, modifiers);
    }));
  });
  function applyBindingsObject(el, expression) {
    let bindings = evaluate(el, expression);
    let attributes = Object.entries(bindings).map(([name, value]) => ({name, value}));
    directives(el, attributes).forEach((directive2) => {
      handleDirective(el, directive2);
    });
  }
  function storeKeyForXFor(el, expression) {
    el._x_key_expression = expression;
  }

  // packages/alpinejs/src/directives/x-data.js
  addRootSelector(() => `[${prefix("data")}]`);
  directive("data", skipDuringClone((el, {expression}) => {
    expression = expression === "" ? "{}" : expression;
    let component2 = getComponent(expression);
    let data = component2 ? component2() : evaluate(el, expression);
    injectMagics(data, el);
    let reactiveData = reactive(data);
    addScopeToNode(el, reactiveData);
    if (reactiveData["init"])
      reactiveData["init"]();
    if (reactiveData["destroy"]) {
      onDestroy(el, () => {
        reactiveData["destroy"]();
      });
    }
  }));

  // packages/alpinejs/src/directives/x-show.js
  directive("show", (el, {value, modifiers, expression}) => {
    let evaluate2 = evaluateLater(el, expression);
    if (el.style.display)
      el.style.display = "";
    let hide = () => {
      el._x_undoHide = setStyles(el, {display: "none"});
      el._x_is_shown = false;
    };
    let show = () => {
      el._x_undoHide?.() || delete el._x_undoHide;
      el._x_is_shown = true;
    };
    let clickAwayCompatibleShow = () => setTimeout(show);
    let toggle = once((value2) => value2 ? show() : hide(), (value2) => {
      if (typeof el._x_toggleAndCascadeWithTransitions === "function") {
        el._x_toggleAndCascadeWithTransitions(el, value2, show, hide);
      } else {
        value2 ? clickAwayCompatibleShow() : hide();
      }
    });
    effect(() => evaluate2((value2) => {
      if (modifiers.includes("immediate"))
        value2 ? clickAwayCompatibleShow() : hide();
      toggle(value2);
    }));
  });

  // packages/alpinejs/src/directives/x-for.js
  directive("for", (el, {value, modifiers, expression}) => {
    let iteratorNames = parseForExpression(expression);
    let evaluateItems = evaluateLater(el, iteratorNames.items);
    let evaluateKey = evaluateLater(el, el._x_key_expression || "index");
    effect(() => loop(el, iteratorNames, evaluateItems, evaluateKey));
  });
  function loop(el, iteratorNames, evaluateItems, evaluateKey) {
    let templateEl = el;
    evaluateItems((items) => {
      if (isNumeric3(items) && items >= 0) {
        items = Array.from(Array(items).keys(), (i2) => i2 + 1);
      }
      let oldIterations = templateEl._x_old_iterations || [];
      let iterations = Array.from(items).map((item, index) => {
        let scope = getIterationScopeVariables(iteratorNames, item, index, items);
        let key;
        evaluateKey((value) => key = value, {scope: {index, ...scope}});
        let element = oldIterations.find((i2) => i2.key === key)?.element;
        if (element) {
          let existingScope = element._x_dataStack[0];
          Object.entries(scope).forEach(([key2, value]) => {
            existingScope[key2] = value;
          });
        } else {
          let clone2 = document.importNode(templateEl.content, true).firstElementChild;
          addScopeToNode(clone2, reactive(scope), templateEl);
          element = clone2;
        }
        return {key, scope, element, remove() {
          element.remove();
        }};
      });
      let unusedIterations = oldIterations.filter((i2) => !iterations.map((i3) => i3.key).includes(i2.key));
      unusedIterations.forEach((iteration) => iteration.remove());
      templateEl._x_old_iterations = iterations;
      queueMicrotask(() => {
        templateEl.after(...iterations.map((i2) => i2.element));
      });
    });
  }
  function parseForExpression(expression) {
    let forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
    let stripParensRE = /^\(|\)$/g;
    let forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
    let inMatch = expression.match(forAliasRE);
    if (!inMatch)
      return;
    let res = {};
    res.items = inMatch[2].trim();
    let item = inMatch[1].trim().replace(stripParensRE, "");
    let iteratorMatch = item.match(forIteratorRE);
    if (iteratorMatch) {
      res.item = item.replace(forIteratorRE, "").trim();
      res.index = iteratorMatch[1].trim();
      if (iteratorMatch[2]) {
        res.collection = iteratorMatch[2].trim();
      }
    } else {
      res.item = item;
    }
    return res;
  }
  function getIterationScopeVariables(iteratorNames, item, index, items) {
    let scopeVariables = {};
    scopeVariables[iteratorNames.item] = item;
    if (iteratorNames.index)
      scopeVariables[iteratorNames.index] = index;
    if (iteratorNames.collection)
      scopeVariables[iteratorNames.collection] = items;
    return scopeVariables;
  }
  function isNumeric3(subject) {
    return !Array.isArray(subject) && !isNaN(subject);
  }

  // packages/alpinejs/src/directives/x-ref.js
  function handler2() {
  }
  handler2.inline = (el, {expression}) => {
    let root = closestRoot(el);
    if (!root._x_refs)
      root._x_refs = {};
    root._x_refs[expression] = el;
  };
  directive("ref", handler2);

  // packages/alpinejs/src/directives/x-if.js
  directive("if", (el, {value, modifiers, expression}) => {
    let evaluate2 = evaluateLater(el, expression);
    let show = () => {
      if (el._x_currentIfEl)
        return el._x_currentIfEl;
      let clone2 = el.content.cloneNode(true).firstElementChild;
      el.after(clone2);
      el._x_currentIfEl = clone2;
      el._x_undoIf = () => {
        clone2.remove();
        delete el._x_currentIfEl;
      };
      return clone2;
    };
    let hide = () => {
      el._x_undoIf?.() || delete el._x_undoIf;
    };
    let toggle = once((value2) => value2 ? show() : hide(), (value2) => {
      if (typeof el._x_toggleAndCascadeWithTransitions === "function") {
        if (value2) {
          show();
          let currentIfEl = el._x_currentIfEl;
          queueMicrotask(() => {
            let undo = setStyles(currentIfEl, {display: "none"});
            if (modifiers.includes("transition") && typeof currentIfEl._x_registerTransitionsFromHelper === "function") {
              currentIfEl._x_registerTransitionsFromHelper(currentIfEl, modifiers);
            }
            el._x_toggleAndCascadeWithTransitions(currentIfEl, true, undo, () => {
            });
          });
        } else {
          el._x_toggleAndCascadeWithTransitions(el._x_currentIfEl, false, () => {
          }, hide);
        }
      } else {
        value2 ? show() : hide();
      }
    });
    effect(() => evaluate2((value2) => {
      if (modifiers.includes("immediate"))
        value2 ? show() : hide();
      toggle(value2);
    }));
  });

  // packages/alpinejs/src/directives/x-on.js
  mapAttributes(startingWith("@", into(prefix("on:"))));
  directive("on", skipDuringClone((el, {value, modifiers, expression}) => {
    let evaluate2 = expression ? evaluateLater(el, expression) : () => {
    };
    let removeListener = on(el, value, modifiers, (e) => {
      evaluate2(() => {
      }, {scope: {$event: e}, params: [e]});
    });
    onDestroy(el, removeListener);
  }));

  // packages/alpinejs/src/index.js
  alpine_default.setEvaluator(normalEvaluator);
  alpine_default.setReactivity(ht, w);
  var src_default = alpine_default;

  // packages/alpinejs/builds/cdn.js
  window.Alpine = src_default;
  queueMicrotask(() => {
    src_default.start();
  });
})();
