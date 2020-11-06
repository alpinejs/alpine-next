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

  const BIND_IGNORED = [
      'String',
      'Number',
      'Object',
      'Array',
      'Boolean',
      'Date'
  ];

  function isObj(object) { return object && typeof object === 'object' }
  function setHiddenKey(object, key, value) {
      Object.defineProperty(object, key, { value, enumerable: false, configurable: true });
  }
  function defineBubblingProperties(object, key, parent) {
      setHiddenKey(object, '__key', key);
      setHiddenKey(object, '__parent', parent);
  }
  function getInstanceMethodKeys(object) {
      return (
          Object
              .getOwnPropertyNames(object)
              .concat(
                  Object.getPrototypeOf(object) &&
                  BIND_IGNORED.indexOf(Object.getPrototypeOf(object).constructor.name) < 0 ?
                      Object.getOwnPropertyNames(Object.getPrototypeOf(object)) :
                      []
              )
              .filter(prop => prop !== 'constructor' && typeof object[prop] === 'function')
      )
  }

  const data = {
      computedStack: [],
      observersMap: new WeakMap(),
      computedDependenciesTracker: new WeakMap()
  };

  let timeout = null;
  const queue = new Set();
  function process() {
      for(const task of queue) {
          task();
      }
      queue.clear();
      timeout = null;
  }

  function enqueue(task, batch) {
      if(timeout === null)
          timeout = setTimeout(process, batch === true ? 0 : batch);
      queue.add(task);
  }

  const { observersMap, computedStack, computedDependenciesTracker } = data;

  function observe(obj, options = {}) {
      // 'deep' is slower but reasonable; 'shallow' a performance enhancement but with side-effects
      const {
          props,
          ignore,
          batch,
          deep = true,
          bubble,
          bind
      } = options;

      // Ignore if the object is already observed
      if(obj.__observed) {
          return obj
      }

      // If the prop is explicitely not excluded
      const isWatched = prop => (!props || props.includes(prop)) && (!ignore || !ignore.includes(prop));

      // Add the object to the observers map.
      // observersMap signature : Map<Object, Map<Property, Set<Computed function>>>
      // In other words, observersMap is a map of observed objects.
      // For each observed object, each property is mapped with a set of computed functions depending on this property.
      // Whenever a property is set, we re-run each one of the functions stored inside the matching Set.
      observersMap.set(obj, new Map());

      // If the deep flag is set, observe nested objects/arrays
      if(deep) {
          Object.entries(obj).forEach(function([key, val]) {
              if(isObj(val)) {
                  obj[key] = observe(val, options);
                  // If bubble is set, we add keys to the object used to bubble up the mutation
                  if(bubble) {
                      defineBubblingProperties(obj[key], key, obj);
                  }
              }
          });
      }

      // Proxify the object in order to intercept get/set on props
      const proxy = new Proxy(obj, {
          get(_, prop) {
              if(prop === '__observed')
                  return true

              // If the prop is watched
              if(isWatched(prop)) {
                  // If a computed function is being run
                  if(computedStack.length) {
                      const propertiesMap = observersMap.get(obj);
                      if(!propertiesMap.has(prop))
                          propertiesMap.set(prop, new Set());
                      // Tracks object and properties accessed during the function call
                      const tracker = computedDependenciesTracker.get(computedStack[0]);
                      if(tracker) {
                          if(!tracker.has(obj)) {
                              tracker.set(obj, new Set());
                          }
                          tracker.get(obj).add(prop);
                      }
                      // Link the computed function and the property being accessed
                      propertiesMap.get(prop).add(computedStack[0]);
                  }
              }

              return obj[prop]
          },
          set(_, prop, value) {
              if(prop === '__handler') {
                  // Don't track bubble handlers
                  setHiddenKey(obj, '__handler', value);
              } else if(!isWatched(prop)) {
                  // If the prop is ignored
                  obj[prop] = value;
              } else if(Array.isArray(obj) && prop === 'length' || obj[prop] !== value) {
                  // If the new/old value are not equal
                  const deeper = deep && isObj(value);
                  const propertiesMap = observersMap.get(obj);

                  // Remove bubbling infrastructure and pass old value to handlers
                  const oldValue = obj[prop];
                  if(isObj(oldValue))
                      delete obj[prop];

                  // If the deep flag is set we observe the newly set value
                  obj[prop] = deeper ? observe(value, options) : value;

                  // Co-opt assigned object into bubbling if appropriate
                  if(deeper && bubble) {
                      defineBubblingProperties(obj[prop], prop, obj);
                  }

                  const ancestry = [ prop ];
                  let parent = obj;
                  while(parent) {
                      // If a handler explicitly returns 'false' then stop propagation
                      if(parent.__handler && parent.__handler(ancestry, value, oldValue, proxy) === false) {
                          break
                      }
                      // Continue propagation, traversing the mutated property's object hierarchy & call any __handlers along the way
                      if(parent.__key && parent.__parent) {
                          ancestry.unshift(parent.__key);
                          parent = parent.__parent;
                      } else {
                          parent = null;
                      }
                  }

                  const dependents = propertiesMap.get(prop);
                  if(dependents) {
                      // Retrieve the computed functions depending on the prop
                      for(const dependent of dependents) {
                          const tracker = computedDependenciesTracker.get(dependent);
                          // If the function has been disposed or if the prop has not been used
                          // during the latest function call, delete the function reference
                          if(dependent.__disposed || tracker && (!tracker.has(obj) || !tracker.get(obj).has(prop))) {
                              dependents.delete(dependent);
                          } else if(dependent !== computedStack[0]) {
                              // Run the computed function
                              if(batch) {
                                  enqueue(dependent, batch);
                              } else {
                                  dependent();
                              }
                          }
                      }
                  }
              }

              return true
          }
      });

      if(bind) {
          // Need this for binding es6 classes methods which are stored in the object prototype
          getInstanceMethodKeys(obj).forEach(key => obj[key] = obj[key].bind(proxy));
      }

      return proxy
  }

  const { computedStack: computedStack$1, computedDependenciesTracker: computedDependenciesTracker$1 } = data;

  function computed(wrappedFunction, { autoRun = true, callback, bind, disableTracking = false } = {}) {
      // Proxify the function in order to intercept the calls
      const proxy = new Proxy(wrappedFunction, {
          apply(target, thisArg, argsList) {
              function observeComputation(fun) {
                  // Track object and object properties accessed during this function call
                  if(!disableTracking) {
                      computedDependenciesTracker$1.set(callback || proxy, new WeakMap());
                  }
                  // Store into the stack a reference to the computed function
                  computedStack$1.unshift(callback || proxy);
                  // Run the computed function - or the async function
                  const result = fun ?
                      fun() :
                      target.apply(bind || thisArg, argsList);
                  // Remove the reference
                  computedStack$1.shift();
                  // Return the result
                  return result
              }

              // Inject the computeAsync argument which is used to manually declare when the computation takes part
              argsList.push({
                  computeAsync: function(target) { return observeComputation(target) }
              });

              return observeComputation()
          }
      });

      // If autoRun, then call the function at once
      if(autoRun) {
          proxy();
      }

      return proxy
  }

  // The disposed flag which is used to remove a computed function reference pointer
  function dispose(computedFunction) {
      data.computedDependenciesTracker.delete(computedFunction);
      return computedFunction.__disposed = true
  }

  var hyperactiv = {
      observe,
      computed,
      dispose
  };

  let Alpine$1 = {
    observe: hyperactiv.observe,
    react: hyperactiv.computed,
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

    getElementMagics(el) {
      let magics = {};
      Object.entries(this.magics).forEach(([name, callback]) => {
        Object.defineProperty(magics, `$${name}`, {
          get() {
            return callback(el);
          },

          enumerable: true
        });
      });
      return magics;
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
      window.dispatchEvent(new CustomEvent('alpine:loading'), {
        bubbles: true
      });
      document.querySelectorAll('[x-data]').forEach(el => {
        el.__x__initChunk();
      });
      window.dispatchEvent(new CustomEvent('alpine:loaded'), {
        bubbles: true
      });
      this.listenForNewDomElementsToInitialize();
    },

    listenForNewDomElementsToInitialize() {
      let observer = new MutationObserver(mutations => {
        for (let mutation of mutations) {
          if (mutation.type !== 'childList') return;

          for (let node of mutation.addedNodes) {
            if (node.nodeType !== 1 || node.__x__skip_mutation_observer) return;

            node.__x__initChunk();
          }
        }
      });
      observer.observe(document.querySelector('body'), {
        subtree: true,
        childList: true
      });
    }

  };

  function getAttrs() {
    let directives = Array.from(this.attributes).filter(isXAttr).map(parseHtmlAttribute);
    let spreadDirective = directives.filter(directive => directive.type === 'spread')[0];

    if (spreadDirective) {
      let data = this.__x__closestDataProxy();

      let spreadObject = data[spreadDirective.expression] || this.__x__evaluate(spreadDirective.expression);

      directives = directives.concat(Object.entries(spreadObject).map(([name, value]) => parseHtmlAttribute({
        name,
        value
      })));
    }

    return sortDirectives(directives);
  }
  let xAttrRE = /^x-([^:]+)\b/;

  function isXAttr(attr) {
    const name = replaceAtAndColonWithStandardSyntax(attr.name);
    return xAttrRE.test(name);
  }

  function sortDirectives(directives) {
    let directiveOrder = ['ref', 'data', 'init', 'for', 'bind', 'model', 'transition', 'show', 'catch-all'];
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

  Alpine$1.directive('bind', (el, value, modifiers, expression, react) => {
    let attrName = value;

    let evaluate = el.__x__getEvaluator(expression);

    react(() => {
      let value = evaluate();
      attrName = modifiers.includes('camel') ? camelCase(attrName) : attrName;

      el.__x__bind(attrName, value);
    });
  });
  function bind(name, value) {
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
  }

  function bindInputValue(el, value) {
    if (el.type === 'radio') {
      // Set radio value from x-bind:value, if no "value" attribute exists.
      // If there are any initial state values, radio will have a correct
      // "checked" value since x-bind:value is processed before x-model.
      if (el.attributes.value === undefined) {
        el.value = value;
      } else if (attrType !== 'bind') {
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
    if (el.__x__undoAddedClasses) el.__x__undoAddedClasses();
    el.__x__undoAddedClasses = el.__x__addClasses(value);
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

  Alpine$1.directive('on', (el, value, modifiers, expression) => {
    let evaluate = el.__x__getEvaluator(expression, {}, false);

    el.__x__on(el, value, modifiers, e => {
      evaluate({
        '$event': e
      });
    });
  });
  function on(el, event, modifiers, callback) {
    let target = modifiers.includes('window') ? window : el;
    target.addEventListener(event, callback);
  }

  window.Element.prototype.__x__on = on;
  window.Element.prototype.__x__bind = bind;
  window.Element.prototype.__x__getAttrs = getAttrs;

  window.Element.prototype.__x__init = function () {
    if (this.hasAttribute('x-data')) {
      let expression = this.getAttribute('x-data');
      expression = expression === '' ? '{}' : expression;
      let components = Alpine.clonedComponentAccessor();

      if (Object.keys(components).includes(expression)) {
        this.__x__data = components[expression];
      } else {
        this.__x__data = this.__x__evaluate(expression);
      }

      this.__x__$data = Alpine.observe(this.__x__data);
      this.__x__dataStack = new Set(this.__x__closestDataStack());

      this.__x__dataStack.add(this.__x__$data);
    }

    let attrs = this.__x__getAttrs();

    attrs.forEach(attr => {
      let noop = () => {};

      let run = Alpine.directives[attr.type] || noop;
      run(this, attr.value, attr.modifiers, attr.expression, Alpine.react);
    });
  };

  window.Element.prototype.__x__dispatch = function (event, detail = {}) {
    this.dispatchEvent(new CustomEvent(event, {
      detail,
      bubbles: true
    }));
  };

  window.Element.prototype.__x__initChunk = function () {
    walk(this, el => el.__x__init());
  };

  window.Element.prototype.__x__addClasses = function (classString) {

    let missingClasses = classString => classString.split(' ').filter(i => !this.classList.contains(i)).filter(Boolean);

    let addClassesAndReturnUndo = classes => {
      this.classList.add(...classes);
      return () => {
        this.classList.remove(...classes);
      };
    };

    return addClassesAndReturnUndo(missingClasses(classString));
  };

  let mergeProxies = (...objects) => {
    return new Proxy({}, {
      get: (target, name) => {
        return (objects.find(object => Object.keys(object).includes(name)) || {})[name];
      },
      set: (target, name, value) => {
        (objects.find(object => Object.keys(object).includes(name)) || {})[name] = value;
        return true;
      }
    });
  };

  window.Element.prototype.__x__getEvaluator = function (expression, extras = {}, returns = true) {
    let farExtras = Alpine.getElementMagics(this);

    let dataStack = this.__x__closestDataStack();

    let closeExtras = extras;
    let reversedDataStack = [farExtras].concat(Array.from(dataStack).concat([closeExtras])).reverse();

    if (typeof expression === 'function') {
      let mergedObject = mergeProxies(...reversedDataStack);
      return expression.bind(mergedObject);
    }

    let names = reversedDataStack.map((data, index) => `$data${index}`);
    let namesWithPlaceholder = ['$dataPlaceholder'].concat(names);
    let assignmentPrefix = returns ? '__x__result = ' : '';
    let withExpression = namesWithPlaceholder.reduce((carry, current) => {
      return `with (${current}) { ${carry} }`;
    }, `${assignmentPrefix}${expression}`);
    let namesWithPlaceholderAndDefault = names.concat(['$dataPlaceholder = {}']);

    let evaluator = () => {};

    evaluator = tryCatch(this, () => {
      return new Function(namesWithPlaceholderAndDefault, `var __x__result; ${withExpression}; return __x__result;`);
    });
    let boundEvaluator = evaluator.bind(null, ...reversedDataStack);
    return tryCatch.bind(null, this, boundEvaluator);
  };

  function tryCatch(el, callback, ...args) {
    try {
      return callback(...args);
    } catch (e) {
      console.warn('Alpine Expression Error: ' + e.message, el);
      throw e;
    }
  }

  window.Element.prototype.__x__evaluate = function (expression, extras = {}, returns = true) {
    return this.__x__getEvaluator(expression, extras, returns)();
  };

  window.Element.prototype.__x__closestDataStack = function () {
    if (this.__x__dataStack) return this.__x__dataStack;
    if (!this.parentElement) return new Set();
    return this.parentElement.__x__closestDataStack();
  };

  window.Element.prototype.__x__closestDataProxy = function () {
    return mergeProxies(...this.__x__closestDataStack());
  };

  window.Element.prototype.__x__closestRoot = function () {
    if (this.hasAttribute('x-data')) return this;
    return this.parentElement.__x__closestRoot();
  };

  function walk(el, callback, forceFirst = true) {
    if (!forceFirst && (el.hasAttribute('x-data') || el.__x_for)) return;
    callback(el);
    let node = el.firstElementChild;

    while (node) {
      walk(node, callback, false);
      node = node.nextElementSibling;
    }
  }

  Alpine$1.directive('transition', (el, value, modifiers, expression, react) => {
    if (!el.__x__transition) {
      el.__x__transition = {
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

        in(before, after) {
          transitionClasses(el, {
            during: this.enter.during,
            start: this.enter.start,
            end: this.enter.end
          }, before, after);
        },

        out(before, after) {
          transitionClasses(el, {
            during: this.leave.during,
            start: this.leave.start,
            end: this.leave.end
          }, before, after);
        }

      };
    }

    let directiveStorageMap = {
      'enter': classes => {
        el.__x__transition.enter.during = classes;
      },
      'enter-start': classes => {
        el.__x__transition.enter.start = classes;
      },
      'enter-end': classes => {
        el.__x__transition.enter.end = classes;
      },
      'leave': classes => {
        el.__x__transition.leave.during = classes;
      },
      'leave-start': classes => {
        el.__x__transition.leave.start = classes;
      },
      'leave-end': classes => {
        el.__x__transition.leave.end = classes;
      }
    };
    directiveStorageMap[value](expression);
  });
  function transitionClasses(el, {
    during = '',
    start = '',
    end = ''
  } = {}, before = () => {}, after = () => {}) {
    // Permaturely finsh and clear the previous transition if exists to avoid caching the wrong classes
    if (el.__x__transitioning) el.__x__transitioning.finish();
    let undoStart, undoDuring, undoEnd;
    performTransition(el, {
      start() {
        undoStart = el.__x__addClasses(start);
      },

      during() {
        undoDuring = el.__x__addClasses(during);
      },

      before,

      end() {
        undoStart();
        undoEnd = el.__x__addClasses(end);
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
      delete el.__x__transitioning;
    });
    el.__x__transitioning = {
      finish
    };
    stages.start();
    stages.during();
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
        setTimeout(el.__x__transitioning.finish, duration);
      });
    });
  } // Thanks VueJs!
  // https://github.com/vuejs/vue/blob/4de4649d9637262a9b007720b59f80ac72a5620c/src/shared/util.js

  function once(callback) {
    let called = false;
    return function () {
      if (!called) {
        called = true;
        callback.apply(this, arguments);
      }
    };
  }

  Alpine$1.directive('model', (el, value, modifiers, expression, react) => {
    let evaluate = el.__x__getEvaluator(expression);

    let assignmentExpression = `${expression} = rightSideOfExpression($event, ${expression})`;

    let evaluateAssignment = el.__x__getEvaluator(assignmentExpression); // If the element we are binding to is a select, a radio, or checkbox
    // we'll listen for the change event instead of the "input" event.


    var event = el.tagName.toLowerCase() === 'select' || ['checkbox', 'radio'].includes(el.type) || modifiers.includes('lazy') ? 'change' : 'input';
    let assigmentFunction = generateAssignmentFunction(el, modifiers, expression);

    el.__x__on(el, event, modifiers, e => {
      evaluateAssignment({
        '$event': e,
        rightSideOfExpression: assigmentFunction
      });
    });

    react(() => {
      let value = evaluate(); // If nested model key is undefined, set the default value to empty string.

      if (value === undefined && expression.match(/\./)) value = '';

      el.__x__bind('value', value);
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
    return isNumeric(number) ? number : rawValue;
  }

  function checkedAttrLooseCompare$1(valueA, valueB) {
    return valueA == valueB;
  }

  Alpine$1.directive('cloak', el => {
    el.removeAttribute('x-cloak');
  });

  Alpine$1.directive('init', (el, value, modifiers, expression, react) => {
    el.__x__evaluate(expression, {}, false);
  });

  Alpine$1.directive('text', (el, value, modifiers, expression, react) => {
    let evaluate = el.__x__getEvaluator(expression);

    react(() => {
      el.innerText = evaluate();
    });
  });

  Alpine$1.directive('show', (el, value, modifiers, expression, react) => {
    let evaluate = el.__x__getEvaluator(expression);

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
    react(() => {
      let value = evaluate();

      if (isFirstRun) {
        value ? show() : hide();
        isFirstRun = false;
        return;
      }

      if (value) {
        if (el.__x__transition) {
          el.__x__transition.in(show, () => {});
        } else {
          show();
        }
      } else {
        if (el.__x__transition) {
          el.__x__transition.out(() => {}, hide);
        } else {
          hide();
        }
      }
    });
  });

  Alpine$1.directive('for', (el, value, modifiers, expression, react) => {
    let iteratorNames = parseForExpression(expression);

    let evaluateItems = el.__x__getEvaluator(iteratorNames.items);

    react(() => {
      loop(el, iteratorNames, evaluateItems);
    });
  });

  function loop(el, iteratorNames, evaluateItems) {
    let templateEl = el;
    let items = evaluateItems();

    let closestParentContext = el.__x__closestDataStack(); // As we walk the array, we'll also walk the DOM (updating/creating as we go).


    let currentEl = templateEl;
    items.forEach((item, index) => {
      let iterationScopeVariables = getIterationScopeVariables(iteratorNames, item, index, items);
      let currentKey = index;
      let nextEl = lookAheadForMatchingKeyedElementAndMoveItIfFound(currentEl.nextElementSibling, currentKey); // If we haven't found a matching key, insert the element at the current position.

      if (!nextEl) {
        nextEl = addElementInLoopAfterCurrentEl(templateEl, currentEl);
        let newSet = new Set(closestParentContext);
        newSet.add(Alpine$1.observe(iterationScopeVariables));
        nextEl.__x__dataStack = newSet;
        nextEl.__x_for = iterationScopeVariables;

        nextEl.__x__initChunk();
      }

      {
        // Refresh data
        Object.entries(iterationScopeVariables).forEach(([key, value]) => {
          Array.from(nextEl.__x__dataStack).slice(-1)[0][key] = value;
        });
      }
      currentEl = nextEl;
      currentEl.__x_for_key = currentKey;
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
    inserted.__x__skip_mutation_observer = true;
    return inserted;
  }

  function lookAheadForMatchingKeyedElementAndMoveItIfFound(nextEl, currentKey) {
    if (!nextEl) return; // If the the key's DO match, no need to look ahead.

    if (nextEl.__x_for_key === currentKey) return nextEl; // If they don't, we'll look ahead for a match.
    // If we find it, we'll move it to the current position in the loop.

    let tmpNextEl = nextEl;

    while (tmpNextEl) {
      if (tmpNextEl.__x_for_key === currentKey) {
        return tmpNextEl.parentElement.insertBefore(tmpNextEl, nextEl);
      }

      tmpNextEl = tmpNextEl.nextElementSibling && tmpNextEl.nextElementSibling.__x_for_key !== undefined ? tmpNextEl.nextElementSibling : false;
    }
  }

  function removeAnyLeftOverElementsFromPreviousUpdate(currentEl) {
    var nextElementFromOldLoop = currentEl.nextElementSibling && currentEl.nextElementSibling.__x_for_key !== undefined ? currentEl.nextElementSibling : false;

    while (nextElementFromOldLoop) {
      let nextElementFromOldLoopImmutable = nextElementFromOldLoop;
      let nextSibling = nextElementFromOldLoop.nextElementSibling;
      nextElementFromOldLoopImmutable.remove();
      nextElementFromOldLoop = nextSibling && nextSibling.__x_for_key !== undefined ? nextSibling : false;
    }
  }

  Alpine$1.directive('ref', (el, value, modifiers, expression, react) => {
    let root = el.__x__closestRoot();

    if (!root.__x__$refs) root.__x__$refs = {};
    root.__x__$refs[expression] = el;
  });

  Alpine$1.magic('nextTick', el => {
    return callback => {
      setTimeout(callback);
    };
  });

  Alpine$1.magic('dispatch', el => {
    return (event, detail = {}) => {
      return el.__x__dispatch(event, detail);
    };
  });

  Alpine$1.magic('watch', el => {
    return (key, callback) => {
      let evaluate = el.__x__getEvaluator(key);

      let firstTime = true;
      Alpine$1.react(() => {
        let value = evaluate(); // This is a hack to force deep reactivity for things like "items.push()"

        let div = document.createElement('div');
        div.dataset.hey = value;
        if (!firstTime) callback(value);
        firstTime = false;
      });
    };
  });

  Alpine$1.magic('root', el => el.__x__closestRoot());

  Alpine$1.magic('refs', el => el.__x__closestRoot().__x__$refs || {});

  Alpine$1.magic('el', el => el);

  window.Alpine = Alpine$1;
  /**
   * Start it up!
   */

  if (!window.deferLoadingAlpine) window.deferLoadingAlpine = callback => callback();
  window.deferLoadingAlpine(() => Alpine$1.start());

})));
