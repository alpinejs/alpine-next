(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
}((function () { 'use strict';

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);

    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      if (enumerableOnly) symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
      keys.push.apply(keys, symbols);
    }

    return keys;
  }

  function _objectSpread2(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};

      if (i % 2) {
        ownKeys(Object(source), true).forEach(function (key) {
          _defineProperty(target, key, source[key]);
        });
      } else if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
      } else {
        ownKeys(Object(source)).forEach(function (key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
    }

    return target;
  }

  var scheduler = {
    tasks: [],
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
        if (this.shouldFlush) this.flush();
        this.shouldFlush = false;
      });
    },

    flush() {
      setTimeout(() => {
        let DEADLINE = performance.now() + 80;

        while (this.tasks.length > 0) {
          var _navigator, _navigator$scheduling;

          //  || performance.now() >= DEADLINE
          if ((_navigator = navigator) === null || _navigator === void 0 ? void 0 : (_navigator$scheduling = _navigator.scheduling) === null || _navigator$scheduling === void 0 ? void 0 : _navigator$scheduling.isInputPending()) {
            // Yield if we have to handle an input event, or we're out of time.
            setTimeout(this.flush.bind(this));
            return;
          }

          this.tasks.shift()();
        }

        if (!this.holdNextTicksOver) {
          // Flush anything added by $nextTick
          while (this.nextTicks.length > 0) {
            this.nextTicks.shift()();
          }
        }
      });
    }

  };

  /**
   * Make a map and return a function for checking if a key
   * is in that map.
   * IMPORTANT: all calls of this function must be prefixed with
   * \/\*#\_\_PURE\_\_\*\/
   * So that rollup can tree-shake them if necessary.
   */
  const EMPTY_OBJ =  {};
  const extend = Object.assign;
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  const hasOwn = (val, key) => hasOwnProperty.call(val, key);
  const isArray = Array.isArray;
  const isMap = (val) => toTypeString(val) === '[object Map]';
  const isString = (val) => typeof val === 'string';
  const isSymbol = (val) => typeof val === 'symbol';
  const isObject = (val) => val !== null && typeof val === 'object';
  const objectToString = Object.prototype.toString;
  const toTypeString = (value) => objectToString.call(value);
  const toRawType = (value) => {
      // extract "RawType" from strings like "[object RawType]"
      return toTypeString(value).slice(8, -1);
  };
  const isIntegerKey = (key) => isString(key) &&
      key !== 'NaN' &&
      key[0] !== '-' &&
      '' + parseInt(key, 10) === key;
  // compare whether a value has changed, accounting for NaN.
  const hasChanged = (value, oldValue) => value !== oldValue && (value === value || oldValue === oldValue);

  const targetMap = new WeakMap();
  const effectStack = [];
  let activeEffect;
  const ITERATE_KEY = Symbol( '');
  const MAP_KEY_ITERATE_KEY = Symbol( '');
  function isEffect(fn) {
      return fn && fn._isEffect === true;
  }
  function effect(fn, options = EMPTY_OBJ) {
      if (isEffect(fn)) {
          fn = fn.raw;
      }
      const effect = createReactiveEffect(fn, options);
      if (!options.lazy) {
          effect();
      }
      return effect;
  }
  let uid = 0;
  function createReactiveEffect(fn, options) {
      const effect = function reactiveEffect() {
          if (!effect.active) {
              return options.scheduler ? undefined : fn();
          }
          if (!effectStack.includes(effect)) {
              cleanup(effect);
              try {
                  enableTracking();
                  effectStack.push(effect);
                  activeEffect = effect;
                  return fn();
              }
              finally {
                  effectStack.pop();
                  resetTracking();
                  activeEffect = effectStack[effectStack.length - 1];
              }
          }
      };
      effect.id = uid++;
      effect.allowRecurse = !!options.allowRecurse;
      effect._isEffect = true;
      effect.active = true;
      effect.raw = fn;
      effect.deps = [];
      effect.options = options;
      return effect;
  }
  function cleanup(effect) {
      const { deps } = effect;
      if (deps.length) {
          for (let i = 0; i < deps.length; i++) {
              deps[i].delete(effect);
          }
          deps.length = 0;
      }
  }
  let shouldTrack = true;
  const trackStack = [];
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
      shouldTrack = last === undefined ? true : last;
  }
  function track(target, type, key) {
      if (!shouldTrack || activeEffect === undefined) {
          return;
      }
      let depsMap = targetMap.get(target);
      if (!depsMap) {
          targetMap.set(target, (depsMap = new Map()));
      }
      let dep = depsMap.get(key);
      if (!dep) {
          depsMap.set(key, (dep = new Set()));
      }
      if (!dep.has(activeEffect)) {
          dep.add(activeEffect);
          activeEffect.deps.push(dep);
      }
  }
  function trigger(target, type, key, newValue, oldValue, oldTarget) {
      const depsMap = targetMap.get(target);
      if (!depsMap) {
          // never been tracked
          return;
      }
      const effects = new Set();
      const add = (effectsToAdd) => {
          if (effectsToAdd) {
              effectsToAdd.forEach(effect => {
                  if (effect !== activeEffect || effect.allowRecurse) {
                      effects.add(effect);
                  }
              });
          }
      };
      if (type === "clear" /* CLEAR */) {
          // collection being cleared
          // trigger all effects for target
          depsMap.forEach(add);
      }
      else if (key === 'length' && isArray(target)) {
          depsMap.forEach((dep, key) => {
              if (key === 'length' || key >= newValue) {
                  add(dep);
              }
          });
      }
      else {
          // schedule runs for SET | ADD | DELETE
          if (key !== void 0) {
              add(depsMap.get(key));
          }
          // also run for iteration key on ADD | DELETE | Map.SET
          switch (type) {
              case "add" /* ADD */:
                  if (!isArray(target)) {
                      add(depsMap.get(ITERATE_KEY));
                      if (isMap(target)) {
                          add(depsMap.get(MAP_KEY_ITERATE_KEY));
                      }
                  }
                  else if (isIntegerKey(key)) {
                      // new index added to array -> length changes
                      add(depsMap.get('length'));
                  }
                  break;
              case "delete" /* DELETE */:
                  if (!isArray(target)) {
                      add(depsMap.get(ITERATE_KEY));
                      if (isMap(target)) {
                          add(depsMap.get(MAP_KEY_ITERATE_KEY));
                      }
                  }
                  break;
              case "set" /* SET */:
                  if (isMap(target)) {
                      add(depsMap.get(ITERATE_KEY));
                  }
                  break;
          }
      }
      const run = (effect) => {
          if (effect.options.scheduler) {
              effect.options.scheduler(effect);
          }
          else {
              effect();
          }
      };
      effects.forEach(run);
  }

  const builtInSymbols = new Set(Object.getOwnPropertyNames(Symbol)
      .map(key => Symbol[key])
      .filter(isSymbol));
  const get = /*#__PURE__*/ createGetter();
  const shallowGet = /*#__PURE__*/ createGetter(false, true);
  const readonlyGet = /*#__PURE__*/ createGetter(true);
  const shallowReadonlyGet = /*#__PURE__*/ createGetter(true, true);
  const arrayInstrumentations = {};
  ['includes', 'indexOf', 'lastIndexOf'].forEach(key => {
      const method = Array.prototype[key];
      arrayInstrumentations[key] = function (...args) {
          const arr = toRaw(this);
          for (let i = 0, l = this.length; i < l; i++) {
              track(arr, "get" /* GET */, i + '');
          }
          // we run the method using the original args first (which may be reactive)
          const res = method.apply(arr, args);
          if (res === -1 || res === false) {
              // if that didn't work, run it again using raw values.
              return method.apply(arr, args.map(toRaw));
          }
          else {
              return res;
          }
      };
  });
  ['push', 'pop', 'shift', 'unshift', 'splice'].forEach(key => {
      const method = Array.prototype[key];
      arrayInstrumentations[key] = function (...args) {
          pauseTracking();
          const res = method.apply(this, args);
          resetTracking();
          return res;
      };
  });
  function createGetter(isReadonly = false, shallow = false) {
      return function get(target, key, receiver) {
          if (key === "__v_isReactive" /* IS_REACTIVE */) {
              return !isReadonly;
          }
          else if (key === "__v_isReadonly" /* IS_READONLY */) {
              return isReadonly;
          }
          else if (key === "__v_raw" /* RAW */ &&
              receiver === (isReadonly ? readonlyMap : reactiveMap).get(target)) {
              return target;
          }
          const targetIsArray = isArray(target);
          if (targetIsArray && hasOwn(arrayInstrumentations, key)) {
              return Reflect.get(arrayInstrumentations, key, receiver);
          }
          const res = Reflect.get(target, key, receiver);
          if (isSymbol(key)
              ? builtInSymbols.has(key)
              : key === `__proto__` || key === `__v_isRef`) {
              return res;
          }
          if (!isReadonly) {
              track(target, "get" /* GET */, key);
          }
          if (shallow) {
              return res;
          }
          if (isRef(res)) {
              // ref unwrapping - does not apply for Array + integer key.
              const shouldUnwrap = !targetIsArray || !isIntegerKey(key);
              return shouldUnwrap ? res.value : res;
          }
          if (isObject(res)) {
              // Convert returned value into a proxy as well. we do the isObject check
              // here to avoid invalid value warning. Also need to lazy access readonly
              // and reactive here to avoid circular dependency.
              return isReadonly ? readonly(res) : reactive(res);
          }
          return res;
      };
  }
  const set = /*#__PURE__*/ createSetter();
  const shallowSet = /*#__PURE__*/ createSetter(true);
  function createSetter(shallow = false) {
      return function set(target, key, value, receiver) {
          const oldValue = target[key];
          if (!shallow) {
              value = toRaw(value);
              if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
                  oldValue.value = value;
                  return true;
              }
          }
          const hadKey = isArray(target) && isIntegerKey(key)
              ? Number(key) < target.length
              : hasOwn(target, key);
          const result = Reflect.set(target, key, value, receiver);
          // don't trigger if target is something up in the prototype chain of original
          if (target === toRaw(receiver)) {
              if (!hadKey) {
                  trigger(target, "add" /* ADD */, key, value);
              }
              else if (hasChanged(value, oldValue)) {
                  trigger(target, "set" /* SET */, key, value);
              }
          }
          return result;
      };
  }
  function deleteProperty(target, key) {
      const hadKey = hasOwn(target, key);
      const oldValue = target[key];
      const result = Reflect.deleteProperty(target, key);
      if (result && hadKey) {
          trigger(target, "delete" /* DELETE */, key, undefined);
      }
      return result;
  }
  function has(target, key) {
      const result = Reflect.has(target, key);
      if (!isSymbol(key) || !builtInSymbols.has(key)) {
          track(target, "has" /* HAS */, key);
      }
      return result;
  }
  function ownKeys$1(target) {
      track(target, "iterate" /* ITERATE */, isArray(target) ? 'length' : ITERATE_KEY);
      return Reflect.ownKeys(target);
  }
  const mutableHandlers = {
      get,
      set,
      deleteProperty,
      has,
      ownKeys: ownKeys$1
  };
  const readonlyHandlers = {
      get: readonlyGet,
      set(target, key) {
          return true;
      },
      deleteProperty(target, key) {
          return true;
      }
  };
  const shallowReactiveHandlers = extend({}, mutableHandlers, {
      get: shallowGet,
      set: shallowSet
  });
  // Props handlers are special in the sense that it should not unwrap top-level
  // refs (in order to allow refs to be explicitly passed down), but should
  // retain the reactivity of the normal readonly object.
  const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
      get: shallowReadonlyGet
  });

  const toReactive = (value) => isObject(value) ? reactive(value) : value;
  const toReadonly = (value) => isObject(value) ? readonly(value) : value;
  const toShallow = (value) => value;
  const getProto = (v) => Reflect.getPrototypeOf(v);
  function get$1(target, key, isReadonly = false, isShallow = false) {
      // #1772: readonly(reactive(Map)) should return readonly + reactive version
      // of the value
      target = target["__v_raw" /* RAW */];
      const rawTarget = toRaw(target);
      const rawKey = toRaw(key);
      if (key !== rawKey) {
          !isReadonly && track(rawTarget, "get" /* GET */, key);
      }
      !isReadonly && track(rawTarget, "get" /* GET */, rawKey);
      const { has } = getProto(rawTarget);
      const wrap = isReadonly ? toReadonly : isShallow ? toShallow : toReactive;
      if (has.call(rawTarget, key)) {
          return wrap(target.get(key));
      }
      else if (has.call(rawTarget, rawKey)) {
          return wrap(target.get(rawKey));
      }
  }
  function has$1(key, isReadonly = false) {
      const target = this["__v_raw" /* RAW */];
      const rawTarget = toRaw(target);
      const rawKey = toRaw(key);
      if (key !== rawKey) {
          !isReadonly && track(rawTarget, "has" /* HAS */, key);
      }
      !isReadonly && track(rawTarget, "has" /* HAS */, rawKey);
      return key === rawKey
          ? target.has(key)
          : target.has(key) || target.has(rawKey);
  }
  function size(target, isReadonly = false) {
      target = target["__v_raw" /* RAW */];
      !isReadonly && track(toRaw(target), "iterate" /* ITERATE */, ITERATE_KEY);
      return Reflect.get(target, 'size', target);
  }
  function add(value) {
      value = toRaw(value);
      const target = toRaw(this);
      const proto = getProto(target);
      const hadKey = proto.has.call(target, value);
      const result = target.add(value);
      if (!hadKey) {
          trigger(target, "add" /* ADD */, value, value);
      }
      return result;
  }
  function set$1(key, value) {
      value = toRaw(value);
      const target = toRaw(this);
      const { has, get } = getProto(target);
      let hadKey = has.call(target, key);
      if (!hadKey) {
          key = toRaw(key);
          hadKey = has.call(target, key);
      }
      const oldValue = get.call(target, key);
      const result = target.set(key, value);
      if (!hadKey) {
          trigger(target, "add" /* ADD */, key, value);
      }
      else if (hasChanged(value, oldValue)) {
          trigger(target, "set" /* SET */, key, value);
      }
      return result;
  }
  function deleteEntry(key) {
      const target = toRaw(this);
      const { has, get } = getProto(target);
      let hadKey = has.call(target, key);
      if (!hadKey) {
          key = toRaw(key);
          hadKey = has.call(target, key);
      }
      const oldValue = get ? get.call(target, key) : undefined;
      // forward the operation before queueing reactions
      const result = target.delete(key);
      if (hadKey) {
          trigger(target, "delete" /* DELETE */, key, undefined);
      }
      return result;
  }
  function clear() {
      const target = toRaw(this);
      const hadItems = target.size !== 0;
      // forward the operation before queueing reactions
      const result = target.clear();
      if (hadItems) {
          trigger(target, "clear" /* CLEAR */, undefined, undefined);
      }
      return result;
  }
  function createForEach(isReadonly, isShallow) {
      return function forEach(callback, thisArg) {
          const observed = this;
          const target = observed["__v_raw" /* RAW */];
          const rawTarget = toRaw(target);
          const wrap = isReadonly ? toReadonly : isShallow ? toShallow : toReactive;
          !isReadonly && track(rawTarget, "iterate" /* ITERATE */, ITERATE_KEY);
          return target.forEach((value, key) => {
              // important: make sure the callback is
              // 1. invoked with the reactive map as `this` and 3rd arg
              // 2. the value received should be a corresponding reactive/readonly.
              return callback.call(thisArg, wrap(value), wrap(key), observed);
          });
      };
  }
  function createIterableMethod(method, isReadonly, isShallow) {
      return function (...args) {
          const target = this["__v_raw" /* RAW */];
          const rawTarget = toRaw(target);
          const targetIsMap = isMap(rawTarget);
          const isPair = method === 'entries' || (method === Symbol.iterator && targetIsMap);
          const isKeyOnly = method === 'keys' && targetIsMap;
          const innerIterator = target[method](...args);
          const wrap = isReadonly ? toReadonly : isShallow ? toShallow : toReactive;
          !isReadonly &&
              track(rawTarget, "iterate" /* ITERATE */, isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY);
          // return a wrapped iterator which returns observed versions of the
          // values emitted from the real iterator
          return {
              // iterator protocol
              next() {
                  const { value, done } = innerIterator.next();
                  return done
                      ? { value, done }
                      : {
                          value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
                          done
                      };
              },
              // iterable protocol
              [Symbol.iterator]() {
                  return this;
              }
          };
      };
  }
  function createReadonlyMethod(type) {
      return function (...args) {
          return type === "delete" /* DELETE */ ? false : this;
      };
  }
  const mutableInstrumentations = {
      get(key) {
          return get$1(this, key);
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
  const shallowInstrumentations = {
      get(key) {
          return get$1(this, key, false, true);
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
  const readonlyInstrumentations = {
      get(key) {
          return get$1(this, key, true);
      },
      get size() {
          return size(this, true);
      },
      has(key) {
          return has$1.call(this, key, true);
      },
      add: createReadonlyMethod("add" /* ADD */),
      set: createReadonlyMethod("set" /* SET */),
      delete: createReadonlyMethod("delete" /* DELETE */),
      clear: createReadonlyMethod("clear" /* CLEAR */),
      forEach: createForEach(true, false)
  };
  const iteratorMethods = ['keys', 'values', 'entries', Symbol.iterator];
  iteratorMethods.forEach(method => {
      mutableInstrumentations[method] = createIterableMethod(method, false, false);
      readonlyInstrumentations[method] = createIterableMethod(method, true, false);
      shallowInstrumentations[method] = createIterableMethod(method, false, true);
  });
  function createInstrumentationGetter(isReadonly, shallow) {
      const instrumentations = shallow
          ? shallowInstrumentations
          : isReadonly
              ? readonlyInstrumentations
              : mutableInstrumentations;
      return (target, key, receiver) => {
          if (key === "__v_isReactive" /* IS_REACTIVE */) {
              return !isReadonly;
          }
          else if (key === "__v_isReadonly" /* IS_READONLY */) {
              return isReadonly;
          }
          else if (key === "__v_raw" /* RAW */) {
              return target;
          }
          return Reflect.get(hasOwn(instrumentations, key) && key in target
              ? instrumentations
              : target, key, receiver);
      };
  }
  const mutableCollectionHandlers = {
      get: createInstrumentationGetter(false, false)
  };
  const readonlyCollectionHandlers = {
      get: createInstrumentationGetter(true, false)
  };

  const reactiveMap = new WeakMap();
  const readonlyMap = new WeakMap();
  function targetTypeMap(rawType) {
      switch (rawType) {
          case 'Object':
          case 'Array':
              return 1 /* COMMON */;
          case 'Map':
          case 'Set':
          case 'WeakMap':
          case 'WeakSet':
              return 2 /* COLLECTION */;
          default:
              return 0 /* INVALID */;
      }
  }
  function getTargetType(value) {
      return value["__v_skip" /* SKIP */] || !Object.isExtensible(value)
          ? 0 /* INVALID */
          : targetTypeMap(toRawType(value));
  }
  function reactive(target) {
      // if trying to observe a readonly proxy, return the readonly version.
      if (target && target["__v_isReadonly" /* IS_READONLY */]) {
          return target;
      }
      return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers);
  }
  function readonly(target) {
      return createReactiveObject(target, true, readonlyHandlers, readonlyCollectionHandlers);
  }
  function createReactiveObject(target, isReadonly, baseHandlers, collectionHandlers) {
      if (!isObject(target)) {
          return target;
      }
      // target is already a Proxy, return it.
      // exception: calling readonly() on a reactive object
      if (target["__v_raw" /* RAW */] &&
          !(isReadonly && target["__v_isReactive" /* IS_REACTIVE */])) {
          return target;
      }
      // target already has corresponding Proxy
      const proxyMap = isReadonly ? readonlyMap : reactiveMap;
      const existingProxy = proxyMap.get(target);
      if (existingProxy) {
          return existingProxy;
      }
      // only a whitelist of value types can be observed.
      const targetType = getTargetType(target);
      if (targetType === 0 /* INVALID */) {
          return target;
      }
      const proxy = new Proxy(target, targetType === 2 /* COLLECTION */ ? collectionHandlers : baseHandlers);
      proxyMap.set(target, proxy);
      return proxy;
  }
  function toRaw(observed) {
      return ((observed && toRaw(observed["__v_raw" /* RAW */])) || observed);
  }
  function isRef(r) {
      return Boolean(r && r.__v_isRef === true);
  }

  window.reactive = reactive;
  window.effect = effect;
  let Alpine = {
    observe: reactive,

    get effect() {
      return callback => {
        effect(() => {
          callback();
        }, {
          scheduler(run) {
            scheduler.task(run);
          }

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

    clonedComponentAccessor() {
      let components = {};
      Object.entries(this.components).forEach(([name, componentObject]) => {
        Object.defineProperty(components, name, {
          get() {
            return _objectSpread2({}, componentObject);
          },

          enumerable: true
        });
      });
      return components;
    },

    start() {
      document.dispatchEvent(new CustomEvent('alpine:initializing'), {
        bubbles: true
      });
      this.listenForNewDomElementsToInitialize();

      let outNestedComponents = el => !(el.parentElement || {
        _x_root() {}

      })._x_root();

      Array.from(document.querySelectorAll('[x-data]')).filter(outNestedComponents).forEach(el => this.initTree(el));
      document.dispatchEvent(new CustomEvent('alpine:initialized'), {
        bubbles: true
      });
    },

    initTree(root) {
      this.walk(root, el => this.init(el));
      scheduler.flush();
    },

    init(el, attributes) {
      (attributes || el._x_attributes()).forEach(attr => {
        let noop = () => {};

        let run = Alpine.directives[attr.type] || noop; // Run "x-ref/data/spread" on the initial sweep.

        let task = run.runImmediately ? callback => callback() : scheduler.task.bind(scheduler);
        task(() => {
          run(el, attr.value, attr.modifiers, attr.expression, Alpine.effect);
        });
      });
    },

    listenForNewDomElementsToInitialize() {
      let observer = new MutationObserver(mutations => {
        for (let mutation of mutations) {
          if (mutation.type !== 'childList') continue;

          for (let node of mutation.addedNodes) {
            if (node.nodeType !== 1) continue;
            this.initTree(node);
          }
        }
      });
      observer.observe(document.querySelector('body'), {
        subtree: true,
        childList: true,
        deep: false
      });
    },

    walk(el, callback) {
      callback(el);
      let node = el.firstElementChild;

      while (node) {
        this.walk(node, callback, false);
        node = node.nextElementSibling;
      }
    }

  };

  window.Element.prototype._x_attributes = function (attributes) {
    let directives = Array.from(attributes || this.attributes).filter(isXAttr).map(parseHtmlAttribute);
    return sortDirectives(directives);
  };

  window.Element.prototype._x_attributesByType = function (type) {
    return this._x_attributes().filter(attribute => attribute.type === type);
  };

  window.Element.prototype._x_attributeByType = function (type) {
    return this._x_attributesByType()[0];
  };

  let xAttrRE = /^x-([^:^.]+)\b/;

  function isXAttr(attr) {
    const name = replaceAtAndColonWithStandardSyntax(attr.name);
    return xAttrRE.test(name);
  }

  function sortDirectives(directives) {
    let directiveOrder = ['data', 'spread', 'ref', 'init', 'bind', 'for', 'model', 'transition', 'show', 'catch-all'];
    return directives.sort((a, b) => {
      let typeA = directiveOrder.indexOf(a.type) === -1 ? 'catch-all' : a.type;
      let typeB = directiveOrder.indexOf(b.type) === -1 ? 'catch-all' : b.type;
      return directiveOrder.indexOf(typeA) - directiveOrder.indexOf(typeB);
    });
  }

  function parseHtmlAttribute({
    name,
    value
  }) {
    const normalizedName = replaceAtAndColonWithStandardSyntax(name);
    const typeMatch = normalizedName.match(xAttrRE);
    const valueMatch = normalizedName.match(/:([a-zA-Z0-9\-:]+)/);
    const modifiers = normalizedName.match(/\.[^.\]]+(?=[^\]]*$)/g) || [];
    return {
      type: typeMatch ? typeMatch[1] : null,
      value: valueMatch ? valueMatch[1] : null,
      modifiers: modifiers.map(i => i.replace('.', '')),
      expression: value
    };
  }

  function replaceAtAndColonWithStandardSyntax(name) {
    if (name.startsWith('@')) {
      return name.replace('@', 'x-on:');
    } else if (name.startsWith(':')) {
      return name.replace(':', 'x-bind:');
    }

    return name;
  }

  window.Element.prototype._x_intersect = function ({
    enter = () => {},
    leave = () => {}
  } = {}) {
    let observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.intersectionRatio > 0) {
          enter();
        } else {
          leave();
        }
      });
    });
    observer.observe(this);
    return observer;
  };

  window.Element.prototype._x_evaluator = function (expression, extras = {}, returns = true) {
    let farExtras = {};

    let dataStack = this._x_closestDataStack();

    let closeExtras = extras;
    Alpine.injectMagics(closeExtras, this);
    let reversedDataStack = [farExtras].concat(Array.from(dataStack).concat([closeExtras])).reverse();

    if (typeof expression === 'function') {
      let mergedObject = mergeProxies(...reversedDataStack);
      return expression.bind(mergedObject);
    }

    let names = reversedDataStack.map((data, index) => `$data${index}`);
    let namesWithPlaceholder = ['$dataPlaceholder'].concat(names);
    let assignmentPrefix = returns ? '_x_result = ' : '';
    let withExpression = namesWithPlaceholder.reduce((carry, current) => {
      return `with (${current}) { ${carry} }`;
    }, `${assignmentPrefix}${expression}`);
    let namesWithPlaceholderAndDefault = names.concat(['$dataPlaceholder = {}']);

    let evaluator = () => {};

    evaluator = tryCatch(this, () => {
      return new Function(namesWithPlaceholderAndDefault, `var _x_result; ${withExpression}; return _x_result;`);
    });
    let boundEvaluator = evaluator.bind(null, ...reversedDataStack);
    return tryCatch.bind(null, this, boundEvaluator);
  };

  window.Element.prototype._x_evaluate = function (expression, extras = {}, returns = true) {
    return this._x_evaluator(expression, extras, returns)();
  };

  window.Element.prototype._x_closestDataStack = function () {
    if (this._x_dataStack) return this._x_dataStack;
    if (!this.parentElement) return new Set();
    return this.parentElement._x_closestDataStack();
  };

  window.Element.prototype._x_closestDataProxy = function () {
    return mergeProxies(...this._x_closestDataStack());
  };

  function tryCatch(el, callback, ...args) {
    try {
      return callback(...args);
    } catch (e) {
      console.warn('Alpine Expression Error: ' + e.message, el);
      throw e;
    }
  }

  function mergeProxies(...objects) {
    return new Proxy({}, {
      get: (target, name) => {
        return (objects.find(object => Object.keys(object).includes(name)) || {})[name];
      },
      set: (target, name, value) => {
        (objects.find(object => Object.keys(object).includes(name)) || {})[name] = value;
        return true;
      }
    });
  }

  window.Element.prototype._x_dispatch = function (event, detail = {}) {
    this.dispatchEvent(new CustomEvent(event, {
      detail,
      bubbles: true
    }));
  };

  window.Element.prototype._x_classes = function (classString) {
    let isInvalidType = subject => typeof subject === 'object' && !subject instanceof String || Array.isArray(subject);

    if (isInvalidType(classString)) console.warn('Alpine: class bindings must return a string or a stringable type. Arrays and Objects are no longer supported.'); // This is to allow short ifs like: :class="show || 'hidden'"

    if (classString === true) classString = '';

    let missingClasses = classString => classString.split(' ').filter(i => !this.classList.contains(i)).filter(Boolean);

    let addClassesAndReturnUndo = classes => {
      this.classList.add(...classes);
      return () => {
        this.classList.remove(...classes);
      };
    };

    return addClassesAndReturnUndo(missingClasses(classString || ''));
  };

  window.Element.prototype._x_hasFocus = function () {
    return this === document.activeElement;
  };

  window.Element.prototype._x_root = function () {
    if (this.hasAttribute('x-data')) return this;
    if (!this.parentElement) return;
    return this.parentElement._x_root();
  };

  window.Element.prototype._x_bind = function (name, value, modifiers = []) {
    name = modifiers.includes('camel') ? camelCase(name) : name;

    switch (name) {
      case 'value':
        bindInputValue(this, value);
        break;

      case 'class':
        bindClasses(this, value);
        break;

      default:
        bindAttribute(this, name, value);
        break;
    }
  };

  function bindInputValue(el, value) {
    if (el.type === 'radio') {
      // Set radio value from x-bind:value, if no "value" attribute exists.
      // If there are any initial state values, radio will have a correct
      // "checked" value since x-bind:value is processed before x-model.
      if (el.attributes.value === undefined) {
        el.value = value;
      } // @todo: removed this because getting "attrType" is tough.
      // We'll see what breaks


      if (window.fromModel) {
        el.checked = checkedAttrLooseCompare(el.value, value);
      }
    } else if (el.type === 'checkbox') {
      // If we are explicitly binding a string to the :value, set the string,
      // If the value is a boolean, leave it alone, it will be set to "on"
      // automatically.
      if (typeof value !== 'boolean' && ![null, undefined].includes(value)) {
        el.value = String(value);
      } else {
        if (Array.isArray(value)) {
          el.checked = value.some(val => checkedAttrLooseCompare(val, el.value));
        } else {
          el.checked = !!value;
        }
      }
    } else if (el.tagName === 'SELECT') {
      updateSelect(el, value);
    } else {
      if (el.value === value) return;
      el.value = value;
    }
  }

  function bindClasses(el, value) {
    if (el._x_undoAddedClasses) el._x_undoAddedClasses();
    el._x_undoAddedClasses = el._x_classes(value);
  }

  function bindAttribute(el, name, value) {
    // If an attribute's bound value is null, undefined or false, remove the attribute
    if ([null, undefined, false].includes(value)) {
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
    const arrayWrappedValue = [].concat(value).map(value => {
      return value + '';
    });
    Array.from(el.options).forEach(option => {
      option.selected = arrayWrappedValue.includes(option.value || option.text);
    });
  }

  function camelCase(subject) {
    return subject.toLowerCase().replace(/-(\w)/g, (match, char) => char.toUpperCase());
  }

  function checkedAttrLooseCompare(valueA, valueB) {
    return valueA == valueB;
  }

  function isBooleanAttr(attrName) {
    // As per HTML spec table https://html.spec.whatwg.org/multipage/indices.html#attributes-3:boolean-attribute
    // Array roughly ordered by estimated usage
    const booleanAttributes = ['disabled', 'checked', 'required', 'readonly', 'hidden', 'open', 'selected', 'autofocus', 'itemscope', 'multiple', 'novalidate', 'allowfullscreen', 'allowpaymentrequest', 'formnovalidate', 'autoplay', 'controls', 'loop', 'muted', 'playsinline', 'default', 'ismap', 'reversed', 'async', 'defer', 'nomodule'];
    return booleanAttributes.includes(attrName);
  }

  window.Element.prototype._x_on = function (el, event, modifiers, callback) {
    let options = {
      passive: modifiers.includes('passive')
    };
    if (modifiers.includes('camel')) event = camelCase$1(event);

    if (modifiers.includes('away')) {
      addAwayListener(el, event, modifiers, callback, options);
    } else {
      let listenerTarget = modifiers.includes('window') ? window : modifiers.includes('document') ? document : el;

      let handler = e => {
        // Remove this global event handler if the element that declared it
        // has been removed. It's now stale.
        if (listenerTarget === window || listenerTarget === document) {
          if (!document.body.contains(el)) {
            listenerTarget.removeEventListener(event, handler, options);
            return;
          }
        }

        if (isKeyEvent(event)) {
          if (isListeningForASpecificKeyThatHasntBeenPressed(e, modifiers)) {
            return;
          }
        }

        if (modifiers.includes('prevent')) e.preventDefault();
        if (modifiers.includes('stop')) e.stopPropagation();
        if (modifiers.includes('self') && e.target !== el) return;
        callback(e);

        if (modifiers.includes('once')) {
          listenerTarget.removeEventListener(event, handler, options);
        }
      };

      if (modifiers.includes('debounce')) {
        let nextModifier = modifiers[modifiers.indexOf('debounce') + 1] || 'invalid-wait';
        let wait = isNumeric(nextModifier.split('ms')[0]) ? Number(nextModifier.split('ms')[0]) : 250;
        handler = debounce(handler, wait);
      }

      if (modifiers.includes('throttle')) {
        let nextModifier = modifiers[modifiers.indexOf('throttle') + 1] || 'invalid-wait';
        let wait = isNumeric(nextModifier.split('ms')[0]) ? Number(nextModifier.split('ms')[0]) : 250;
        handler = throttle(handler, wait);
      }

      listenerTarget.addEventListener(event, handler, options);
    }
  };

  function camelCase$1(subject) {
    return subject.toLowerCase().replace(/-(\w)/g, (match, char) => char.toUpperCase());
  }

  function addAwayListener(el, event, modifiers, callback, options) {
    let handler = e => {
      // Don't do anything if the click came from the element or within it.
      if (el.contains(e.target)) return; // Don't do anything if this element isn't currently visible.

      if (el.offsetWidth < 1 && el.offsetHeight < 1) return; // Now that we are sure the element is visible, AND the click
      // is from outside it, let's run the expression.

      callback(e);

      if (modifiers.includes('once')) {
        document.removeEventListener(event, handler, options);
      }
    }; // Listen for this event at the root level.


    document.addEventListener(event, handler, options);
  }

  function debounce(func, wait) {
    var timeout;
    return function () {
      var context = this,
          args = arguments;

      var later = function later() {
        timeout = null;
        func.apply(context, args);
      };

      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function throttle(func, limit) {
    let inThrottle;
    return function () {
      let context = this,
          args = arguments;

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
    return subject.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[_\s]/, '-').toLowerCase();
  }

  function isKeyEvent(event) {
    return ['keydown', 'keyup'].includes(event);
  }

  function isListeningForASpecificKeyThatHasntBeenPressed(e, modifiers) {
    let keyModifiers = modifiers.filter(i => {
      return !['window', 'document', 'prevent', 'stop'].includes(i);
    });

    if (keyModifiers.includes('debounce')) {
      let debounceIndex = keyModifiers.indexOf('debounce');
      keyModifiers.splice(debounceIndex, isNumeric((keyModifiers[debounceIndex + 1] || 'invalid-wait').split('ms')[0]) ? 2 : 1);
    } // If no modifier is specified, we'll call it a press.


    if (keyModifiers.length === 0) return false; // If one is passed, AND it matches the key pressed, we'll call it a press.

    if (keyModifiers.length === 1 && keyModifiers[0] === keyToModifier(e.key)) return false; // The user is listening for key combinations.

    const systemKeyModifiers = ['ctrl', 'shift', 'alt', 'meta', 'cmd', 'super'];
    const selectedSystemKeyModifiers = systemKeyModifiers.filter(modifier => keyModifiers.includes(modifier));
    keyModifiers = keyModifiers.filter(i => !selectedSystemKeyModifiers.includes(i));

    if (selectedSystemKeyModifiers.length > 0) {
      const activelyPressedKeyModifiers = selectedSystemKeyModifiers.filter(modifier => {
        // Alias "cmd" and "super" to "meta"
        if (modifier === 'cmd' || modifier === 'super') modifier = 'meta';
        return e[`${modifier}Key`];
      }); // If all the modifiers selected are pressed, ...

      if (activelyPressedKeyModifiers.length === selectedSystemKeyModifiers.length) {
        // AND the remaining key is pressed as well. It's a press.
        if (keyModifiers[0] === keyToModifier(e.key)) return false;
      }
    } // We'll call it NOT a valid keypress.


    return true;
  }

  function keyToModifier(key) {
    switch (key) {
      case '/':
        return 'slash';

      case ' ':
      case 'Spacebar':
        return 'space';

      default:
        return key && kebabCase(key);
    }
  }

  Alpine.directive('transition', (el, value, modifiers, expression, effect) => {
    if (!el._x_transition) {
      el._x_transition = {
        enter: {
          during: '',
          start: '',
          end: ''
        },
        leave: {
          during: '',
          start: '',
          end: ''
        },

        in(before = () => {}, after = () => {}) {
          return transitionClasses(el, {
            during: this.enter.during,
            start: this.enter.start,
            end: this.enter.end
          }, before, after);
        },

        out(before = () => {}, after = () => {}) {
          return transitionClasses(el, {
            during: this.leave.during,
            start: this.leave.start,
            end: this.leave.end
          }, before, after);
        }

      };
    }

    let directiveStorageMap = {
      'enter': classes => {
        el._x_transition.enter.during = classes;
      },
      'enter-start': classes => {
        el._x_transition.enter.start = classes;
      },
      'enter-end': classes => {
        el._x_transition.enter.end = classes;
      },
      'leave': classes => {
        el._x_transition.leave.during = classes;
      },
      'leave-start': classes => {
        el._x_transition.leave.start = classes;
      },
      'leave-end': classes => {
        el._x_transition.leave.end = classes;
      }
    };
    directiveStorageMap[value](expression);
  });
  function transitionClasses(el, {
    during = '',
    start = '',
    end = ''
  } = {}, before = () => {}, after = () => {}) {
    if (el._x_transitioning) el._x_transitioning.cancel();
    let undoStart, undoDuring, undoEnd;
    performTransition(el, {
      start() {
        undoStart = el._x_classes(start);
      },

      during() {
        undoDuring = el._x_classes(during);
      },

      before,

      end() {
        undoStart();
        undoEnd = el._x_classes(end);
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
      stages.after(); // Adding an "isConnected" check, in case the callback removed the element from the DOM.

      if (el.isConnected) stages.cleanup();
      delete el._x_transitioning;
    });
    el._x_transitioning = {
      beforeCancels: [],

      beforeCancel(callback) {
        this.beforeCancels.push(callback);
      },

      cancel: once(function () {
        while (this.beforeCancels.length) {
          this.beforeCancels.shift()();
        }
        finish();
      }),
      finish
    };
    stages.start();
    stages.during();
    scheduler.holdNextTicks();
    requestAnimationFrame(() => {
      // Note: Safari's transitionDuration property will list out comma separated transition durations
      // for every single transition property. Let's grab the first one and call it a day.
      let duration = Number(getComputedStyle(el).transitionDuration.replace(/,.*/, '').replace('s', '')) * 1000;

      if (duration === 0) {
        duration = Number(getComputedStyle(el).animationDuration.replace('s', '')) * 1000;
      }

      stages.before();
      requestAnimationFrame(() => {
        stages.end();
        scheduler.releaseNextTicks();
        setTimeout(el._x_transitioning.finish, duration);
      });
    });
  }
  function once(callback) {
    let called = false;
    return function () {
      if (!called) {
        called = true;
        callback.apply(this, arguments);
      }
    };
  }

  Alpine.directive('intersect', (el, value, modifiers, expression, effect) => {
    let evaluate = el._x_evaluator(expression, {}, false);

    if (value === 'leave') {
      el._x_intersect({
        leave: evaluate
      });
    } else {
      el._x_intersect({
        enter: evaluate
      });
    }
  });

  Alpine.directive('spread', (el, value, modifiers, expression, effect) => {
    let spreadObject = el._x_evaluate(expression);

    let rawAttributes = Object.entries(spreadObject).map(([name, value]) => ({
      name,
      value
    }));

    let attributes = el._x_attributes(rawAttributes);

    Alpine.init(el, attributes);
  });

  Alpine.directive('model', (el, value, modifiers, expression, effect) => {
    let evaluate = el._x_evaluator(expression);

    let assignmentExpression = `${expression} = rightSideOfExpression($event, ${expression})`;

    let evaluateAssignment = el._x_evaluator(assignmentExpression); // If the element we are binding to is a select, a radio, or checkbox
    // we'll listen for the change event instead of the "input" event.


    var event = el.tagName.toLowerCase() === 'select' || ['checkbox', 'radio'].includes(el.type) || modifiers.includes('lazy') ? 'change' : 'input';
    let assigmentFunction = generateAssignmentFunction(el, modifiers, expression);

    el._x_on(el, event, modifiers, e => {
      evaluateAssignment({
        '$event': e,
        rightSideOfExpression: assigmentFunction
      });
    });

    effect(() => {
      let value = evaluate(); // If nested model key is undefined, set the default value to empty string.

      if (value === undefined && expression.match(/\./)) value = ''; // @todo: This is nasty

      window.fromModel = true;

      el._x_bind('value', value);

      delete window.fromModel;
    });
  });

  function generateAssignmentFunction(el, modifiers, expression) {
    if (el.type === 'radio') {
      // Radio buttons only work properly when they share a name attribute.
      // People might assume we take care of that for them, because
      // they already set a shared "x-model" attribute.
      if (!el.hasAttribute('name')) el.setAttribute('name', expression);
    }

    return (event, currentValue) => {
      // Check for event.detail due to an issue where IE11 handles other events as a CustomEvent.
      if (event instanceof CustomEvent && event.detail) {
        return event.detail;
      } else if (el.type === 'checkbox') {
        // If the data we are binding to is an array, toggle its value inside the array.
        if (Array.isArray(currentValue)) {
          let newValue = modifiers.includes('number') ? safeParseNumber(event.target.value) : event.target.value;
          return event.target.checked ? currentValue.concat([newValue]) : currentValue.filter(el => !checkedAttrLooseCompare$1(el, newValue));
        } else {
          return event.target.checked;
        }
      } else if (el.tagName.toLowerCase() === 'select' && el.multiple) {
        return modifiers.includes('number') ? Array.from(event.target.selectedOptions).map(option => {
          let rawValue = option.value || option.text;
          return safeParseNumber(rawValue);
        }) : Array.from(event.target.selectedOptions).map(option => {
          return option.value || option.text;
        });
      } else {
        let rawValue = event.target.value;
        return modifiers.includes('number') ? safeParseNumber(rawValue) : modifiers.includes('trim') ? rawValue.trim() : rawValue;
      }
    };
  }

  function safeParseNumber(rawValue) {
    let number = rawValue ? parseFloat(rawValue) : null;
    return isNumeric$1(number) ? number : rawValue;
  }

  function checkedAttrLooseCompare$1(valueA, valueB) {
    return valueA == valueB;
  }

  function isNumeric$1(subject) {
    return !Array.isArray(subject) && !isNaN(subject);
  }

  Alpine.directive('cloak', el => {
    el.removeAttribute('x-cloak');
  });

  Alpine.directive('init', (el, value, modifiers, expression, effect) => {
    el._x_evaluate(expression, {}, false);
  });

  Alpine.directive('text', (el, value, modifiers, expression, effect) => {
    let evaluate = el._x_evaluator(expression);

    effect(() => {
      el.textContent = evaluate();
    });
  });

  Alpine.directive('bind', (el, value, modifiers, expression, effect) => {
    let attrName = value;

    let evaluate = el._x_evaluator(expression); // Ignore :key bindings. (They are used by x-for)


    if (value === 'key') return;
    effect(() => {
      let value = evaluate();

      el._x_bind(attrName, value, modifiers);
    });
  });

  Alpine.directive('data', (el, value, modifiers, expression, effect) => {
    // Skip if already initialized
    // @todo: I forgot why I added this, but it breaks nested x-data inside an x-for, so I'm commenting it out for now.
    // if (el._x_dataStack) return
    expression = expression === '' ? '{}' : expression;
    let components = Alpine.clonedComponentAccessor();
    let data;

    if (Object.keys(components).includes(expression)) {
      data = components[expression];
    } else {
      data = el._x_evaluate(expression);
    }

    Alpine.injectMagics(data, el);
    el._x_data = data;
    el._x_$data = Alpine.observe(el._x_data);
    el._x_dataStack = new Set(el._x_closestDataStack());

    el._x_dataStack.add(el._x_$data);
  });

  Alpine.directive('show', (el, value, modifiers, expression, effect) => {
    let evaluate = el._x_evaluator(expression);

    let hide = () => {
      el.style.display = 'none';
    };

    let show = () => {
      if (el.style.length === 1 && el.style.display === 'none') {
        el.removeAttribute('style');
      } else {
        el.style.removeProperty('display');
      }
    };

    let isFirstRun = true;
    effect(() => {
      let value = evaluate();
      isFirstRun ? toggleImmediately(el, value, show, hide) : toggleWithTransitions(el, value, show, hide);
      isFirstRun = false;
    });
  });

  function toggleImmediately(el, value, show, hide) {
    value ? show() : hide();
  }

  function toggleWithTransitions(el, value, show, hide) {
    if (value) {
      el._x_transition ? el._x_transition.in(show) : show();
    } else {
      el._x_do_hide = el._x_transition ? (resolve, reject) => {
        el._x_transition.out(() => {}, () => resolve(hide));

        el._x_transitioning.beforeCancel(() => reject({
          isFromCancelledTransition: true
        }));
      } : resolve => resolve(hide);
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
                return promise.then(doHide => doHide());
              });
            }, Promise.resolve(() => {})).catch(e => {
              if (!e.isFromCancelledTransition) throw e;
            });
          });
        }
      });
    }
  }

  function closestHide(el) {
    let parent = el.parentElement;
    if (!parent) return;
    return parent._x_do_hide ? parent : closestHide(parent);
  }

  Alpine.directive('for', (el, value, modifiers, expression, effect) => {
    var _el$_x_attributesByTy;

    let iteratorNames = parseForExpression(expression);

    let evaluateItems = el._x_evaluator(iteratorNames.items);

    let evaluateKey = el._x_evaluator( // Look for a :key="..." expression
    ((_el$_x_attributesByTy = el._x_attributesByType('bind').filter(attribute => attribute.value === 'key')[0]) === null || _el$_x_attributesByTy === void 0 ? void 0 : _el$_x_attributesByTy.expression // Otherwise, use "index"
    ) || 'index');

    effect(() => {
      loop(el, iteratorNames, evaluateItems, evaluateKey);
    });
  });

  function loop(el, iteratorNames, evaluateItems, evaluateKey) {
    let templateEl = el;
    let items = evaluateItems(); // This adds support for the `i in n` syntax.

    if (isNumeric$2(items) && items > 0) {
      items = Array.from(Array(items).keys(), i => i + 1);
    }

    let closestParentContext = el._x_closestDataStack(); // As we walk the array, we'll also walk the DOM (updating/creating as we go).


    let currentEl = templateEl;
    items.forEach((item, index) => {
      let iterationScopeVariables = getIterationScopeVariables(iteratorNames, item, index, items);
      let currentKey = evaluateKey(_objectSpread2({
        index
      }, iterationScopeVariables));
      let nextEl = lookAheadForMatchingKeyedElementAndMoveItIfFound(currentEl.nextElementSibling, currentKey); // If we haven't found a matching key, insert the element at the current position.

      if (!nextEl) {
        nextEl = addElementInLoopAfterCurrentEl(templateEl, currentEl);
        let newSet = new Set(closestParentContext);
        newSet.add(Alpine.observe(iterationScopeVariables));
        nextEl._x_dataStack = newSet;
        nextEl._x_for = iterationScopeVariables; // Alpine.initTree(nextEl)
      }

      {
        // Refresh data
        Object.entries(iterationScopeVariables).forEach(([key, value]) => {
          Array.from(nextEl._x_dataStack).slice(-1)[0][key] = value;
        });
      }
      currentEl = nextEl;
      currentEl._x_for_key = currentKey;
    });
    removeAnyLeftOverElementsFromPreviousUpdate(currentEl);
  } // This was taken from VueJS 2.* core. Thanks Vue!


  function parseForExpression(expression) {
    let forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
    let stripParensRE = /^\(|\)$/g;
    let forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
    let inMatch = expression.match(forAliasRE);
    if (!inMatch) return;
    let res = {};
    res.items = inMatch[2].trim();
    let item = inMatch[1].trim().replace(stripParensRE, '');
    let iteratorMatch = item.match(forIteratorRE);

    if (iteratorMatch) {
      res.item = item.replace(forIteratorRE, '').trim();
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
    // We must create a new object, so each iteration has a new scope
    let scopeVariables = {};
    scopeVariables[iteratorNames.item] = item;
    if (iteratorNames.index) scopeVariables[iteratorNames.index] = index;
    if (iteratorNames.collection) scopeVariables[iteratorNames.collection] = items;
    return scopeVariables;
  }

  function addElementInLoopAfterCurrentEl(templateEl, currentEl) {
    let clone = document.importNode(templateEl.content, true);
    currentEl.parentElement.insertBefore(clone, currentEl.nextElementSibling);
    let inserted = currentEl.nextElementSibling;
    return inserted;
  }

  function lookAheadForMatchingKeyedElementAndMoveItIfFound(nextEl, currentKey) {
    if (!nextEl) return; // If the the key's DO match, no need to look ahead.

    if (nextEl._x_for_key === currentKey) return nextEl; // If they don't, we'll look ahead for a match.
    // If we find it, we'll move it to the current position in the loop.

    let tmpNextEl = nextEl;

    while (tmpNextEl) {
      if (!tmpNextEl._x_for_key) return;

      if (tmpNextEl._x_for_key === currentKey) {
        return tmpNextEl.parentElement.insertBefore(tmpNextEl, nextEl);
      }

      tmpNextEl = tmpNextEl.nextElementSibling && tmpNextEl.nextElementSibling._x_for_key !== undefined ? tmpNextEl.nextElementSibling : false;
    }
  }

  function removeAnyLeftOverElementsFromPreviousUpdate(currentEl) {
    var nextElementFromOldLoop = currentEl.nextElementSibling && currentEl.nextElementSibling._x_for_key !== undefined ? currentEl.nextElementSibling : false;

    while (nextElementFromOldLoop) {
      let nextElementFromOldLoopImmutable = nextElementFromOldLoop;
      let nextSibling = nextElementFromOldLoop.nextElementSibling;
      nextElementFromOldLoopImmutable.remove();
      nextElementFromOldLoop = nextSibling && nextSibling._x_for_key !== undefined ? nextSibling : false;
    }
  }

  function isNumeric$2(subject) {
    return !Array.isArray(subject) && !isNaN(subject);
  }

  let refHandler = function refHandler(el, value, modifiers, expression, effect, before) {
    let root = el._x_root();

    if (!root._x_$refs) root._x_$refs = {};
    root._x_$refs[expression] = el;
  };

  refHandler.runImmediately = true;
  Alpine.directive('ref', refHandler);

  Alpine.directive('on', (el, value, modifiers, expression) => {
    let evaluate = el._x_evaluator(expression, {}, false);

    el._x_on(el, value, modifiers, e => {
      evaluate({
        '$event': e
      });
    });
  });

  Alpine.magic('nextTick', el => callback => scheduler.nextTick(callback));

  Alpine.magic('dispatch', el => {
    return (event, detail = {}) => {
      return el._x_dispatch(event, detail);
    };
  });

  Alpine.magic('watch', el => {
    return (key, callback) => {
      let evaluate = el._x_evaluator(key);

      let firstTime = true;
      Alpine.effect(() => {
        let value = evaluate(); // This is a hack to force deep reactivity for things like "items.push()"

        let div = document.createElement('div');
        div.dataset.hey = value;
        if (!firstTime) callback(value);
        firstTime = false;
      });
    };
  });

  Alpine.magic('root', el => el._x_root());

  Alpine.magic('refs', el => el._x_root()._x_$refs || {});

  Alpine.magic('el', el => el);

  window.Alpine = Alpine;
  /**
   * Start It Up
   */

  if (!window.deferLoadingAlpine) window.deferLoadingAlpine = callback => callback();
  window.deferLoadingAlpine(() => Alpine.start());

})));
