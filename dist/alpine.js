(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
    factory();
}((function () { 'use strict';

    var scheduler = {
      tasks: [],
      lowPriorityTasks: [],
      nextTicks: [],
      shouldFlush: false,
      ignore: false,

      ignore(callback) {
        this.ignore = true;
        callback();
        this.ignore = false;
      },

      task(callback) {
        if (this.ignore === true) return;
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

      flushImmediately() {
        while (this.tasks.length > 0) this.tasks.shift()();

        if (!this.holdNextTicksOver) while (this.nextTicks.length > 0) this.nextTicks.shift()();
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
            setTimeout(() => {
              // Flush anything added by $nextTick
              while (this.nextTicks.length > 0) {
                this.nextTicks.shift()();
              }
            });
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
    const def = (obj, key, value) => {
        Object.defineProperty(obj, key, {
            configurable: true,
            enumerable: false,
            value
        });
    };

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
    function ownKeys(target) {
        track(target, "iterate" /* ITERATE */, isArray(target) ? 'length' : ITERATE_KEY);
        return Reflect.ownKeys(target);
    }
    const mutableHandlers = {
        get,
        set,
        deleteProperty,
        has,
        ownKeys
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
    function markRaw(value) {
        def(value, "__v_skip" /* SKIP */, true);
        return value;
    }
    function isRef(r) {
        return Boolean(r && r.__v_isRef === true);
    }

    function directives(el, attributes) {
      let attributeNamesAndValues = attributes || Array.from(el.attributes).map(attr => ({
        name: attr.name,
        value: attr.value
      }));
      attributeNamesAndValues = attributeNamesAndValues.map(({
        name,
        value
      }) => interceptNameAndValue({
        name,
        value
      }));
      let directives = attributeNamesAndValues.filter(isXAttr).map(parseHtmlAttribute);
      return sortDirectives(directives);
    }
    function directivesByType(el, type) {
      return directives(el).filter(attribute => attribute.type === type);
    }
    function directiveByType(el, type) {
      return directivesByType(el, type)[0];
    }
    let xAttrRE = /^x-([^:^.]+)\b/;

    function isXAttr({
      name,
      value
    }) {
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
      const typeMatch = name.match(xAttrRE);
      const valueMatch = name.match(/:([a-zA-Z0-9\-:]+)/);
      const modifiers = name.match(/\.[^.\]]+(?=[^\]]*$)/g) || [];
      return {
        type: typeMatch ? typeMatch[1] : null,
        value: valueMatch ? valueMatch[1] : null,
        modifiers: modifiers.map(i => i.replace('.', '')),
        expression: value
      };
    }

    function interceptNameAndValue({
      name,
      value
    }, addAttributes) {
      Alpine.intercept(({
        name,
        value
      }) => {
        if (name.startsWith('@')) name = name.replace('@', 'x-on:');
        return {
          name,
          value
        };
      });
      Alpine.intercept(({
        name,
        value
      }) => {
        if (name.startsWith(':')) name = name.replace(':', 'x-bind:');
        return {
          name,
          value
        };
      });
      return Alpine.interceptors.reduce((carry, interceptor) => {
        return interceptor(carry, addAttributes);
      }, {
        name,
        value
      });
    }

    function root(el) {
      if (el.hasAttribute('x-data') || el.hasAttribute('x-data.append')) return el;
      if (!el.parentElement) return;
      return root(el.parentElement);
    }

    function mergeProxies(...objects) {
      return new Proxy({}, {
        get: (target, name) => {
          return (objects.find(object => Object.keys(object).includes(name)) || {})[name];
        },
        set: (target, name, value) => {
          let closestObjectWithKey = objects.find(object => Object.keys(object).includes(name));
          let closestCanonicalObject = objects.find(object => object['_x_canonical']);

          if (closestObjectWithKey) {
            closestObjectWithKey[name] = value;
          } else if (closestCanonicalObject) {
            closestCanonicalObject[name] = value;
          } else {
            objects[objects.length - 1][name] = value;
          }

          return true;
        }
      });
    }

    function closestDataStack(node) {
      if (node._x_dataStack) return node._x_dataStack;

      if (node instanceof ShadowRoot) {
        return closestDataStack(node.host);
      }

      if (!node.parentNode) {
        return new Set();
      }

      return closestDataStack(node.parentNode);
    }

    let Alpine = {
      reactive,
      syncEffect: effect,
      markRaw,
      toRaw,
      interceptors: [],
      scheduler,

      get effect() {
        if (this.skipEffects) return () => {};
        return callback => {
          return effect(() => {
            callback();
          }, {
            scheduler(run) {
              scheduler.task(run);
            }

          });
        };
      },

      get effectSync() {
        if (this.skipEffects) return () => {};
        return callback => {
          return effect(() => {
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

      intercept(callback) {
        this.interceptors.push(callback);
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
        document.dispatchEvent(new CustomEvent('alpine:initializing'), {
          bubbles: true
        });
        this.listenForAndReactToDomManipulations(document.querySelector('body'));

        let outNestedComponents = el => !root(el.parentNode || root(el));

        Array.from(document.querySelectorAll('[x-data], [x-data\\.append]')).filter(outNestedComponents).forEach(el => this.initTree(el));
        document.dispatchEvent(new CustomEvent('alpine:initialized'), {
          bubbles: true
        });
      },

      copyTree(originalEl, newEl) {
        newEl._x_data = originalEl._x_data;
        newEl._x_$data = this.reactive(originalEl._x_data);
        newEl._x_dataStack = originalEl._x_dataStack;
        newEl._x_dataStack = new Set(closestDataStack(originalEl));

        newEl._x_dataStack.add(newEl._x_$data);

        let root = true;
        this.walk(newEl, (el, skipSubTree) => {
          if (!root && !!directiveByType(el, 'data')) return skipSubTree();
          root = false;
          this.init(el, false, (attr, handler) => handler.initOnly);
        }); // @todo: why is this here, why does this break Livewire reactivity?
        // this.skipEffects = true

        this.scheduler.flushImmediately(); // delete this.skipEffects
      },

      initTree(root) {
        if (root instanceof ShadowRoot) {
          Array.from(root.children).forEach(child => this.walk(child, el => this.init(el)));
        } else {
          this.walk(root, el => this.init(el));
        }

        this.scheduler.flush();
      },

      init(el, attributes, exceptAttribute = () => false) {
        (attributes || directives(el)).forEach(attr => {
          let noop = () => {};

          let handler = Alpine.directives[attr.type] || noop;
          if (exceptAttribute(attr, handler)) return; // Run "x-ref/data/spread" on the initial sweep.

          let task = handler.immediate ? callback => callback() : this.scheduler.task.bind(this.scheduler);
          task(() => {
            handler(el, attr.value, attr.modifiers, attr.expression, Alpine.effect);
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

      destroyTree(root) {
        this.walk(root, el => this.destroy(el));
        this.scheduler.flush();
      },

      destroy(el) {
        let callbacks = this.destroyCallbacks.get(el);
        callbacks && callbacks.forEach(callback => callback());
      },

      listenForAndReactToDomManipulations(rootElement) {
        let observer = new MutationObserver(mutations => {
          for (let mutation of mutations) {
            if (mutation.type !== 'childList') continue;

            for (let node of mutation.addedNodes) {
              if (node.nodeType !== 1) continue;
              this.initTree(node);
            }

            for (let node of mutation.removedNodes) {
              if (node.nodeType !== 1) continue; // Don't block execution for destroy callbacks.

              scheduler.nextTick(() => {
                this.destroyTree(node);
              });
            }
          }
        });
        observer.observe(rootElement, {
          subtree: true,
          childList: true,
          deep: false
        });
      },

      walk(el, callback) {
        let skip = false;
        callback(el, () => skip = true);
        if (skip) return;
        let node = el.firstElementChild;

        while (node) {
          this.walk(node, callback, false);
          node = node.nextElementSibling;
        }
      }

    };

    function setClasses(el, classString) {
      let isInvalidType = subject => typeof subject === 'object' && !subject instanceof String || Array.isArray(subject);

      if (isInvalidType(classString)) console.warn('Alpine: class bindings must return a string or a stringable type. Arrays and Objects are no longer supported.'); // This is to allow short ifs like: :class="show || 'hidden'"

      if (classString === true) classString = '';

      let missingClasses = classString => classString.split(' ').filter(i => !el.classList.contains(i)).filter(Boolean);

      let addClassesAndReturnUndo = classes => {
        el.classList.add(...classes);
        return () => {
          el.classList.remove(...classes);
        };
      };

      return addClassesAndReturnUndo(missingClasses(classString || ''));
    }
    function toggleClasses(el, classObject) {
      let split = classString => classString.split(' ').filter(Boolean);

      let forAdd = Object.entries(classObject).flatMap(([classString, bool]) => bool ? split(classString) : false).filter(Boolean);
      let forRemove = Object.entries(classObject).flatMap(([classString, bool]) => !bool ? split(classString) : false).filter(Boolean);
      let added = [];
      let removed = [];
      forAdd.forEach(i => {
        if (!el.classList.contains(i)) {
          el.classList.add(i);
          added.push(i);
        }
      });
      forRemove.forEach(i => {
        if (el.classList.contains(i)) {
          el.classList.remove(i);
          removed.push(i);
        }
      });
      return () => {
        added.forEach(i => el.classList.remove(i));
        removed.forEach(i => el.classList.add(i));
      };
    }

    let handler = (el, value, modifiers, expression, effect) => {
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
    }; // handler.initOnly = true


    Alpine.directive('transition', handler);
    function transitionClasses(el, {
      during = '',
      start = '',
      end = ''
    } = {}, before = () => {}, after = () => {}) {
      if (el._x_transitioning) el._x_transitioning.cancel();
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
    function registerTranstions(el, modifiers) {
      el._x_transition = {
        enter: {
          during: {},
          start: {},
          end: {}
        },
        leave: {
          during: {},
          start: {},
          end: {}
        },

        in(before = () => {}, after = () => {}) {
          return transitionStyles(el, {
            during: this.enter.during,
            start: this.enter.start,
            end: this.enter.end
          }, before, after);
        },

        out(before = () => {}, after = () => {}) {
          return transitionStyles(el, {
            during: this.leave.during,
            start: this.leave.start,
            end: this.leave.end
          }, before, after);
        }

      };
      let doesntSpecify = !modifiers.includes('in') && !modifiers.includes('out');
      let transitioningIn = doesntSpecify || modifiers.includes('in');
      let transitioningOut = doesntSpecify || modifiers.includes('out');

      if (modifiers.includes('in') && !doesntSpecify) {
        modifiers = modifiers.filter((i, index) => index < modifiers.indexOf('out'));
      }

      if (modifiers.includes('out') && !doesntSpecify) {
        modifiers = modifiers.filter((i, index) => index > modifiers.indexOf('out'));
      }

      if (transitioningIn) {
        el._x_transition.enter.during = {
          transitionOrigin: modifierValue(modifiers, 'origin', 'center'),
          transitionProperty: 'opacity, transform',
          transitionDuration: `${modifierValue(modifiers, 'duration', 150) / 1000}s`,
          transitionTimingFunction: `cubic-bezier(0.4, 0.0, 0.2, 1)`
        };
        el._x_transition.enter.start = {
          opacity: 0,
          transform: `scale(${modifierValue(modifiers, 'scale', 95) / 100})`
        };
        el._x_transition.enter.end = {
          opacity: 1,
          transform: `scale(1)`
        };
      }

      if (transitioningOut) {
        let duration = modifierValue(modifiers, 'duration', 150) / 2;
        el._x_transition.leave.during = {
          transitionOrigin: modifierValue(modifiers, 'origin', 'center'),
          transitionProperty: 'opacity, transform',
          transitionDuration: `${duration / 1000}s`,
          transitionTimingFunction: `cubic-bezier(0.4, 0.0, 0.2, 1)`
        };
        el._x_transition.leave.start = {
          opacity: 1,
          transform: `scale(1)`
        };
        el._x_transition.leave.end = {
          opacity: 0,
          transform: `scale(${modifierValue(modifiers, 'scale', 95) / 100})`
        };
      }

      return;
    }

    function transitionStyles(el, {
      during = {},
      start = {},
      end = {}
    }, before = () => {}, after = () => {}) {
      if (el._x_transitioning) el._x_transitioning.cancel();
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

    function setStyles(el, styleObject) {
      let previousStyles = {};
      Object.entries(styleObject).forEach(([key, value]) => {
        previousStyles[key] = el.style[key];
        el.style[key] = value;
      });
      return () => {
        setStyles(el, previousStyles);
      };
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

    function modifierValue(modifiers, key, fallback) {
      // If the modifier isn't present, use the default.
      if (modifiers.indexOf(key) === -1) return fallback; // If it IS present, grab the value after it: x-show.transition.duration.500ms

      const rawValue = modifiers[modifiers.indexOf(key) + 1];
      if (!rawValue) return fallback;

      if (key === 'scale') {
        // Check if the very next value is NOT a number and return the fallback.
        // If x-show.transition.scale, we'll use the default scale value.
        // That is how a user opts out of the opacity transition.
        if (!isNumeric(rawValue)) return fallback;
      }

      if (key === 'duration') {
        // Support x-show.transition.duration.500ms && duration.500
        let match = rawValue.match(/([0-9]+)ms/);
        if (match) return match[1];
      }

      if (key === 'origin') {
        // Support chaining origin directions: x-show.transition.top.right
        if (['top', 'right', 'left', 'center', 'bottom'].includes(modifiers[modifiers.indexOf(key) + 2])) {
          return [rawValue, modifiers[modifiers.indexOf(key) + 2]].join(' ');
        }
      }

      return rawValue;
    }

    function evaluator(el, expression, extras = {}, returns = true) {
      // Ok, gear up for this method. It's a bit of a bumpy ride.
      // First, we establish all data we want made available to the function/expression.
      let farExtras = {};
      let dataStack = closestDataStack(el);
      let closeExtras = extras;
      Alpine.injectMagics(closeExtras, el); // Now we smush em all together into one stack and reverse it so we can give proper scoping priority later.

      let reversedDataStack = [farExtras].concat(Array.from(dataStack).concat([closeExtras])).reverse(); // We're going to use Async functions for evaluation to allow for the use of "await" in expressions.

      let AsyncFunction = Object.getPrototypeOf(async function () {}).constructor; // If we weren't given a string expression (in the case of x-spread), evaluate the function directly.

      if (typeof expression === 'function') {
        let mergedObject = mergeProxies(...reversedDataStack);
        let expressionWithContext = expression.bind(mergedObject);
        return (...args) => {
          let result = expressionWithContext(...args);

          if (result instanceof Promise) {
            return receiver => {
              result.then(i => receiver(i));
            };
          }

          return receiver => receiver(result);
        };
      }

      let names = reversedDataStack.map((data, index) => `$data${index}`);
      let namesWithPlaceholder = ['$dataPlaceholder'].concat(names);
      let assignmentPrefix = returns ? '__self.result = ' : '';
      let withExpression = namesWithPlaceholder.reduce((carry, current) => {
        return `with (${current}) { ${carry} }`;
      }, `${assignmentPrefix}${expression}`);
      let namesWithPlaceholderAndDefault = names.concat(['$dataPlaceholder = {}']);

      let evaluator = () => {}; // We wrap this in a try catch right now so we can catch errors when constructing the evaluator and handle them nicely.


      evaluator = tryCatch(el, expression, () => (...args) => {
        // We build the async function from the expression and arguments we constructed already.
        let func = new AsyncFunction(['__self', ...namesWithPlaceholderAndDefault], `${withExpression}; __self.finished = true; return __self.result;`); // The following rigamerol is to handle the AsyncFunction both synchronously AND asynchronously at the SAME TIME. What a rush.
        // Because the async/promise body is evaluated immediately (synchronously), we can store any results and check
        // if they are set synchronously.

        func.result = undefined;
        func.finished = false; // Run the function.

        let promise = func(...[func, ...args]);
        return receiver => {
          // Check if the function ran synchronously,
          if (func.finished) {
            // Return the immediate result.
            receiver(func.result);
          } else {
            // If not, return the result when the promise resolves.
            promise.then(result => {
              receiver(result);
            });
          }
        };
      });
      let boundEvaluator = evaluator.bind(null, ...reversedDataStack);
      return tryCatch.bind(null, el, expression, boundEvaluator);
    }
    function evaluate(el, expression, extras = {}, returns = true) {
      return evaluator(el, expression, extras, returns)();
    }
    function evaluateSync(el, expression, extras = {}, returns = true) {
      let result;
      evaluator(el, expression, extras, returns)()(value => result = value);
      return result;
    }

    function tryCatch(el, expression, callback, ...args) {
      try {
        return callback(...args);
      } catch (e) {
        console.log(callback.toString());
        console.warn(`Alpine Expression Error: ${e.message}\n\nExpression: "${expression}"\n\n`, el);
        throw e;
      }
    }

    Alpine.directive('intersect', (el, value, modifiers, expression, effect) => {
      let evaluate = evaluator(el, expression, {}, false);

      if (['in', 'leave'].includes(value)) {
        el._x_intersectLeave(evaluate, modifiers);
      } else {
        el._x_intersectEnter(evaluate, modifiers);
      }
    });

    window.Element.prototype._x_intersectEnter = function (callback, modifiers) {
      this._x_intersect((entry, observer) => {
        if (entry.intersectionRatio > 0) {
          callback();
          modifiers.includes('once') && observer.unobserve(this);
        }
      });
    };

    window.Element.prototype._x_intersectLeave = function (callback, modifiers) {
      this._x_intersect((entry, observer) => {
        if (!entry.intersectionRatio > 0) {
          callback();
          modifiers.includes('once') && observer.unobserve(this);
        }
      });
    };

    window.Element.prototype._x_intersect = function (callback) {
      let observer = new IntersectionObserver(entries => {
        entries.forEach(entry => callback(entry, observer));
      });
      observer.observe(this);
      return observer;
    };

    document.addEventListener('alpine:initialized', () => {
      document.querySelectorAll('[x-element]').forEach(template => {
        registerElement(template.getAttribute('x-element'), template);
      });
    });

    function registerElement(name, template) {
      customElements.define(name, class extends HTMLElement {
        constructor() {
          super();
          let shadow = this.attachShadow({
            mode: 'open'
          });
          Array.from(template.content.children).forEach(child => {
            shadow.append(child.cloneNode(true));
          }); // @todo: totally undecided on this.
          // this.setAttribute('invisible', true)
          // this.style.display = 'contents'
          // This is great and does great things, but breaks flex
          // this.style.display = 'contents'
          // The main mutation observer won't pick up changes inside
          // shadow roots (like els added by x-for).

          Alpine.listenForAndReactToDomManipulations(this.shadowRoot);
          Alpine.scheduler.nextTick(() => {
            let reactiveRoot = Alpine.reactive({});
            let customElementRoot = this;

            if (template.hasAttribute('x-props')) {
              let props = evaluateSync(this.shadowRoot, template.getAttribute('x-props'));
              Object.entries(props).forEach(([propName, propDefault]) => {
                // If the property was bound on the custom-element with x-bind.
                if (this._x_bindings && typeof this._x_bindings[propName] !== undefined) {
                  Object.defineProperty(reactiveRoot, propName, {
                    get() {
                      return customElementRoot._x_bindings[propName]();
                    }

                  });
                  return;
                } // If the element has the property on itself.


                if (this.hasAttribute(propName)) {
                  reactiveRoot[propName] = this.getAttribute(propName);
                  return;
                }

                reactiveRoot[propName] = propDefault;
              });
            }

            if (template.hasAttribute('x-inject')) {
              let injectNames = template.getAttribute('x-inject').split(',').map(i => i.trim());
              injectNames.forEach(injectName => {
                let getClosestProvides = (el, name) => {
                  if (!el) return {};
                  if (el._x_provides && el._x_provides[injectName] !== undefined) return el._x_provides;
                  return getClosestProvides(el.parentNode);
                }; // We're gonna cache provides in the outer scope so we don't
                // have to crawl up the dom tree every time we want it.


                let provides;
                Object.defineProperty(reactiveRoot, injectName, {
                  get() {
                    if (!provides) {
                      provides = getClosestProvides(customElementRoot);
                    }

                    return provides[injectName];
                  }

                });
              });
            }

            this.shadowRoot._x_dataStack = new Set(closestDataStack(this.shadowRoot));

            this.shadowRoot._x_dataStack.add(Alpine.reactive(reactiveRoot));

            Alpine.initTree(shadow);
          });
        }

      });
    }

    Alpine.directive('provide', (el, value, modifiers, expression) => {
      let root = closestCustomElementRoot(el);

      if (!root._x_provides) {
        root._x_provides = {};
      }

      Object.defineProperty(root._x_provides, expression, {
        get() {
          return evaluateSync(el, expression);
        }

      });
    });

    function closestCustomElementRoot(el) {
      if (el.host) return el.host;
      return closestCustomElementRoot(el.parentNode);
    }

    Alpine.directive('destroy', (el, value, modifiers, expression, effect) => {
      Alpine.addDestroyCallback(el, () => {
        evaluate(el, expression, {}, false);
      });
    });

    Alpine.directive('spread', (el, value, modifiers, expression, effect) => {
      let spreadObject = evaluateSync(el, expression);
      let rawAttributes = Object.entries(spreadObject).map(([name, value]) => ({
        name,
        value
      }));
      let attributes = directives(el, rawAttributes);
      Alpine.init(el, attributes);
    });

    Alpine.directive('scope', (el, value, modifiers, expression) => {
      let slot = el.firstElementChild.assignedSlot; // let root = closestCustomElementRoot(el)

      let object = evaluateSync(el, expression);
      let reactiveRoot = {};
      Object.entries(object).forEach(([name, defaultValue]) => {
        let getter = evaluator(el);
        Object.defineProperty(reactiveRoot, name, {
          get() {
            console.log('get');
            return slot._x_bindings[name]();
          }

        });
      });
      el._x_dataStack = new Set(closestDataStack(el));

      el._x_dataStack.add(Alpine.reactive(reactiveRoot)); // Object.defineProperty(root._x_provides, expression, {
      //     get() {
      //         return evaluateSync(el, expression)
      //     }
      // })

    });

    function bind(el, name, value, modifiers = []) {
      name = modifiers.includes('camel') ? camelCase(name) : name;

      switch (name) {
        case 'value':
          bindInputValue(el, value);
          break;

        case 'class':
          bindClasses(el, value);
          break;

        default:
          bindAttribute(el, name, value);
          break;
      }
    }

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
        // If the value is a boolean/array/number/null/undefined, leave it alone, it will be set to "on"
        // automatically.
        if (!Number.isInteger(value) && !Array.isArray(value) && typeof value !== 'boolean' && ![null, undefined].includes(value)) {
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

      if (typeof value === 'object' && value !== null) {
        el._x_undoAddedClasses = toggleClasses(el, value);
      } else {
        el._x_undoAddedClasses = setClasses(el, value);
      }
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
      // As per HTML spec table https://html.spec.whatwg.org/multipage/indices.html#attributes-3:boolean-attribute
      // Array roughly ordered by estimated usage
      const booleanAttributes = ['disabled', 'checked', 'required', 'readonly', 'hidden', 'open', 'selected', 'autofocus', 'itemscope', 'multiple', 'novalidate', 'allowfullscreen', 'allowpaymentrequest', 'formnovalidate', 'autoplay', 'controls', 'loop', 'muted', 'playsinline', 'default', 'ismap', 'reversed', 'async', 'defer', 'nomodule'];
      return booleanAttributes.includes(attrName);
    }

    function on(el, event, modifiers, callback) {
      let options = {
        passive: modifiers.includes('passive')
      };
      if (modifiers.includes('camel')) event = camelCase$1(event);

      if (modifiers.includes('away')) {
        return addAwayListener(el, event, modifiers, callback, options);
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
          let wait = isNumeric$1(nextModifier.split('ms')[0]) ? Number(nextModifier.split('ms')[0]) : 250;
          handler = debounce(handler, wait);
        }

        if (modifiers.includes('throttle')) {
          let nextModifier = modifiers[modifiers.indexOf('throttle') + 1] || 'invalid-wait';
          let wait = isNumeric$1(nextModifier.split('ms')[0]) ? Number(nextModifier.split('ms')[0]) : 250;
          handler = throttle(handler, wait);
        }

        listenerTarget.addEventListener(event, handler, options);
        return () => {
          listenerTarget.removeEventListener(event, handler, options);
        };
      }
    }

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
      return () => {
        document.removeEventListener(event, handler, options);
      };
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

    function isNumeric$1(subject) {
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
        keyModifiers.splice(debounceIndex, isNumeric$1((keyModifiers[debounceIndex + 1] || 'invalid-wait').split('ms')[0]) ? 2 : 1);
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

    Alpine.directive('model', (el, value, modifiers, expression, effect) => {
      let evaluate = evaluator(el, expression);
      let assignmentExpression = `${expression} = rightSideOfExpression($event, ${expression})`;
      let evaluateAssignment = evaluator(el, assignmentExpression); // If the element we are binding to is a select, a radio, or checkbox
      // we'll listen for the change event instead of the "input" event.

      var event = el.tagName.toLowerCase() === 'select' || ['checkbox', 'radio'].includes(el.type) || modifiers.includes('lazy') ? 'change' : 'input';
      let assigmentFunction = generateAssignmentFunction(el, modifiers, expression);
      let removeListener = on(el, event, modifiers, e => {
        evaluateAssignment({
          '$event': e,
          rightSideOfExpression: assigmentFunction
        });
      });
      if (!window.hey) window.hey = [];

      el._x_forceModelUpdate = () => {
        evaluate()(value => {
          // If nested model key is undefined, set the default value to empty string.
          if (value === undefined && expression.match(/\./)) value = ''; // @todo: This is nasty

          window.fromModel = true;
          bind(el, 'value', value);
          delete window.fromModel;
        });
      };

      effect(() => {
        if (modifiers.includes('unintrusive') && document.activeElement.isSameNode(el)) return;

        el._x_forceModelUpdate();
      });

      if (!el._x_bindings) {
        el._x_bindings = {};
      }

      el._x_bindings.value = () => {
        let value;
        evaluate()(i => value = i);
        return value;
      };
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
        if (event instanceof CustomEvent && event.detail !== undefined) {
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
      return isNumeric$2(number) ? number : rawValue;
    }

    function checkedAttrLooseCompare$1(valueA, valueB) {
      return valueA == valueB;
    }

    function isNumeric$2(subject) {
      return !Array.isArray(subject) && !isNaN(subject);
    }

    Alpine.directive('cloak', el => {
      scheduler.nextTick(() => {
        el.removeAttribute('x-cloak');
      });
    });

    function morph(dom, toHtml, options) {
      assignOptions(options);
      patch(dom, createElement(toHtml));
      return dom;
    }
    let key, lookahead, updating, updated, removing, removed, adding, added;

    let noop = () => {};

    function assignOptions(options = {}) {
      let defaultGetKey = el => el.getAttribute('key');

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
      if (dom.isEqualNode(to)) return;

      if (differentElementNamesTypesOrKeys(dom, to)) {
        return patchElement(dom, to);
      }

      let updateChildrenOnly = false;
      if (shouldSkip(updating, dom, to, () => updateChildrenOnly = true)) return;
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
      if (shouldSkip(removing, dom)) return;
      let toCloned = to.cloneNode(true);
      if (shouldSkip(adding, toCloned)) return;
      dom.parentNode.replaceChild(toCloned, dom);
      removed(dom);
      added(toCloned);
    }

    function patchNodeValue(dom, to) {
      let value = to.nodeValue;
      if (dom.nodeValue !== value) dom.nodeValue = value;
    }

    function patchAttributes(dom, to) {
      let domAttributes = Array.from(dom.attributes);
      let toAttributes = Array.from(to.attributes);

      for (let i = domAttributes.length - 1; i >= 0; i--) {
        let name = domAttributes[i].name;
        if (!to.hasAttribute(name)) dom.removeAttribute(name);
      }

      for (let i = toAttributes.length - 1; i >= 0; i--) {
        let name = toAttributes[i].name;
        let value = toAttributes[i].value;
        if (dom.getAttribute(name) !== value) dom.setAttribute(name, value);
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
        let domKey = getKey(currentFrom); // Add new elements

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
        } // Patch elements


        patch(currentFrom, currentTo);
        currentTo = currentTo && currentTo.nextSibling;
        currentFrom = currentFrom && currentFrom.nextSibling;
      } // cleanup extra froms


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
      els.forEach(el => {
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
      if (from.nodeType !== 1) return; // If the element we are updating is an Alpine component...

      if (from._x_dataStack) {
        // Then temporarily clone it (with it's data) to the "to" element.
        // This should simulate backend Livewire being aware of Alpine changes.
        window.Alpine.copyTree(from, to);
      } // x-show elements require care because of transitions.


      if (Array.from(from.attributes).map(attr => attr.name).some(name => /x-show/.test(name))) {
        if (from._x_transitioning) {
          // This covers @entangle('something')
          childrenOnly();
        } else {
          // This covers x-show="$wire.something"
          //
          // If the element has x-show, we need to "reverse" the damage done by "clone",
          // so that if/when the element has a transition on it, it will occur naturally.
          if (isHiding(from, to)) {
            let style = to.getAttribute('style');
            to.setAttribute('style', style.replace('display: none;', ''));
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

    Alpine.directive('morph', (el, value, modifiers, expression, effect) => {
      let evaluate = evaluator(el, expression);
      effect(() => {
        evaluate()(value => {
          if (!el.firstElementChild) {
            if (el.firstChild) {
              el.firstChild.remove();
            }

            el.appendChild(document.createElement('div'));
          }

          morph(el.firstElementChild, value);
        });
      });
    });

    Alpine.directive('watch', (el, value, modifiers, expression, effect) => {
      let evaluate = evaluator(el, `$watch('${value}', $value => ${expression})`);
      setTimeout(() => {
        evaluate();
      });
    });

    let handler$1 = (el, value, modifiers, expression, effect) => {
      evaluate(el, expression, {}, false);
    };

    handler$1.initOnly = true;
    Alpine.directive('init', handler$1);

    Alpine.directive('text', (el, value, modifiers, expression, effect) => {
      let evaluate = evaluator(el, expression);
      effect(() => {
        evaluate()(value => {
          el.textContent = value;
        });
      });
    });

    Alpine.directive('bind', (el, value, modifiers, expression, effect) => {
      let attrName = value;
      let evaluate = evaluator(el, expression); // Ignore :key bindings. (They are used by x-for)

      if (attrName === 'key') return;

      if (!el._x_bindings) {
        el._x_bindings = {};
      }

      console.log('bind', value);

      el._x_bindings[attrName] = () => {
        return evaluateSync(el, expression);
      };

      effect(() => evaluate()(value => {
        bind(el, attrName, value, modifiers);
      }));
    });

    let handler$2 = (el, value, modifiers, expression, effect) => {
      expression = expression === '' ? '{}' : expression;
      let components = Alpine.components;
      let data;

      if (Object.keys(components).includes(expression)) {
        data = components[expression]();
        data._x_canonical = true;
      } else {
        data = evaluateSync(el, expression);
      }

      Alpine.injectMagics(data, el);
      el._x_data = data;
      el._x_$data = Alpine.reactive(el._x_data);
      el._x_dataStack = new Set(closestDataStack(el));

      el._x_dataStack.add(el._x_$data);

      el.dispatchEvent(new CustomEvent('alpine:initializingComponent', {
        detail: el._x_$data,
        bubbles: true
      }));

      if (data['init']) {
        evaluateSync(el, data['init'].bind(data));
      }

      if (data['destroy']) {
        Alpine.addDestroyCallback(el, () => {
          evaluate(el, data['destroy'].bind(data));
        });
      }
    };

    handler$2.initOnly = true;
    Alpine.directive('data', handler$2);

    Alpine.directive('show', (el, value, modifiers, expression, effect) => {
      let evaluate = evaluator(el, expression, {}, true);

      let hide = () => {
        el.style.display = 'none';
        el._x_is_shown = false;
      };

      let show = () => {
        if (el.style.length === 1 && el.style.display === 'none') {
          el.removeAttribute('style');
        } else {
          el.style.removeProperty('display');
        }

        el._x_is_shown = true;
      };

      if (modifiers.includes('transition')) {
        registerTranstions(el, modifiers);
      }

      let isFirstRun = true;
      effect(() => evaluate()(value => {
        isFirstRun ? toggleImmediately(el, value, show, hide) : toggleWithTransitions(el, value, show, hide);
        isFirstRun = false;
      }));
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
      let parent = el.parentNode;
      if (!parent) return;
      return parent._x_do_hide ? parent : closestHide(parent);
    }

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

    function ownKeys$1(object, enumerableOnly) {
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
          ownKeys$1(Object(source), true).forEach(function (key) {
            _defineProperty(target, key, source[key]);
          });
        } else if (Object.getOwnPropertyDescriptors) {
          Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
        } else {
          ownKeys$1(Object(source)).forEach(function (key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
          });
        }
      }

      return target;
    }

    Alpine.directive('for', (el, value, modifiers, expression, effect) => {
      var _directivesByType$fil;

      let iteratorNames = parseForExpression(expression);
      let evaluateItems = evaluator(el, iteratorNames.items);
      let evaluateKey = evaluator(el, // Look for a :key="..." expression
      ((_directivesByType$fil = directivesByType(el, 'bind').filter(attribute => attribute.value === 'key')[0]) === null || _directivesByType$fil === void 0 ? void 0 : _directivesByType$fil.expression // Otherwise, use "index"
      ) || 'index');
      effect(() => {
        loop(el, iteratorNames, evaluateItems, evaluateKey);
      });
    });

    function loop(el, iteratorNames, evaluateItems, evaluateKey) {
      let templateEl = el;
      evaluateItems()(items => {
        // This adds support for the `i in n` syntax.
        if (isNumeric$3(items) && items > 0) {
          items = Array.from(Array(items).keys(), i => i + 1);
        }

        let closestParentContext = closestDataStack(el); // As we walk the array, we'll also walk the DOM (updating/creating as we go).

        let currentEl = templateEl;
        items.forEach((item, index) => {
          let iterationScopeVariables = getIterationScopeVariables(iteratorNames, item, index, items);
          let currentKey;
          evaluateKey(_objectSpread2({
            index
          }, iterationScopeVariables))(result => currentKey = result);
          let nextEl = lookAheadForMatchingKeyedElementAndMoveItIfFound(currentEl.nextElementSibling, currentKey); // If we haven't found a matching key, insert the element at the current position.

          if (!nextEl) {
            nextEl = addElementInLoopAfterCurrentEl(templateEl, currentEl);
            let newSet = new Set(closestParentContext);
            newSet.add(Alpine.reactive(iterationScopeVariables));
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
      });
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

    function isNumeric$3(subject) {
      return !Array.isArray(subject) && !isNaN(subject);
    }

    let handler$3 = function handler(el, value, modifiers, expression, effect, before) {
      let theRoot = root(el);
      if (!theRoot._x_$refs) theRoot._x_$refs = {};
      theRoot._x_$refs[expression] = el;
    };

    handler$3.immediate = true;
    Alpine.directive('ref', handler$3);

    Alpine.directive('on', (el, value, modifiers, expression) => {
      let evaluate = evaluator(el, expression, {}, false);
      on(el, value, modifiers, e => {
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

    window.Element.prototype._x_dispatch = function (event, detail = {}) {
      this.dispatchEvent(new CustomEvent(event, {
        detail,
        bubbles: true,
        // Allows events to pass the shadow DOM barrier.
        composed: true
      }));
    };

    Alpine.magic('watch', el => {
      return (key, callback) => {
        let evaluate = evaluator(el, key);
        let firstTime = true;
        let effect = Alpine.effect(() => evaluate()(value => {
          // This is a hack to force deep reactivity for things like "items.push()"
          let div = document.createElement('div');
          div.dataset.hey = value;

          if (!firstTime) {
            // Stop reactivity while running the watcher.
            pauseTracking();
            callback(value);
            enableTracking();
          }

          firstTime = false;
        }));
      };
    });

    Alpine.magic('store', () => {
      return name => Alpine.getStore(name);
    });

    Alpine.magic('morph', el => (el, html, options) => morph(el, html, options));

    Alpine.magic('root', el => root(el));

    Alpine.magic('refs', el => root(el)._x_$refs || {});

    Alpine.magic('el', el => el);

    /**
     * Start It Up
     */

    window.Alpine = Alpine;
    Alpine.start();

})));
