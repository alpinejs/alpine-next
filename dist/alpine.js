(() => {
  // src/scheduler.js
  var scheduler_default = {
    tasks: [],
    lowPriorityTasks: [],
    nextTicks: [],
    shouldFlush: false,
    task(callback) {
      this.tasks.push(callback);
      this.shouldFlushAtEndOfRequest();
    },
    nextTick(callback) {
      this.nextTicks.push(callback);
      this.shouldFlushAtEndOfRequest();
    },
    holdNextTicks() {
      this.holdNextTicksOver = true;
    },
    releaseNextTicks() {
      while (this.nextTicks.length > 0) {
        this.nextTicks.shift()();
      }
      this.holdNextTicksOver = false;
    },
    shouldFlushAtEndOfRequest() {
      this.shouldFlush = true;
      queueMicrotask(() => {
        if (this.shouldFlush)
          this.flush();
        this.shouldFlush = false;
      });
    },
    flushImmediately() {
      while (this.tasks.length > 0)
        this.tasks.shift()();
      if (!this.holdNextTicksOver)
        while (this.nextTicks.length > 0)
          this.nextTicks.shift()();
    },
    flush() {
      setTimeout(() => {
        let DEADLINE = performance.now() + 80;
        while (this.tasks.length > 0) {
          if (navigator?.scheduling?.isInputPending()) {
            setTimeout(this.flush.bind(this));
            return;
          }
          this.tasks.shift()();
        }
        if (!this.holdNextTicksOver) {
          setTimeout(() => {
            while (this.nextTicks.length > 0) {
              this.nextTicks.shift()();
            }
          });
        }
      });
    }
  };

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
  function bt(t2) {
    return ((t3, e, n2) => {
      Object.defineProperty(t3, e, {configurable: true, enumerable: false, value: n2});
    })(t2, "__v_skip", true), t2;
  }
  function kt(t2) {
    return Boolean(t2 && t2.__v_isRef === true);
  }

  // src/utils/directives.js
  function directives(el, attributes) {
    let attributeNamesAndValues = attributes || Array.from(el.attributes).map((attr) => ({name: attr.name, value: attr.value}));
    attributeNamesAndValues = attributeNamesAndValues.map(({name, value}) => interceptNameAndValue({name, value}));
    let directives2 = attributeNamesAndValues.filter(isXAttr).map(parseHtmlAttribute);
    return sortDirectives(directives2);
  }
  function directivesByType(el, type) {
    return directives(el).filter((attribute) => attribute.type === type);
  }
  var xAttrRE = /^x-([^:^.]+)\b/;
  function isXAttr({name, value}) {
    return xAttrRE.test(name);
  }
  function sortDirectives(directives2) {
    let directiveOrder = ["data", "spread", "ref", "init", "bind", "for", "model", "transition", "show", "if", "catch-all", "element"];
    return directives2.sort((a2, b2) => {
      let typeA = directiveOrder.indexOf(a2.type) === -1 ? "catch-all" : a2.type;
      let typeB = directiveOrder.indexOf(b2.type) === -1 ? "catch-all" : b2.type;
      return directiveOrder.indexOf(typeA) - directiveOrder.indexOf(typeB);
    });
  }
  function parseHtmlAttribute({name, value}) {
    const typeMatch = name.match(xAttrRE);
    const valueMatch = name.match(/:([a-zA-Z0-9\-:]+)/);
    const modifiers = name.match(/\.[^.\]]+(?=[^\]]*$)/g) || [];
    return {
      type: typeMatch ? typeMatch[1] : null,
      value: valueMatch ? valueMatch[1] : null,
      modifiers: modifiers.map((i2) => i2.replace(".", "")),
      expression: value
    };
  }
  var interceptors = [];
  function interceptNameAndValue({name, value}, addAttributes) {
    interceptors.push(({name: name2, value: value2}) => {
      if (name2.startsWith("@"))
        name2 = name2.replace("@", "x-on:");
      return {name: name2, value: value2};
    });
    interceptors.push(({name: name2, value: value2}) => {
      if (name2.startsWith(":"))
        name2 = name2.replace(":", "x-bind:");
      return {name: name2, value: value2};
    });
    return interceptors.reduce((carry, interceptor) => {
      return interceptor(carry, addAttributes);
    }, {name, value});
  }

  // src/utils/warn.js
  function warn(message, ...args) {
    console.warn(`Alpine Warning: ${message}`, ...args);
  }

  // src/utils/root.js
  function root(el) {
    if (el.hasAttribute("x-data") || el.hasAttribute("x-data.append"))
      return el;
    if (!el.parentElement)
      return;
    return root(el.parentElement);
  }

  // src/alpine.js
  var Alpine2 = {
    reactive: ht,
    syncEffect: w,
    markRaw: bt,
    toRaw: Rt,
    scheduler: scheduler_default,
    get effect() {
      if (this.skipEffects)
        return () => {
        };
      return (callback) => {
        return w(() => {
          callback();
        });
      };
    },
    get effectSync() {
      if (this.skipEffects)
        return () => {
        };
      return (callback) => {
        return w(() => {
          callback();
        });
      };
    },
    directives: {},
    magics: {},
    components: {},
    directive(name, callback) {
      this.directives[name] = callback;
    },
    magic(name, callback) {
      this.magics[name] = callback;
    },
    component(name, callback) {
      this.components[name] = callback;
    },
    stores: {},
    store(name, object) {
      this.stores[name] = this.reactive(object);
    },
    getStore(name) {
      return this.stores[name];
    },
    injectMagics(obj, el) {
      Object.entries(this.magics).forEach(([name, callback]) => {
        Object.defineProperty(obj, `$${name}`, {
          get() {
            return callback(el);
          },
          enumerable: true
        });
      });
    },
    start() {
      document.dispatchEvent(new CustomEvent("alpine:initializing"), {bubbles: true});
      if (!document.body) {
        warn("Unable to initialize. Trying to load Alpine before `<body>` is available. Did you forget to add `defer` in Alpine's `<script>` tag?");
      }
      this.listenForAndReactToDomManipulations(document.body);
      let outNestedComponents = (el) => !root(el.parentNode || root(el));
      Array.from(document.querySelectorAll("[x-data], [x-data\\.append]")).filter(outNestedComponents).forEach((el) => this.initTree(el));
      document.dispatchEvent(new CustomEvent("alpine:initialized"), {bubbles: true});
    },
    initTree(root2) {
      if (root2 instanceof ShadowRoot) {
        Array.from(root2.children).forEach((child) => this.walk(child, (el) => this.init(el)));
      } else {
        this.walk(root2, (el) => this.init(el));
      }
      this.scheduler.flush();
    },
    init(el, attributes) {
      (attributes || directives(el)).forEach((attr) => {
        let noop2 = () => {
        };
        let handler3 = Alpine2.directives[attr.type] || noop2;
        let task = (callback) => callback();
        task(() => {
          handler3(el, attr.value, attr.modifiers, attr.expression, Alpine2.effect);
        });
      });
    },
    destroyCallbacks: new WeakMap(),
    addDestroyCallback(el, callback) {
      if (!this.destroyCallbacks.get(el)) {
        this.destroyCallbacks.set(el, []);
      }
      this.destroyCallbacks.get(el).push(callback);
    },
    destroyTree(root2) {
      this.walk(root2, (el) => this.destroy(el));
      this.scheduler.flush();
    },
    destroy(el) {
      let callbacks = this.destroyCallbacks.get(el);
      callbacks && callbacks.forEach((callback) => callback());
    },
    listenForAndReactToDomManipulations(rootElement) {
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
          this.initTree(node);
        }
        for (let node of removeds) {
          if (node.nodeType !== 1)
            continue;
          if (addeds.includes(node))
            continue;
          if (node._x_ignoreMutationObserver)
            continue;
          scheduler_default.nextTick(() => {
            this.destroyTree(node);
          });
        }
      });
      observer.observe(rootElement, {subtree: true, childList: true, deep: false});
    },
    walk(el, callback) {
      let skip = false;
      callback(el, () => skip = true);
      if (skip)
        return;
      let node = el.firstElementChild;
      while (node) {
        this.walk(node, callback, false);
        node = node.nextElementSibling;
      }
    }
  };
  var alpine_default = Alpine2;

  // src/utils/classes.js
  function setClasses(el, classString) {
    let isInvalidType = (subject) => typeof subject === "object" && !subject instanceof String || Array.isArray(subject);
    if (isInvalidType(classString))
      warn("class bindings must return a string or a stringable type. Arrays and Objects are no longer supported.");
    if (classString === true)
      classString = "";
    let split = (classString2) => classString2.split(" ").filter(Boolean);
    let missingClasses = (classString2) => classString2.split(" ").filter((i2) => !el.classList.contains(i2)).filter(Boolean);
    let addClassesAndReturnUndo = (classes) => {
      el.classList.add(...classes);
      return () => {
        el.classList.remove(...classes);
      };
    };
    return addClassesAndReturnUndo(missingClasses(classString || ""));
  }
  function toggleClasses(el, classObject) {
    let split = (classString) => classString.split(" ").filter(Boolean);
    let forAdd = Object.entries(classObject).flatMap(([classString, bool]) => bool ? split(classString) : false).filter(Boolean);
    let forRemove = Object.entries(classObject).flatMap(([classString, bool]) => !bool ? split(classString) : false).filter(Boolean);
    let added2 = [];
    let removed2 = [];
    forAdd.forEach((i2) => {
      if (!el.classList.contains(i2)) {
        el.classList.add(i2);
        added2.push(i2);
      }
    });
    forRemove.forEach((i2) => {
      if (el.classList.contains(i2)) {
        el.classList.remove(i2);
        removed2.push(i2);
      }
    });
    return () => {
      added2.forEach((i2) => el.classList.remove(i2));
      removed2.forEach((i2) => el.classList.add(i2));
    };
  }

  // src/utils/once.js
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

  // src/utils/styles.js
  function setStyles(el, styleObject) {
    let previousStyles = {};
    Object.entries(styleObject).forEach(([key2, value]) => {
      previousStyles[key2] = el.style[key2];
      el.style[key2] = value;
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

  // src/directives/x-transition.js
  var handler = (el, value, modifiers, expression, effect) => {
    if (!el._x_transition) {
      el._x_transition = {
        enter: {during: "", start: "", end: ""},
        leave: {during: "", start: "", end: ""},
        in(before = () => {
        }, after = () => {
        }) {
          return transitionClasses(this.resolveElement(), {
            during: this.enter.during,
            start: this.enter.start,
            end: this.enter.end
          }, before, after);
        },
        out(before = () => {
        }, after = () => {
        }) {
          return transitionClasses(this.resolveElement(), {
            during: this.leave.during,
            start: this.leave.start,
            end: this.leave.end
          }, before, after);
        },
        resolveElement: () => {
          return el;
        },
        setElementResolver(callback) {
          this.resolveElement = callback;
        }
      };
    }
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
    directiveStorageMap[value](expression);
  };
  alpine_default.directive("transition", handler);
  function transitionClasses(el, {during = "", start = "", end = ""} = {}, before = () => {
  }, after = () => {
  }) {
    if (el._x_transitioning)
      el._x_transitioning.cancel();
    let undoStart, undoDuring, undoEnd;
    performTransition(el, {
      start() {
        undoStart = setClasses(el, start);
      },
      during() {
        undoDuring = setClasses(el, during);
      },
      before,
      end() {
        undoStart();
        undoEnd = setClasses(el, end);
      },
      after,
      cleanup() {
        undoDuring();
        undoEnd();
      }
    });
  }
  window.Element.prototype._x_registerTransitionsFromHelper = function(el, modifiers) {
    el._x_transition = {
      enter: {during: {}, start: {}, end: {}},
      leave: {during: {}, start: {}, end: {}},
      in(before = () => {
      }, after = () => {
      }) {
        return transitionStyles(el, {
          during: this.enter.during,
          start: this.enter.start,
          end: this.enter.end
        }, before, after);
      },
      out(before = () => {
      }, after = () => {
      }) {
        return transitionStyles(el, {
          during: this.leave.during,
          start: this.leave.start,
          end: this.leave.end
        }, before, after);
      }
    };
    let doesntSpecify = !modifiers.includes("in") && !modifiers.includes("out");
    let transitioningIn = doesntSpecify || modifiers.includes("in");
    let transitioningOut = doesntSpecify || modifiers.includes("out");
    if (modifiers.includes("in") && !doesntSpecify) {
      modifiers = modifiers.filter((i2, index) => index < modifiers.indexOf("out"));
    }
    if (modifiers.includes("out") && !doesntSpecify) {
      modifiers = modifiers.filter((i2, index) => index > modifiers.indexOf("out"));
    }
    if (transitioningIn) {
      el._x_transition.enter.during = {
        transitionOrigin: modifierValue(modifiers, "origin", "center"),
        transitionProperty: "opacity, transform",
        transitionDuration: `${modifierValue(modifiers, "duration", 150) / 1e3}s`,
        transitionTimingFunction: `cubic-bezier(0.4, 0.0, 0.2, 1)`
      };
      el._x_transition.enter.start = {
        opacity: 0,
        transform: `scale(${modifierValue(modifiers, "scale", 95) / 100})`
      };
      el._x_transition.enter.end = {
        opacity: 1,
        transform: `scale(1)`
      };
    }
    if (transitioningOut) {
      let duration = modifierValue(modifiers, "duration", 150) / 2;
      el._x_transition.leave.during = {
        transitionOrigin: modifierValue(modifiers, "origin", "center"),
        transitionProperty: "opacity, transform",
        transitionDuration: `${duration / 1e3}s`,
        transitionTimingFunction: `cubic-bezier(0.4, 0.0, 0.2, 1)`
      };
      el._x_transition.leave.start = {
        opacity: 1,
        transform: `scale(1)`
      };
      el._x_transition.leave.end = {
        opacity: 0,
        transform: `scale(${modifierValue(modifiers, "scale", 95) / 100})`
      };
    }
  };
  window.Element.prototype._x_toggleAndCascadeWithTransitions = function(el, value, show, hide) {
    if (value) {
      el._x_transition ? el._x_transition.in(show) : show();
      return;
    }
    el._x_do_hide = el._x_transition ? (resolve, reject) => {
      el._x_transition.out(() => {
      }, () => resolve(hide));
      el._x_transitioning.beforeCancel(() => reject({isFromCancelledTransition: true}));
    } : (resolve) => resolve(hide);
    queueMicrotask(() => {
      let closest = closestHide(el);
      if (closest) {
        closest._x_hide_child = el;
      } else {
        queueMicrotask(() => {
          let hidePromises = [];
          let current = el;
          while (current) {
            hidePromises.push(new Promise(current._x_do_hide));
            current = current._x_hide_child;
          }
          hidePromises.reverse().reduce((promiseChain, promise) => {
            return promiseChain.then(() => {
              return promise.then((doHide) => doHide());
            });
          }, Promise.resolve(() => {
          })).catch((e) => {
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
    return parent._x_do_hide ? parent : closestHide(parent);
  }
  function transitionStyles(el, {during = {}, start = {}, end = {}}, before = () => {
  }, after = () => {
  }) {
    if (el._x_transitioning)
      el._x_transitioning.cancel();
    let undoStart, undoDuring, undoEnd;
    performTransition(el, {
      start() {
        undoStart = setStyles(el, start);
      },
      during() {
        undoDuring = setStyles(el, during);
      },
      before,
      end() {
        undoStart();
        undoEnd = setStyles(el, end);
      },
      after,
      cleanup() {
        undoDuring();
        undoEnd();
      }
    });
  }
  function performTransition(el, stages) {
    let finish = once(() => {
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
    scheduler_default.holdNextTicks();
    requestAnimationFrame(() => {
      let duration = Number(getComputedStyle(el).transitionDuration.replace(/,.*/, "").replace("s", "")) * 1e3;
      if (duration === 0) {
        duration = Number(getComputedStyle(el).animationDuration.replace("s", "")) * 1e3;
      }
      stages.before();
      requestAnimationFrame(() => {
        stages.end();
        scheduler_default.releaseNextTicks();
        setTimeout(el._x_transitioning.finish, duration);
      });
    });
  }
  function modifierValue(modifiers, key2, fallback) {
    if (modifiers.indexOf(key2) === -1)
      return fallback;
    const rawValue = modifiers[modifiers.indexOf(key2) + 1];
    if (!rawValue)
      return fallback;
    if (key2 === "scale") {
      if (!isNumeric(rawValue))
        return fallback;
    }
    if (key2 === "duration") {
      let match = rawValue.match(/([0-9]+)ms/);
      if (match)
        return match[1];
    }
    if (key2 === "origin") {
      if (["top", "right", "left", "center", "bottom"].includes(modifiers[modifiers.indexOf(key2) + 2])) {
        return [rawValue, modifiers[modifiers.indexOf(key2) + 2]].join(" ");
      }
    }
    return rawValue;
  }

  // src/utils/mergeProxies.js
  function mergeProxies(...objects) {
    return new Proxy({}, {
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

  // src/utils/closest.js
  function closestDataStack(node) {
    if (node._x_dataStack)
      return node._x_dataStack;
    if (node instanceof ShadowRoot) {
      return closestDataStack(node.host);
    }
    if (!node.parentNode) {
      return new Set();
    }
    return closestDataStack(node.parentNode);
  }

  // src/utils/evaluate.js
  function evaluator(el, expression, extras = {}, returns = true) {
    let farExtras = {};
    let dataStack = closestDataStack(el);
    let closeExtras = extras;
    alpine_default.injectMagics(closeExtras, el);
    let reversedDataStack = [farExtras].concat(Array.from(dataStack).concat([closeExtras])).reverse();
    let AsyncFunction = Object.getPrototypeOf(async function() {
    }).constructor;
    if (typeof expression === "function") {
      let mergedObject = mergeProxies(...reversedDataStack);
      let expressionWithContext = expression.bind(mergedObject);
      return (...args) => {
        let result = expressionWithContext(...args);
        if (result instanceof Promise) {
          return (receiver) => {
            result.then((i2) => receiver(i2));
          };
        }
        return (receiver) => receiver(result);
      };
    }
    let names = reversedDataStack.map((data, index) => `$data${index}`);
    let namesWithPlaceholder = ["$dataPlaceholder"].concat(names);
    let assignmentPrefix = returns ? "__self.result = " : "";
    let withExpression = namesWithPlaceholder.reduce((carry, current) => {
      return `with (${current}) { ${carry} }`;
    }, `${assignmentPrefix}${expression}`);
    let namesWithPlaceholderAndDefault = names.concat(["$dataPlaceholder = {}"]);
    let evaluator2 = () => {
    };
    evaluator2 = tryCatch(el, expression, () => (...args) => {
      let func = new AsyncFunction(["__self", ...namesWithPlaceholderAndDefault], `${withExpression}; __self.finished = true; return __self.result;`);
      func.result = void 0;
      func.finished = false;
      let promise = func(...[func, ...args]);
      return (receiver) => {
        if (func.finished) {
          receiver(func.result);
        } else {
          promise.then((result) => {
            receiver(result);
          });
        }
      };
    });
    let boundEvaluator = evaluator2.bind(null, ...reversedDataStack);
    return tryCatch.bind(null, el, expression, boundEvaluator);
  }
  function evaluatorSync(el, expression, extras = {}, returns = true) {
    let evaluate2 = evaluator(el, expression, extras, returns);
    return (extras2) => {
      let result;
      evaluate2(extras2)((value) => result = value);
      return result;
    };
  }
  function evaluate(el, expression, extras = {}, returns = true) {
    return evaluator(el, expression, extras, returns)();
  }
  function evaluateSync(el, expression, extras = {}, returns = true) {
    let result;
    evaluator(el, expression, extras, returns)()((value) => result = value);
    return result;
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

  // src/directives/x-spread.js
  alpine_default.directive("spread", (el, value, modifiers, expression, effect) => {
    let spreadObject = evaluateSync(el, expression);
    let rawAttributes = Object.entries(spreadObject).map(([name, value2]) => ({name, value: value2}));
    let attributes = directives(el, rawAttributes);
    alpine_default.init(el, attributes);
  });

  // src/utils/bind.js
  function bind(el, name, value, modifiers = []) {
    if (!el._x_bindings)
      el._x_bindings = Alpine.reactive({});
    el._x_bindings[name] = value;
    name = modifiers.includes("camel") ? camelCase(name) : name;
    switch (name) {
      case "value":
        bindInputValue(el, value);
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
    if (typeof value === "object" && value !== null) {
      el._x_undoAddedClasses = toggleClasses(el, value);
    } else {
      el._x_undoAddedClasses = setClasses(el, value);
    }
  }
  function bindAttribute(el, name, value) {
    if ([null, void 0, false].includes(value)) {
      el.removeAttribute(name);
    } else {
      isBooleanAttr(name) ? setIfChanged(el, name, name) : setIfChanged(el, name, value);
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

  // src/utils/on.js
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
    if (modifiers.includes("away")) {
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
      let wait = isNumeric2(nextModifier.split("ms")[0]) ? Number(nextModifier.split("ms")[0]) : 250;
      handler3 = debounce(handler3, wait, this);
    }
    if (modifiers.includes("throttle")) {
      let nextModifier = modifiers[modifiers.indexOf("throttle") + 1] || "invalid-wait";
      let wait = isNumeric2(nextModifier.split("ms")[0]) ? Number(nextModifier.split("ms")[0]) : 250;
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
  function isNumeric2(subject) {
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
      keyModifiers.splice(debounceIndex, isNumeric2((keyModifiers[debounceIndex + 1] || "invalid-wait").split("ms")[0]) ? 2 : 1);
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
  function keyToModifier(key2) {
    switch (key2) {
      case "/":
        return "slash";
      case " ":
      case "Spacebar":
        return "space";
      default:
        return key2 && kebabCase(key2);
    }
  }

  // src/directives/x-model.js
  alpine_default.directive("model", (el, value, modifiers, expression, effect) => {
    let evaluate2 = evaluator(el, expression);
    let assignmentExpression = `${expression} = rightSideOfExpression($event, ${expression})`;
    let evaluateAssignment = evaluator(el, assignmentExpression);
    var event = el.tagName.toLowerCase() === "select" || ["checkbox", "radio"].includes(el.type) || modifiers.includes("lazy") ? "change" : "input";
    let assigmentFunction = generateAssignmentFunction(el, modifiers, expression);
    let removeListener = on(el, event, modifiers, (e) => {
      evaluateAssignment({
        $event: e,
        rightSideOfExpression: assigmentFunction
      });
    });
    el._x_forceModelUpdate = () => {
      evaluate2()((value2) => {
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
    return isNumeric3(number) ? number : rawValue;
  }
  function checkedAttrLooseCompare2(valueA, valueB) {
    return valueA == valueB;
  }
  function isNumeric3(subject) {
    return !Array.isArray(subject) && !isNaN(subject);
  }

  // src/directives/x-cloak.js
  alpine_default.directive("cloak", (el) => {
    scheduler_default.nextTick(() => {
      el.removeAttribute("x-cloak");
    });
  });

  // src/morph.js
  function morph(dom, toHtml, options) {
    assignOptions(options);
    patch(dom, createElement(toHtml));
    return dom;
  }
  var key;
  var lookahead;
  var updating;
  var updated;
  var removing;
  var removed;
  var adding;
  var added;
  var noop = () => {
  };
  function assignOptions(options = {}) {
    let defaultGetKey = (el) => el.getAttribute("key");
    key = options.key || defaultGetKey;
    lookahead = options.lookahead || false;
    updating = options.updating || noop;
    updated = options.updated || noop;
    removing = options.removing || noop;
    removed = options.removed || noop;
    adding = options.adding || noop;
    added = options.added || noop;
  }
  function createElement(html) {
    return document.createRange().createContextualFragment(html).firstElementChild;
  }
  function patch(dom, to) {
    if (dom.isEqualNode(to))
      return;
    if (differentElementNamesTypesOrKeys(dom, to)) {
      return patchElement(dom, to);
    }
    let updateChildrenOnly = false;
    if (shouldSkip(updating, dom, to, () => updateChildrenOnly = true))
      return;
    initializeAlpineOnTo(dom, to, () => updateChildrenOnly = true);
    if (textOrComment(to)) {
      patchNodeValue(dom, to);
      updated(dom, to);
      return;
    }
    if (!updateChildrenOnly) {
      patchAttributes(dom, to);
    }
    updated(dom, to);
    patchChildren(dom, to);
  }
  function differentElementNamesTypesOrKeys(dom, to) {
    return dom.nodeType != to.nodeType || dom.nodeName != to.nodeName || getKey(dom) != getKey(to);
  }
  function textOrComment(el) {
    return el.nodeType === 3 || el.nodeType === 8;
  }
  function patchElement(dom, to) {
    if (shouldSkip(removing, dom))
      return;
    let toCloned = to.cloneNode(true);
    if (shouldSkip(adding, toCloned))
      return;
    dom.parentNode.replaceChild(toCloned, dom);
    removed(dom);
    added(toCloned);
  }
  function patchNodeValue(dom, to) {
    let value = to.nodeValue;
    if (dom.nodeValue !== value)
      dom.nodeValue = value;
  }
  function patchAttributes(dom, to) {
    let domAttributes = Array.from(dom.attributes);
    let toAttributes = Array.from(to.attributes);
    for (let i2 = domAttributes.length - 1; i2 >= 0; i2--) {
      let name = domAttributes[i2].name;
      if (!to.hasAttribute(name))
        dom.removeAttribute(name);
    }
    for (let i2 = toAttributes.length - 1; i2 >= 0; i2--) {
      let name = toAttributes[i2].name;
      let value = toAttributes[i2].value;
      if (dom.getAttribute(name) !== value)
        dom.setAttribute(name, value);
    }
  }
  function patchChildren(dom, to) {
    let domChildren = dom.childNodes;
    let toChildren = to.childNodes;
    let toKeyToNodeMap = keyToMap(toChildren);
    let domKeyDomNodeMap = keyToMap(domChildren);
    let currentTo = to.firstChild;
    let currentFrom = dom.firstChild;
    let domKeyHoldovers = {};
    while (currentTo) {
      let toKey = getKey(currentTo);
      let domKey = getKey(currentFrom);
      if (!currentFrom) {
        if (toKey && domKeyHoldovers[toKey]) {
          let holdover = domKeyHoldovers[toKey];
          dom.appendChild(holdover);
          currentFrom = holdover;
        } else {
          addNodeTo(currentTo, dom);
          currentTo = currentTo.nextSibling;
          continue;
        }
      }
      if (lookahead) {
        let nextToElementSibling = currentTo.nextElementSibling;
        if (nextToElementSibling && currentFrom.isEqualNode(nextToElementSibling)) {
          currentFrom = addNodeBefore(currentTo, currentFrom);
          domKey = getKey(currentFrom);
        }
      }
      if (toKey !== domKey) {
        if (!toKey && domKey) {
          domKeyHoldovers[domKey] = currentFrom;
          currentFrom = addNodeBefore(currentTo, currentFrom);
          domKeyHoldovers[domKey].remove();
          currentFrom = currentFrom.nextSibling;
          currentTo = currentTo.nextSibling;
          continue;
        }
        if (toKey && !domKey) {
          if (domKeyDomNodeMap[toKey]) {
            currentFrom.parentElement.replaceChild(domKeyDomNodeMap[toKey], currentFrom);
            currentFrom = domKeyDomNodeMap[toKey];
          }
        }
        if (toKey && domKey) {
          domKeyHoldovers[domKey] = currentFrom;
          let domKeyNode = domKeyDomNodeMap[toKey];
          if (domKeyNode) {
            currentFrom.parentElement.replaceChild(domKeyNode, currentFrom);
            currentFrom = domKeyNode;
          } else {
            domKeyHoldovers[domKey] = currentFrom;
            currentFrom = addNodeBefore(currentTo, currentFrom);
            domKeyHoldovers[domKey].remove();
            currentFrom = currentFrom.nextSibling;
            currentTo = currentTo.nextSibling;
            continue;
          }
        }
      }
      patch(currentFrom, currentTo);
      currentTo = currentTo && currentTo.nextSibling;
      currentFrom = currentFrom && currentFrom.nextSibling;
    }
    while (currentFrom) {
      if (!shouldSkip(removing, currentFrom)) {
        let domForRemoval = currentFrom;
        dom.removeChild(domForRemoval);
        removed(domForRemoval);
      }
      currentFrom = currentFrom.nextSibling;
    }
  }
  function getKey(el) {
    return el && el.nodeType === 1 && key(el);
  }
  function keyToMap(els) {
    let map = {};
    els.forEach((el) => {
      let theKey = getKey(el);
      if (theKey) {
        map[theKey] = el;
      }
    });
    return map;
  }
  function shouldSkip(hook, ...args) {
    let skip = false;
    hook(...args, () => skip = true);
    return skip;
  }
  function addNodeTo(node, parent) {
    if (!shouldSkip(adding, node)) {
      let clone2 = node.cloneNode(true);
      parent.appendChild(clone2);
      added(clone2);
    }
  }
  function addNodeBefore(node, beforeMe) {
    if (!shouldSkip(adding, node)) {
      let clone2 = node.cloneNode(true);
      beforeMe.parentElement.insertBefore(clone2, beforeMe);
      added(clone2);
      return clone2;
    }
    return beforeMe;
  }
  function initializeAlpineOnTo(from, to, childrenOnly) {
    if (from.nodeType !== 1)
      return;
    if (from._x_dataStack) {
      window.Alpine.copyTree(from, to);
    }
    if (Array.from(from.attributes).map((attr) => attr.name).some((name) => /x-show/.test(name))) {
      if (from._x_transitioning) {
        childrenOnly();
      } else {
        if (isHiding(from, to)) {
          let style = to.getAttribute("style");
          to.setAttribute("style", style.replace("display: none;", ""));
        } else if (isShowing(from, to)) {
          to.style.display = from.style.display;
        }
      }
    }
  }
  function isHiding(from, to) {
    return from._x_is_shown && !to._x_is_shown;
  }
  function isShowing(from, to) {
    return !from._x_is_shown && to._x_is_shown;
  }

  // src/directives/x-morph.js
  alpine_default.directive("morph", (el, value, modifiers, expression, effect) => {
    let evaluate2 = evaluator(el, expression);
    effect(() => {
      evaluate2()((value2) => {
        if (!el.firstElementChild) {
          if (el.firstChild) {
            el.firstChild.remove();
          }
          el.appendChild(document.createElement("div"));
        }
        morph(el.firstElementChild, value2);
      });
    });
  });

  // src/directives/x-watch.js
  alpine_default.directive("watch", (el, value, modifiers, expression, effect) => {
    let evaluate2 = evaluator(el, `$watch('${value}', $value => ${expression})`);
    setTimeout(() => {
      evaluate2();
    });
  });

  // src/directives/x-init.js
  alpine_default.directive("init", (el, value, modifiers, expression, effect) => {
    evaluate(el, expression, {}, false);
  });

  // src/directives/x-text.js
  alpine_default.directive("text", (el, value, modifiers, expression, effect) => {
    let evaluate2 = evaluator(el, expression);
    effect(() => {
      evaluate2()((value2) => {
        el.textContent = value2;
      });
    });
  });

  // src/directives/x-bind.js
  alpine_default.directive("bind", (el, value, modifiers, expression, effect) => {
    let evaluate2 = evaluator(el, expression);
    if (value === "key")
      return;
    effect(() => evaluate2()((result) => {
      bind(el, value, result, modifiers);
    }));
  });

  // src/scope.js
  function addScopeToNode(node, data, referenceNode) {
    node._x_dataStack = new Set(closestDataStack(referenceNode || node));
    node._x_dataStack.add(data);
  }

  // src/directives/x-data.js
  alpine_default.directive("data", (el, value, modifiers, expression, effect) => {
    expression = expression === "" ? "{}" : expression;
    let components = alpine_default.components;
    let data = Object.keys(components).includes(expression) ? components[expression]() : evaluateSync(el, expression);
    alpine_default.injectMagics(data, el);
    addScopeToNode(el, ht(data));
    if (data["init"]) {
      evaluateSync(el, data["init"].bind(data));
    }
    if (data["destroy"]) {
      alpine_default.addDestroyCallback(el, () => {
        evaluate(el, data["destroy"].bind(data));
      });
    }
  });

  // src/directives/x-show.js
  alpine_default.directive("show", (el, value, modifiers, expression, effect) => {
    let evaluate2 = evaluator(el, expression, {}, true, true);
    let hide = () => {
      el.style.display = "none";
      el._x_is_shown = false;
      el._x_undoHide = () => {
        if (el.style.length === 1 && el.style.display === "none") {
          el.removeAttribute("style");
        } else {
          el.style.removeProperty("display");
        }
      };
    };
    let show = () => {
      el._x_undoHide?.() || delete el._x_undoHide;
      el._x_is_shown = true;
    };
    if (modifiers.includes("transition") && typeof el._x_registerTransitionsFromHelper === "function") {
      el._x_registerTransitionsFromHelper(el, modifiers);
    }
    let toggle = once((value2) => value2 ? show() : hide(), (value2) => {
      if (typeof el._x_toggleAndCascadeWithTransitions === "function") {
        el._x_toggleAndCascadeWithTransitions(el, value2, show, hide);
      } else {
        value2 ? show() : hide();
      }
    });
    effect(() => evaluate2()((value2) => {
      if (modifiers.includes("immediate"))
        value2 ? show() : hide();
      toggle(value2);
    }));
  });

  // src/directives/x-for.js
  alpine_default.directive("for", (el, value, modifiers, expression, effect) => {
    let iteratorNames = parseForExpression(expression);
    let evaluateItems = evaluator(el, iteratorNames.items);
    let evaluateKey = evaluatorSync(el, directivesByType(el, "bind").filter((attribute) => attribute.value === "key")[0]?.expression || "index");
    effect(() => {
      loop(el, iteratorNames, evaluateItems, evaluateKey);
    });
  });
  function loop(el, iteratorNames, evaluateItems, evaluateKey) {
    let templateEl = el;
    evaluateItems()((items) => {
      if (isNumeric4(items) && items > 0) {
        items = Array.from(Array(items).keys(), (i2) => i2 + 1);
      }
      let oldIterations = templateEl._x_old_iterations || [];
      let iterations = Array.from(items).map((item, index) => {
        let scope = getIterationScopeVariables(iteratorNames, item, index, items);
        let key2 = evaluateKey({index, ...scope});
        let element = oldIterations.find((i2) => i2.key === key2)?.element;
        if (element) {
          let existingScope = Array.from(element._x_dataStack).slice(-1)[0];
          Object.entries(scope).forEach(([key3, value]) => {
            existingScope[key3] = value;
          });
        } else {
          let clone2 = document.importNode(templateEl.content, true).firstElementChild;
          addScopeToNode(clone2, ht(scope), templateEl);
          element = clone2;
        }
        return {key: key2, scope, element, remove() {
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
  function isNumeric4(subject) {
    return !Array.isArray(subject) && !isNaN(subject);
  }

  // src/directives/x-ref.js
  var handler2 = function(el, value, modifiers, expression, effect, before) {
    let theRoot = root(el);
    if (!theRoot._x_refs)
      theRoot._x_refs = {};
    theRoot._x_refs[expression] = el;
  };
  handler2.immediate = true;
  alpine_default.directive("ref", handler2);

  // src/directives/x-if.js
  alpine_default.directive("if", (el, value, modifiers, expression) => {
    let evaluate2 = evaluator(el, expression, {}, true, true);
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
          let currentIfEl = el._x_currentIfEl;
          queueMicrotask(() => {
            let undo = setStyles(currentIfEl, {display: "none"});
            if (modifiers.includes("transition") && typeof currentIfEl._x_registerTransitionsFromHelper === "function") {
              currentIfEl._x_registerTransitionsFromHelper(currentIfEl, modifiers);
            }
            el._x_toggleAndCascadeWithTransitions(clone, true, undo, () => {
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
    w(() => evaluate2()((value2) => {
      if (modifiers.includes("immediate"))
        value2 ? show() : hide();
      toggle(value2);
    }));
  });

  // src/directives/x-on.js
  alpine_default.directive("on", (el, value, modifiers, expression) => {
    let evaluate2 = evaluator(el, expression, {}, false);
    let removeListener = on(el, value, modifiers, (e) => {
      evaluate2({$event: e});
    });
    alpine_default.addDestroyCallback(el, removeListener);
  });

  // src/magics/$nextTick.js
  alpine_default.magic("nextTick", (el) => (callback) => scheduler_default.nextTick(callback));

  // src/magics/$dispatch.js
  alpine_default.magic("dispatch", (el) => {
    return (event, detail = {}) => {
      return el._x_dispatch(event, detail);
    };
  });
  window.Element.prototype._x_dispatch = function(event, detail = {}) {
    this.dispatchEvent(new CustomEvent(event, {
      detail,
      bubbles: true,
      composed: true
    }));
  };

  // src/magics/$watch.js
  alpine_default.magic("watch", (el) => {
    return (key2, callback) => {
      let evaluate2 = evaluator(el, key2);
      let firstTime = true;
      let effect = alpine_default.effect(() => evaluate2()((value) => {
        let div = document.createElement("div");
        div.dataset.hey = value;
        if (!firstTime) {
          m();
          callback(value);
          j();
        }
        firstTime = false;
      }));
    };
  });

  // src/magics/$store.js
  alpine_default.magic("store", () => {
    return (name) => alpine_default.getStore(name);
  });

  // src/magics/$morph.js
  alpine_default.magic("morph", (el) => (el2, html, options) => morph(el2, html, options));

  // src/magics/$root.js
  alpine_default.magic("root", (el) => root(el));

  // src/magics/$refs.js
  alpine_default.magic("refs", (el) => root(el)._x_refs || {});

  // src/magics/$el.js
  alpine_default.magic("el", (el) => el);

  // src/index.js
  window.Alpine = alpine_default;
  alpine_default.start();
})();
