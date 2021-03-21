(() => {
  // src/reactivity.js
  var reactive;
  var effect;
  function setReactivity(reactiveFunction, effectFunction) {
    reactive = reactiveFunction;
    effect = effectFunction;
  }

  // src/directives.js
  var directiveHandlers = {};
  function directive(name, callback) {
    directiveHandlers[name] = callback;
  }
  function applyDirective(el, directive2) {
    let noop2 = () => {
    };
    let handler = directiveHandlers[directive2.type] || noop2;
    handler(el, directive2);
  }
  function directives(el, alternativeAttributes) {
    mapAttributes(startingWith("@", into("x-on:")));
    mapAttributes(startingWith(":", into("x-bind:")));
    return Array.from(alternativeAttributes || el.attributes).map(intoTransformedAttributes).filter(outNonAlpineAttributes).map(intoParsedDirectives).sort(byPriority);
  }
  var startingWith = (subject, replacement) => ({name, value}) => {
    if (name.startsWith(subject))
      name = name.replace(subject, replacement);
    return {name, value};
  };
  var into = (i) => i;
  function intoTransformedAttributes({name, value}) {
    return attributeTransformers.reduce((carry, transform) => {
      return transform(carry);
    }, {name, value});
  }
  var attributeTransformers = [];
  function mapAttributes(callback) {
    attributeTransformers.push(callback);
  }
  function outNonAlpineAttributes({name}) {
    return alpineAttributeRegex.test(name);
  }
  var alpineAttributeRegex = /^x-([^:^.]+)\b/;
  function intoParsedDirectives({name, value}) {
    let typeMatch = name.match(alpineAttributeRegex);
    let valueMatch = name.match(/:([a-zA-Z0-9\-:]+)/);
    let modifiers = name.match(/\.[^.\]]+(?=[^\]]*$)/g) || [];
    return {
      type: typeMatch ? typeMatch[1] : null,
      value: valueMatch ? valueMatch[1] : null,
      modifiers: modifiers.map((i) => i.replace(".", "")),
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
  function byPriority(a, b) {
    let typeA = directiveOrder.indexOf(a.type) === -1 ? DEFAULT : a.type;
    let typeB = directiveOrder.indexOf(b.type) === -1 ? DEFAULT : b.type;
    return directiveOrder.indexOf(typeA) - directiveOrder.indexOf(typeB);
  }

  // src/components.js
  var components = {};
  function component(name, callback) {
    components[name] = callback;
  }
  function getComponent(name) {
    return components[name];
  }

  // src/nextTick.js
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

  // src/utils/dispatch.js
  function dispatch(el, name, detail = {}) {
    el.dispatchEvent(new CustomEvent(name, {
      detail,
      bubbles: true,
      composed: true
    }));
  }

  // src/utils/walk.js
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

  // src/utils/root.js
  function root(el) {
    if (el.hasAttribute("x-data") || el.hasAttribute("x-data.append"))
      return el;
    if (!el.parentElement)
      return;
    return root(el.parentElement);
  }

  // src/utils/warn.js
  function warn(message, ...args) {
    console.warn(`Alpine Warning: ${message}`, ...args);
  }

  // src/lifecycle.js
  function start() {
    if (!document.body)
      warn("Unable to initialize. Trying to load Alpine before `<body>` is available. Did you forget to add `defer` in Alpine's `<script>` tag?");
    dispatch(document, "alpine:initializing");
    listenForAndReactToDomManipulations(document.body);
    let outNestedComponents = (el) => !root(el.parentNode || root(el));
    Array.from(document.querySelectorAll(selectors.join(", "))).filter(outNestedComponents).forEach((el) => initTree(el));
    dispatch(document, "alpine:initialized");
  }
  var selectors = ["[x-data]", "[x-data\\.append]"];
  function initTree(el) {
    walk(el, (el2, skip) => {
      directives(el2).forEach((directive2) => {
        if (el2.__x_ignore || el2.__x_ignore_self)
          return;
        applyDirective(el2, directive2);
      });
      if (el2.__x_ignore)
        skip();
    });
  }
  var onDestroys = new WeakMap();
  function onDestroy(el, callback) {
    if (!onDestroys.get(el))
      onDestroys.set(el, []);
    onDestroys.get(el).push(callback);
  }
  function destroyTree(root2) {
    walk(root2, (el) => {
      let callbacks = onDestroys.get(el);
      callbacks && callbacks.forEach((callback) => callback());
    });
  }
  function listenForAndReactToDomManipulations(el) {
    let observer = new MutationObserver((mutations) => {
      let addeds = mutations.flatMap((i) => Array.from(i.addedNodes));
      let removeds = mutations.flatMap((i) => Array.from(i.removedNodes));
      let runIfNotIn = (item, items, callback) => items.includes(item) || callback();
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

  // src/magics.js
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

  // src/stores.js
  var stores = {};
  function store(name, object) {
    stores[name] = this.reactive(object);
  }
  function getStore(name) {
    return stores[name];
  }

  // src/scope.js
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

  // src/evaluator.js
  function evaluate(el, expression, extras = {}) {
    return evaluator(el, expression)(() => {
    }, extras);
  }
  function evaluateSync(el, expression, extras = {}) {
    let result;
    evaluator(el, expression)((value) => result = value, extras);
    return result;
  }
  function evaluatorSync(el, expression, extras = {}) {
    let evaluate2 = evaluator(el, expression);
    return (extras2) => {
      let result;
      evaluate2((value) => result = value, extras2);
      return result;
    };
  }
  function setEvaluator(newEvaluator) {
    evaluator = newEvaluator;
  }
  var evaluator;
  function normalEvaluator(el, expression, extras = {}) {
    let overriddenMagics = {};
    injectMagics(overriddenMagics, el);
    let dataStack = [overriddenMagics, ...closestDataStack(el)];
    if (typeof expression === "function") {
      return generateEvaluatorFromFunction(dataStack, expression);
    }
    let evaluator2 = generateEvaluatorFromString(dataStack, expression);
    return tryCatch.bind(null, el, expression, evaluator2);
  }
  function generateEvaluatorFromFunction(dataStack, func) {
    return (receiver = () => {
    }, {scope: scope2 = {}, params = []} = {}) => {
      let result = func.apply(mergeProxies([scope2, ...dataStack]), params);
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
    }, {scope: scope2 = {}, params = []} = {}) => {
      func.result = void 0;
      func.finished = false;
      let completeScope = mergeProxies([scope2, ...dataStack]);
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
  function runIfTypeOfFunction(receiver, value, scope2, params) {
    if (typeof value === "function") {
      receiver(value.apply(scope2, params));
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

  // src/alpine.js
  var Alpine = {
    setReactivity,
    mapAttributes,
    setEvaluator,
    component,
    directive,
    nextTick,
    reactive,
    effect,
    magic,
    store,
    start
  };
  var alpine_default = Alpine;

  // node_modules/@vue/shared/dist/shared.esm-bundler.js
  function makeMap(str, expectsLowerCase) {
    const map = Object.create(null);
    const list = str.split(",");
    for (let i = 0; i < list.length; i++) {
      map[list[i]] = true;
    }
    return expectsLowerCase ? (val) => !!map[val.toLowerCase()] : (val) => !!map[val];
  }
  var PatchFlagNames = {
    [1]: `TEXT`,
    [2]: `CLASS`,
    [4]: `STYLE`,
    [8]: `PROPS`,
    [16]: `FULL_PROPS`,
    [32]: `HYDRATE_EVENTS`,
    [64]: `STABLE_FRAGMENT`,
    [128]: `KEYED_FRAGMENT`,
    [256]: `UNKEYED_FRAGMENT`,
    [512]: `NEED_PATCH`,
    [1024]: `DYNAMIC_SLOTS`,
    [2048]: `DEV_ROOT_FRAGMENT`,
    [-1]: `HOISTED`,
    [-2]: `BAIL`
  };
  var slotFlagsText = {
    [1]: "STABLE",
    [2]: "DYNAMIC",
    [3]: "FORWARDED"
  };
  var specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`;
  var isBooleanAttr = /* @__PURE__ */ makeMap(specialBooleanAttrs + `,async,autofocus,autoplay,controls,default,defer,disabled,hidden,loop,open,required,reversed,scoped,seamless,checked,muted,multiple,selected`);
  var EMPTY_OBJ = false ? Object.freeze({}) : {};
  var EMPTY_ARR = false ? Object.freeze([]) : [];
  var extend = Object.assign;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var hasOwn = (val, key2) => hasOwnProperty.call(val, key2);
  var isArray = Array.isArray;
  var isMap = (val) => toTypeString(val) === "[object Map]";
  var isString = (val) => typeof val === "string";
  var isSymbol = (val) => typeof val === "symbol";
  var isObject = (val) => val !== null && typeof val === "object";
  var objectToString = Object.prototype.toString;
  var toTypeString = (value) => objectToString.call(value);
  var toRawType = (value) => {
    return toTypeString(value).slice(8, -1);
  };
  var isIntegerKey = (key2) => isString(key2) && key2 !== "NaN" && key2[0] !== "-" && "" + parseInt(key2, 10) === key2;
  var cacheStringFunction = (fn) => {
    const cache = Object.create(null);
    return (str) => {
      const hit = cache[str];
      return hit || (cache[str] = fn(str));
    };
  };
  var camelizeRE = /-(\w)/g;
  var camelize = cacheStringFunction((str) => {
    return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : "");
  });
  var hyphenateRE = /\B([A-Z])/g;
  var hyphenate = cacheStringFunction((str) => str.replace(hyphenateRE, "-$1").toLowerCase());
  var capitalize = cacheStringFunction((str) => str.charAt(0).toUpperCase() + str.slice(1));
  var toHandlerKey = cacheStringFunction((str) => str ? `on${capitalize(str)}` : ``);
  var hasChanged = (value, oldValue) => value !== oldValue && (value === value || oldValue === oldValue);

  // node_modules/@vue/reactivity/dist/reactivity.esm-bundler.js
  var targetMap = new WeakMap();
  var effectStack = [];
  var activeEffect;
  var ITERATE_KEY = Symbol(false ? "iterate" : "");
  var MAP_KEY_ITERATE_KEY = Symbol(false ? "Map key iterate" : "");
  function isEffect(fn) {
    return fn && fn._isEffect === true;
  }
  function effect2(fn, options = EMPTY_OBJ) {
    if (isEffect(fn)) {
      fn = fn.raw;
    }
    const effect3 = createReactiveEffect(fn, options);
    if (!options.lazy) {
      effect3();
    }
    return effect3;
  }
  var uid = 0;
  function createReactiveEffect(fn, options) {
    const effect3 = function reactiveEffect() {
      if (!effect3.active) {
        return options.scheduler ? void 0 : fn();
      }
      if (!effectStack.includes(effect3)) {
        cleanup(effect3);
        try {
          enableTracking();
          effectStack.push(effect3);
          activeEffect = effect3;
          return fn();
        } finally {
          effectStack.pop();
          resetTracking();
          activeEffect = effectStack[effectStack.length - 1];
        }
      }
    };
    effect3.id = uid++;
    effect3.allowRecurse = !!options.allowRecurse;
    effect3._isEffect = true;
    effect3.active = true;
    effect3.raw = fn;
    effect3.deps = [];
    effect3.options = options;
    return effect3;
  }
  function cleanup(effect3) {
    const {deps} = effect3;
    if (deps.length) {
      for (let i = 0; i < deps.length; i++) {
        deps[i].delete(effect3);
      }
      deps.length = 0;
    }
  }
  var shouldTrack = true;
  var trackStack = [];
  function pauseTracking() {
    trackStack.push(shouldTrack);
    shouldTrack = false;
  }
  function enableTracking() {
    trackStack.push(shouldTrack);
    shouldTrack = true;
  }
  function resetTracking() {
    const last = trackStack.pop();
    shouldTrack = last === void 0 ? true : last;
  }
  function track(target, type, key2) {
    if (!shouldTrack || activeEffect === void 0) {
      return;
    }
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = new Map());
    }
    let dep = depsMap.get(key2);
    if (!dep) {
      depsMap.set(key2, dep = new Set());
    }
    if (!dep.has(activeEffect)) {
      dep.add(activeEffect);
      activeEffect.deps.push(dep);
      if (false) {
        activeEffect.options.onTrack({
          effect: activeEffect,
          target,
          type,
          key: key2
        });
      }
    }
  }
  function trigger(target, type, key2, newValue, oldValue, oldTarget) {
    const depsMap = targetMap.get(target);
    if (!depsMap) {
      return;
    }
    const effects = new Set();
    const add2 = (effectsToAdd) => {
      if (effectsToAdd) {
        effectsToAdd.forEach((effect3) => {
          if (effect3 !== activeEffect || effect3.allowRecurse) {
            effects.add(effect3);
          }
        });
      }
    };
    if (type === "clear") {
      depsMap.forEach(add2);
    } else if (key2 === "length" && isArray(target)) {
      depsMap.forEach((dep, key3) => {
        if (key3 === "length" || key3 >= newValue) {
          add2(dep);
        }
      });
    } else {
      if (key2 !== void 0) {
        add2(depsMap.get(key2));
      }
      switch (type) {
        case "add":
          if (!isArray(target)) {
            add2(depsMap.get(ITERATE_KEY));
            if (isMap(target)) {
              add2(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          } else if (isIntegerKey(key2)) {
            add2(depsMap.get("length"));
          }
          break;
        case "delete":
          if (!isArray(target)) {
            add2(depsMap.get(ITERATE_KEY));
            if (isMap(target)) {
              add2(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          }
          break;
        case "set":
          if (isMap(target)) {
            add2(depsMap.get(ITERATE_KEY));
          }
          break;
      }
    }
    const run = (effect3) => {
      if (false) {
        effect3.options.onTrigger({
          effect: effect3,
          target,
          key: key2,
          type,
          newValue,
          oldValue,
          oldTarget
        });
      }
      if (effect3.options.scheduler) {
        effect3.options.scheduler(effect3);
      } else {
        effect3();
      }
    };
    effects.forEach(run);
  }
  var builtInSymbols = new Set(Object.getOwnPropertyNames(Symbol).map((key2) => Symbol[key2]).filter(isSymbol));
  var get = /* @__PURE__ */ createGetter();
  var shallowGet = /* @__PURE__ */ createGetter(false, true);
  var readonlyGet = /* @__PURE__ */ createGetter(true);
  var shallowReadonlyGet = /* @__PURE__ */ createGetter(true, true);
  var arrayInstrumentations = {};
  ["includes", "indexOf", "lastIndexOf"].forEach((key2) => {
    const method = Array.prototype[key2];
    arrayInstrumentations[key2] = function(...args) {
      const arr = toRaw(this);
      for (let i = 0, l = this.length; i < l; i++) {
        track(arr, "get", i + "");
      }
      const res = method.apply(arr, args);
      if (res === -1 || res === false) {
        return method.apply(arr, args.map(toRaw));
      } else {
        return res;
      }
    };
  });
  ["push", "pop", "shift", "unshift", "splice"].forEach((key2) => {
    const method = Array.prototype[key2];
    arrayInstrumentations[key2] = function(...args) {
      pauseTracking();
      const res = method.apply(this, args);
      resetTracking();
      return res;
    };
  });
  function createGetter(isReadonly = false, shallow = false) {
    return function get2(target, key2, receiver) {
      if (key2 === "__v_isReactive") {
        return !isReadonly;
      } else if (key2 === "__v_isReadonly") {
        return isReadonly;
      } else if (key2 === "__v_raw" && receiver === (isReadonly ? readonlyMap : reactiveMap).get(target)) {
        return target;
      }
      const targetIsArray = isArray(target);
      if (!isReadonly && targetIsArray && hasOwn(arrayInstrumentations, key2)) {
        return Reflect.get(arrayInstrumentations, key2, receiver);
      }
      const res = Reflect.get(target, key2, receiver);
      if (isSymbol(key2) ? builtInSymbols.has(key2) : key2 === `__proto__` || key2 === `__v_isRef`) {
        return res;
      }
      if (!isReadonly) {
        track(target, "get", key2);
      }
      if (shallow) {
        return res;
      }
      if (isRef(res)) {
        const shouldUnwrap = !targetIsArray || !isIntegerKey(key2);
        return shouldUnwrap ? res.value : res;
      }
      if (isObject(res)) {
        return isReadonly ? readonly(res) : reactive2(res);
      }
      return res;
    };
  }
  var set = /* @__PURE__ */ createSetter();
  var shallowSet = /* @__PURE__ */ createSetter(true);
  function createSetter(shallow = false) {
    return function set2(target, key2, value, receiver) {
      const oldValue = target[key2];
      if (!shallow) {
        value = toRaw(value);
        if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
          oldValue.value = value;
          return true;
        }
      }
      const hadKey = isArray(target) && isIntegerKey(key2) ? Number(key2) < target.length : hasOwn(target, key2);
      const result = Reflect.set(target, key2, value, receiver);
      if (target === toRaw(receiver)) {
        if (!hadKey) {
          trigger(target, "add", key2, value);
        } else if (hasChanged(value, oldValue)) {
          trigger(target, "set", key2, value, oldValue);
        }
      }
      return result;
    };
  }
  function deleteProperty(target, key2) {
    const hadKey = hasOwn(target, key2);
    const oldValue = target[key2];
    const result = Reflect.deleteProperty(target, key2);
    if (result && hadKey) {
      trigger(target, "delete", key2, void 0, oldValue);
    }
    return result;
  }
  function has(target, key2) {
    const result = Reflect.has(target, key2);
    if (!isSymbol(key2) || !builtInSymbols.has(key2)) {
      track(target, "has", key2);
    }
    return result;
  }
  function ownKeys(target) {
    track(target, "iterate", isArray(target) ? "length" : ITERATE_KEY);
    return Reflect.ownKeys(target);
  }
  var mutableHandlers = {
    get,
    set,
    deleteProperty,
    has,
    ownKeys
  };
  var readonlyHandlers = {
    get: readonlyGet,
    set(target, key2) {
      if (false) {
        console.warn(`Set operation on key "${String(key2)}" failed: target is readonly.`, target);
      }
      return true;
    },
    deleteProperty(target, key2) {
      if (false) {
        console.warn(`Delete operation on key "${String(key2)}" failed: target is readonly.`, target);
      }
      return true;
    }
  };
  var shallowReactiveHandlers = extend({}, mutableHandlers, {
    get: shallowGet,
    set: shallowSet
  });
  var shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
  });
  var toReactive = (value) => isObject(value) ? reactive2(value) : value;
  var toReadonly = (value) => isObject(value) ? readonly(value) : value;
  var toShallow = (value) => value;
  var getProto = (v) => Reflect.getPrototypeOf(v);
  function get$1(target, key2, isReadonly = false, isShallow = false) {
    target = target["__v_raw"];
    const rawTarget = toRaw(target);
    const rawKey = toRaw(key2);
    if (key2 !== rawKey) {
      !isReadonly && track(rawTarget, "get", key2);
    }
    !isReadonly && track(rawTarget, "get", rawKey);
    const {has: has2} = getProto(rawTarget);
    const wrap = isReadonly ? toReadonly : isShallow ? toShallow : toReactive;
    if (has2.call(rawTarget, key2)) {
      return wrap(target.get(key2));
    } else if (has2.call(rawTarget, rawKey)) {
      return wrap(target.get(rawKey));
    }
  }
  function has$1(key2, isReadonly = false) {
    const target = this["__v_raw"];
    const rawTarget = toRaw(target);
    const rawKey = toRaw(key2);
    if (key2 !== rawKey) {
      !isReadonly && track(rawTarget, "has", key2);
    }
    !isReadonly && track(rawTarget, "has", rawKey);
    return key2 === rawKey ? target.has(key2) : target.has(key2) || target.has(rawKey);
  }
  function size(target, isReadonly = false) {
    target = target["__v_raw"];
    !isReadonly && track(toRaw(target), "iterate", ITERATE_KEY);
    return Reflect.get(target, "size", target);
  }
  function add(value) {
    value = toRaw(value);
    const target = toRaw(this);
    const proto = getProto(target);
    const hadKey = proto.has.call(target, value);
    target.add(value);
    if (!hadKey) {
      trigger(target, "add", value, value);
    }
    return this;
  }
  function set$1(key2, value) {
    value = toRaw(value);
    const target = toRaw(this);
    const {has: has2, get: get2} = getProto(target);
    let hadKey = has2.call(target, key2);
    if (!hadKey) {
      key2 = toRaw(key2);
      hadKey = has2.call(target, key2);
    } else if (false) {
      checkIdentityKeys(target, has2, key2);
    }
    const oldValue = get2.call(target, key2);
    target.set(key2, value);
    if (!hadKey) {
      trigger(target, "add", key2, value);
    } else if (hasChanged(value, oldValue)) {
      trigger(target, "set", key2, value, oldValue);
    }
    return this;
  }
  function deleteEntry(key2) {
    const target = toRaw(this);
    const {has: has2, get: get2} = getProto(target);
    let hadKey = has2.call(target, key2);
    if (!hadKey) {
      key2 = toRaw(key2);
      hadKey = has2.call(target, key2);
    } else if (false) {
      checkIdentityKeys(target, has2, key2);
    }
    const oldValue = get2 ? get2.call(target, key2) : void 0;
    const result = target.delete(key2);
    if (hadKey) {
      trigger(target, "delete", key2, void 0, oldValue);
    }
    return result;
  }
  function clear() {
    const target = toRaw(this);
    const hadItems = target.size !== 0;
    const oldTarget = false ? isMap(target) ? new Map(target) : new Set(target) : void 0;
    const result = target.clear();
    if (hadItems) {
      trigger(target, "clear", void 0, void 0, oldTarget);
    }
    return result;
  }
  function createForEach(isReadonly, isShallow) {
    return function forEach(callback, thisArg) {
      const observed = this;
      const target = observed["__v_raw"];
      const rawTarget = toRaw(target);
      const wrap = isReadonly ? toReadonly : isShallow ? toShallow : toReactive;
      !isReadonly && track(rawTarget, "iterate", ITERATE_KEY);
      return target.forEach((value, key2) => {
        return callback.call(thisArg, wrap(value), wrap(key2), observed);
      });
    };
  }
  function createIterableMethod(method, isReadonly, isShallow) {
    return function(...args) {
      const target = this["__v_raw"];
      const rawTarget = toRaw(target);
      const targetIsMap = isMap(rawTarget);
      const isPair = method === "entries" || method === Symbol.iterator && targetIsMap;
      const isKeyOnly = method === "keys" && targetIsMap;
      const innerIterator = target[method](...args);
      const wrap = isReadonly ? toReadonly : isShallow ? toShallow : toReactive;
      !isReadonly && track(rawTarget, "iterate", isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY);
      return {
        next() {
          const {value, done} = innerIterator.next();
          return done ? {value, done} : {
            value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
            done
          };
        },
        [Symbol.iterator]() {
          return this;
        }
      };
    };
  }
  function createReadonlyMethod(type) {
    return function(...args) {
      if (false) {
        const key2 = args[0] ? `on key "${args[0]}" ` : ``;
        console.warn(`${capitalize(type)} operation ${key2}failed: target is readonly.`, toRaw(this));
      }
      return type === "delete" ? false : this;
    };
  }
  var mutableInstrumentations = {
    get(key2) {
      return get$1(this, key2);
    },
    get size() {
      return size(this);
    },
    has: has$1,
    add,
    set: set$1,
    delete: deleteEntry,
    clear,
    forEach: createForEach(false, false)
  };
  var shallowInstrumentations = {
    get(key2) {
      return get$1(this, key2, false, true);
    },
    get size() {
      return size(this);
    },
    has: has$1,
    add,
    set: set$1,
    delete: deleteEntry,
    clear,
    forEach: createForEach(false, true)
  };
  var readonlyInstrumentations = {
    get(key2) {
      return get$1(this, key2, true);
    },
    get size() {
      return size(this, true);
    },
    has(key2) {
      return has$1.call(this, key2, true);
    },
    add: createReadonlyMethod("add"),
    set: createReadonlyMethod("set"),
    delete: createReadonlyMethod("delete"),
    clear: createReadonlyMethod("clear"),
    forEach: createForEach(true, false)
  };
  var iteratorMethods = ["keys", "values", "entries", Symbol.iterator];
  iteratorMethods.forEach((method) => {
    mutableInstrumentations[method] = createIterableMethod(method, false, false);
    readonlyInstrumentations[method] = createIterableMethod(method, true, false);
    shallowInstrumentations[method] = createIterableMethod(method, false, true);
  });
  function createInstrumentationGetter(isReadonly, shallow) {
    const instrumentations = shallow ? shallowInstrumentations : isReadonly ? readonlyInstrumentations : mutableInstrumentations;
    return (target, key2, receiver) => {
      if (key2 === "__v_isReactive") {
        return !isReadonly;
      } else if (key2 === "__v_isReadonly") {
        return isReadonly;
      } else if (key2 === "__v_raw") {
        return target;
      }
      return Reflect.get(hasOwn(instrumentations, key2) && key2 in target ? instrumentations : target, key2, receiver);
    };
  }
  var mutableCollectionHandlers = {
    get: createInstrumentationGetter(false, false)
  };
  var shallowCollectionHandlers = {
    get: createInstrumentationGetter(false, true)
  };
  var readonlyCollectionHandlers = {
    get: createInstrumentationGetter(true, false)
  };
  var reactiveMap = new WeakMap();
  var readonlyMap = new WeakMap();
  function targetTypeMap(rawType) {
    switch (rawType) {
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
  }
  function getTargetType(value) {
    return value["__v_skip"] || !Object.isExtensible(value) ? 0 : targetTypeMap(toRawType(value));
  }
  function reactive2(target) {
    if (target && target["__v_isReadonly"]) {
      return target;
    }
    return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers);
  }
  function readonly(target) {
    return createReactiveObject(target, true, readonlyHandlers, readonlyCollectionHandlers);
  }
  function createReactiveObject(target, isReadonly, baseHandlers, collectionHandlers) {
    if (!isObject(target)) {
      if (false) {
        console.warn(`value cannot be made reactive: ${String(target)}`);
      }
      return target;
    }
    if (target["__v_raw"] && !(isReadonly && target["__v_isReactive"])) {
      return target;
    }
    const proxyMap = isReadonly ? readonlyMap : reactiveMap;
    const existingProxy = proxyMap.get(target);
    if (existingProxy) {
      return existingProxy;
    }
    const targetType = getTargetType(target);
    if (targetType === 0) {
      return target;
    }
    const proxy = new Proxy(target, targetType === 2 ? collectionHandlers : baseHandlers);
    proxyMap.set(target, proxy);
    return proxy;
  }
  function toRaw(observed) {
    return observed && toRaw(observed["__v_raw"]) || observed;
  }
  function isRef(r) {
    return Boolean(r && r.__v_isRef === true);
  }

  // src/utils/classes.js
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
    let missingClasses = (classString2) => classString2.split(" ").filter((i) => !el.classList.contains(i)).filter(Boolean);
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
    let added2 = [];
    let removed2 = [];
    forAdd.forEach((i) => {
      if (!el.classList.contains(i)) {
        el.classList.add(i);
        added2.push(i);
      }
    });
    forRemove.forEach((i) => {
      if (el.classList.contains(i)) {
        el.classList.remove(i);
        removed2.push(i);
      }
    });
    return () => {
      added2.forEach((i) => el.classList.remove(i));
      removed2.forEach((i) => el.classList.add(i));
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

  // src/directives/x-transition.js
  var x_transition_default = (el, {value, modifiers, expression}) => {
    if (!expression) {
      registerTransitionsFromHelper(el, modifiers, value);
    } else {
      registerTransitionsFromClassString(el, expression, value);
    }
  };
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
      modifiers = modifiers.filter((i, index) => index < modifiers.indexOf("out"));
    }
    if (modifiers.includes("out") && !doesntSpecify) {
      modifiers = modifiers.filter((i, index) => index > modifiers.indexOf("out"));
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
    if (value) {
      el._x_transition ? el._x_transition.in(show) : show();
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
            ]).then(([i]) => i());
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
  function modifierValue(modifiers, key2, fallback) {
    if (modifiers.indexOf(key2) === -1)
      return fallback;
    const rawValue = modifiers[modifiers.indexOf(key2) + 1];
    if (!rawValue)
      return fallback;
    if (key2 === "scale") {
      if (isNaN(rawValue))
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

  // src/directives/x-destroy.js
  var x_destroy_default = (el, {value, modifiers, expression}) => {
    onDestroy(el, () => evaluate(el, expression, {}, false));
  };

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
    for (let i = domAttributes.length - 1; i >= 0; i--) {
      let name = domAttributes[i].name;
      if (!to.hasAttribute(name))
        dom.removeAttribute(name);
    }
    for (let i = toAttributes.length - 1; i >= 0; i--) {
      let name = toAttributes[i].name;
      let value = toAttributes[i].value;
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
      let clone = node.cloneNode(true);
      parent.appendChild(clone);
      added(clone);
    }
  }
  function addNodeBefore(node, beforeMe) {
    if (!shouldSkip(adding, node)) {
      let clone = node.cloneNode(true);
      beforeMe.parentElement.insertBefore(clone, beforeMe);
      added(clone);
      return clone;
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
  var x_morph_default = (el, {value, modifiers, expression}) => {
    let evaluate2 = evaluator(el, expression);
    effect(() => {
      evaluate2((value2) => {
        if (!el.firstElementChild) {
          if (el.firstChild)
            el.firstChild.remove();
          el.appendChild(document.createElement("div"));
        }
        morph(el.firstElementChild, value2);
      });
    });
  };

  // src/utils/bind.js
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
    if ([null, void 0, false].includes(value)) {
      el.removeAttribute(name);
    } else {
      if (isBooleanAttr2(name))
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
  function isBooleanAttr2(attrName) {
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
    let handler = (e) => callback(e);
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
      handler = wrapHandler(handler, (next, e) => {
        e.preventDefault();
        next(e);
      });
    if (modifiers.includes("stop"))
      handler = wrapHandler(handler, (next, e) => {
        e.stopPropagation();
        next(e);
      });
    if (modifiers.includes("self"))
      handler = wrapHandler(handler, (next, e) => {
        e.target === el && next(e);
      });
    if (modifiers.includes("away")) {
      listenerTarget = document;
      handler = wrapHandler(handler, (next, e) => {
        if (el.contains(e.target))
          return;
        if (el.offsetWidth < 1 && el.offsetHeight < 1)
          return;
        next(e);
      });
    }
    handler = wrapHandler(handler, (next, e) => {
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
      handler = debounce(handler, wait, this);
    }
    if (modifiers.includes("throttle")) {
      let nextModifier = modifiers[modifiers.indexOf("throttle") + 1] || "invalid-wait";
      let wait = isNumeric(nextModifier.split("ms")[0]) ? Number(nextModifier.split("ms")[0]) : 250;
      handler = throttle(handler, wait, this);
    }
    if (modifiers.includes("once")) {
      handler = wrapHandler(handler, (next, e) => {
        next(e);
        listenerTarget.removeEventListener(event, handler, options);
      });
    }
    listenerTarget.addEventListener(event, handler, options);
    return () => {
      listenerTarget.removeEventListener(event, handler, options);
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
    let keyModifiers = modifiers.filter((i) => {
      return !["window", "document", "prevent", "stop", "once"].includes(i);
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
    keyModifiers = keyModifiers.filter((i) => !selectedSystemKeyModifiers.includes(i));
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
  var x_model_default = (el, {value, modifiers, expression}) => {
    let evaluate2 = evaluator(el, expression);
    let assignmentExpression = `${expression} = rightSideOfExpression($event, ${expression})`;
    let evaluateAssignment = evaluator(el, assignmentExpression);
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
  };
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

  // src/directives/x-cloak.js
  var x_cloak_default = (el) => nextTick(() => el.removeAttribute("x-cloak"));

  // src/directives/x-ignore.js
  var x_ignore_default = (el, {modifiers}) => modifiers.includes("self") ? el.__x_ignore_self = true : el.__x_ignore = true;

  // src/directives/x-init.js
  var x_init_default = (el, {expression}) => evaluate(el, expression, {}, false);

  // src/directives/x-text.js
  var x_text_default = (el, {expression}) => {
    let evaluate2 = evaluator(el, expression);
    effect(() => evaluate2((value) => el.textContent = value));
  };

  // src/directives/x-bind.js
  var x_bind_default = (el, {value, modifiers, expression}) => {
    if (!value)
      return applyBindingsObject(el, expression);
    if (value === "key")
      return storeKeyForXFor(el, expression);
    let evaluate2 = evaluator(el, expression);
    effect(() => evaluate2((result) => {
      bind(el, value, result, modifiers);
    }));
  };
  function applyBindingsObject(el, expression) {
    let bindings = evaluateSync(el, expression);
    let attributes = Object.entries(bindings).map(([name, value]) => ({name, value}));
    directives(el, attributes).forEach((directive2) => {
      applyDirective(el, directive2);
    });
  }
  function storeKeyForXFor(el, expression) {
    el._x_key_expression = expression;
  }

  // src/directives/x-data.js
  var x_data_default = (el, {value, modifiers, expression}) => {
    expression = expression === "" ? "{}" : expression;
    let component2 = getComponent(expression);
    let data = component2 ? component2() : evaluateSync(el, expression);
    injectMagics(data, el);
    addScopeToNode(el, reactive(data));
    if (data["init"])
      data["init"]();
    if (data["destroy"]) {
      onDestroy(el, () => {
        data["destory"]();
      });
    }
  };

  // src/directives/x-show.js
  var x_show_default = (el, {value, modifiers, expression}) => {
    let evaluate2 = evaluator(el, expression);
    let hide = () => {
      el._x_undoHide = setStyles(el, {display: "none"});
      el._x_is_shown = false;
    };
    let show = () => {
      el._x_undoHide?.() || delete el._x_undoHide;
      el._x_is_shown = true;
    };
    let toggle = once((value2) => value2 ? show() : hide(), (value2) => {
      if (typeof el._x_toggleAndCascadeWithTransitions === "function") {
        el._x_toggleAndCascadeWithTransitions(el, value2, show, hide);
      } else {
        value2 ? show() : hide();
      }
    });
    effect(() => evaluate2((value2) => {
      if (modifiers.includes("immediate"))
        value2 ? show() : hide();
      toggle(value2);
    }));
  };

  // src/directives/x-for.js
  var x_for_default = (el, {value, modifiers, expression}) => {
    let iteratorNames = parseForExpression(expression);
    let evaluateItems = evaluator(el, iteratorNames.items);
    let evaluateKey = evaluatorSync(el, el._x_key_expression || "index");
    effect(() => loop(el, iteratorNames, evaluateItems, evaluateKey));
  };
  function loop(el, iteratorNames, evaluateItems, evaluateKey) {
    let templateEl = el;
    evaluateItems((items) => {
      if (isNumeric3(items) && items >= 0) {
        items = Array.from(Array(items).keys(), (i) => i + 1);
      }
      let oldIterations = templateEl._x_old_iterations || [];
      let iterations = Array.from(items).map((item, index) => {
        let scope2 = getIterationScopeVariables(iteratorNames, item, index, items);
        let key2 = evaluateKey({scope: {index, ...scope2}});
        let element = oldIterations.find((i) => i.key === key2)?.element;
        if (element) {
          let existingScope = element._x_dataStack[0];
          Object.entries(scope2).forEach(([key3, value]) => {
            existingScope[key3] = value;
          });
        } else {
          let clone = document.importNode(templateEl.content, true).firstElementChild;
          addScopeToNode(clone, reactive(scope2), templateEl);
          element = clone;
        }
        return {key: key2, scope: scope2, element, remove() {
          element.remove();
        }};
      });
      let unusedIterations = oldIterations.filter((i) => !iterations.map((i2) => i2.key).includes(i.key));
      unusedIterations.forEach((iteration) => iteration.remove());
      templateEl._x_old_iterations = iterations;
      queueMicrotask(() => {
        templateEl.after(...iterations.map((i) => i.element));
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

  // src/directives/x-ref.js
  var x_ref_default = (el, {expression}) => {
    let root2 = root(el);
    if (!root2._x_refs)
      root2._x_refs = {};
    root2._x_refs[expression] = el;
  };

  // src/directives/x-if.js
  var x_if_default = (el, {value, modifiers, expression}) => {
    let evaluate2 = evaluator(el, expression);
    let show = () => {
      if (el._x_currentIfEl)
        return el._x_currentIfEl;
      let clone = el.content.cloneNode(true).firstElementChild;
      el.after(clone);
      el._x_currentIfEl = clone;
      el._x_undoIf = () => {
        clone.remove();
        delete el._x_currentIfEl;
      };
      return clone;
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
  };

  // src/directives/x-on.js
  var x_on_default = (el, {value, modifiers, expression}) => {
    let evaluate2 = expression ? evaluator(el, expression) : () => {
    };
    let removeListener = on(el, value, modifiers, (e) => {
      evaluate2(() => {
      }, {scope: {$event: e}, params: [e]});
    });
    onDestroy(el, removeListener);
  };

  // src/magics/$nextTick.js
  var nextTick_default = () => nextTick;

  // src/magics/$dispatch.js
  var dispatch_default = (el) => dispatch.bind(dispatch, el);

  // src/magics/$watch.js
  var watch_default = (el) => (key2, callback) => {
    let evaluate2 = evaluator(el, key2);
    let firstTime = true;
    effect(() => evaluate2((value) => {
      let div = document.createElement("div");
      div.dataset.throwAway = value;
      if (!firstTime)
        callback(value);
      firstTime = false;
    }));
  };

  // src/magics/$store.js
  var store_default = () => (name) => getStore(name);

  // src/magics/$refs.js
  var refs_default = (el) => root(el)._x_refs || {};

  // src/magics/$el.js
  var el_default = (el) => el;

  // src/index.js
  alpine_default.setEvaluator(normalEvaluator);
  alpine_default.setReactivity(reactive2, effect2);
  alpine_default.directive("transition", x_transition_default);
  alpine_default.directive("destroy", x_destroy_default);
  alpine_default.directive("morph", x_morph_default);
  alpine_default.directive("model", x_model_default);
  alpine_default.directive("cloak", x_cloak_default);
  alpine_default.directive("ignore", x_ignore_default);
  alpine_default.directive("init", x_init_default);
  alpine_default.directive("text", x_text_default);
  alpine_default.directive("bind", x_bind_default);
  alpine_default.directive("data", x_data_default);
  alpine_default.directive("show", x_show_default);
  alpine_default.directive("for", x_for_default);
  alpine_default.directive("ref", x_ref_default);
  alpine_default.directive("if", x_if_default);
  alpine_default.directive("on", x_on_default);
  alpine_default.magic("nextTick", nextTick_default);
  alpine_default.magic("dispatch", dispatch_default);
  alpine_default.magic("watch", watch_default);
  alpine_default.magic("store", store_default);
  alpine_default.magic("refs", refs_default);
  alpine_default.magic("el", el_default);
  window.Alpine = alpine_default;
  alpine_default.start();
})();
