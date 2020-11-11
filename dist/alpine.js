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
    effect: hyperactiv.computed,
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
        el._x_initTree();
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
            if (node.nodeType !== 1 || node._x_skip_mutation_observer) return;

            node._x_initTree();
          }
        }
      });
      observer.observe(document.querySelector('body'), {
        subtree: true,
        childList: true
      });
    }

  };

  window.Element.prototype._x_attributes = function () {
    let directives = Array.from(this.attributes).filter(isXAttr).map(parseHtmlAttribute);
    let spreadDirective = directives.filter(directive => directive.type === 'spread')[0];

    if (spreadDirective) {
      let data = this._x_closestDataProxy();

      let spreadObject = data[spreadDirective.expression] || this._x_evaluate(spreadDirective.expression);

      directives = directives.concat(Object.entries(spreadObject).map(([name, value]) => parseHtmlAttribute({
        name,
        value
      })));
    }

    return sortDirectives(directives);
  };

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

  window.Element.prototype._x_evaluator = function (expression, extras = {}, returns = true) {
    let farExtras = Alpine.getElementMagics(this);

    let dataStack = this._x_closestDataStack();

    let closeExtras = extras;
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

    let missingClasses = classString => classString.split(' ').filter(i => !this.classList.contains(i)).filter(Boolean);

    let addClassesAndReturnUndo = classes => {
      this.classList.add(...classes);
      return () => {
        this.classList.remove(...classes);
      };
    };

    return addClassesAndReturnUndo(missingClasses(classString));
  };

  window.Element.prototype._x_init = function () {
    if (this.hasAttribute('x-data')) {
      let expression = this.getAttribute('x-data');
      expression = expression === '' ? '{}' : expression;
      let components = Alpine.clonedComponentAccessor();

      if (Object.keys(components).includes(expression)) {
        this._x_data = components[expression];
      } else {
        this._x_data = this._x_evaluate(expression);
      }

      this._x_$data = Alpine.observe(this._x_data);
      this._x_dataStack = new Set(this._x_closestDataStack());

      this._x_dataStack.add(this._x_$data);
    }

    let attrs = this._x_attributes();

    attrs.forEach(attr => {
      let noop = () => {};

      let run = Alpine.directives[attr.type] || noop;
      run(this, attr.value, attr.modifiers, attr.expression, Alpine.effect);
    });
  };

  window.Element.prototype._x_initTree = function () {
    walk(this, el => el._x_init());
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

  window.Element.prototype._x_root = function () {
    if (this.hasAttribute('x-data')) return this;
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
        callback();

        if (modifiers.includes('once')) {
          listenerTarget.removeEventListener(event, handler, options);
        }
      };

      if (modifiers.includes('debounce')) {
        let nextModifier = modifiers[modifiers.indexOf('debounce') + 1] || 'invalid-wait';
        let wait = isNumeric$1(nextModifier.split('ms')[0]) ? Number(nextModifier.split('ms')[0]) : 250;
        handler = debounce(handler, wait);
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

      callback();

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

  Alpine$1.directive('transition', (el, value, modifiers, expression, effect) => {
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

  Alpine$1.directive('model', (el, value, modifiers, expression, effect) => {
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

      if (value === undefined && expression.match(/\./)) value = '';

      el._x_bind('value', value);
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

  Alpine$1.directive('init', (el, value, modifiers, expression, effect) => {
    el._x_evaluate(expression, {}, false);
  });

  Alpine$1.directive('text', (el, value, modifiers, expression, effect) => {
    let evaluate = el._x_evaluator(expression);

    effect(() => {
      el.innerText = evaluate();
    });
  });

  Alpine$1.directive('bind', (el, value, modifiers, expression, effect) => {
    let attrName = value;

    let evaluate = el._x_evaluator(expression);

    effect(() => {
      let value = evaluate();

      el._x_bind(attrName, value, modifiers);
    });
  });

  Alpine$1.directive('show', (el, value, modifiers, expression, effect) => {
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

  Alpine$1.directive('for', (el, value, modifiers, expression, effect) => {
    let iteratorNames = parseForExpression(expression);

    let evaluateItems = el._x_evaluator(iteratorNames.items);

    effect(() => {
      loop(el, iteratorNames, evaluateItems);
    });
  });

  function loop(el, iteratorNames, evaluateItems) {
    let templateEl = el;
    let items = evaluateItems();

    let closestParentContext = el._x_closestDataStack(); // As we walk the array, we'll also walk the DOM (updating/creating as we go).


    let currentEl = templateEl;
    items.forEach((item, index) => {
      let iterationScopeVariables = getIterationScopeVariables(iteratorNames, item, index, items);
      let currentKey = index;
      let nextEl = lookAheadForMatchingKeyedElementAndMoveItIfFound(currentEl.nextElementSibling, currentKey); // If we haven't found a matching key, insert the element at the current position.

      if (!nextEl) {
        nextEl = addElementInLoopAfterCurrentEl(templateEl, currentEl);
        let newSet = new Set(closestParentContext);
        newSet.add(Alpine$1.observe(iterationScopeVariables));
        nextEl._x_dataStack = newSet;
        nextEl.__x_for = iterationScopeVariables;

        nextEl._x_initTree();
      }

      {
        // Refresh data
        Object.entries(iterationScopeVariables).forEach(([key, value]) => {
          Array.from(nextEl._x_dataStack).slice(-1)[0][key] = value;
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
    inserted._x_skip_mutation_observer = true;
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

  Alpine$1.directive('ref', (el, value, modifiers, expression, effect) => {
    let root = el._x_root();

    if (!root._x_$refs) root._x_$refs = {};
    root._x_$refs[expression] = el;
  });

  Alpine$1.directive('on', (el, value, modifiers, expression) => {
    let evaluate = el._x_evaluator(expression, {}, false);

    el._x_on(el, value, modifiers, e => {
      evaluate({
        '$event': e
      });
    });
  });

  Alpine$1.magic('nextTick', el => {
    return callback => {
      setTimeout(callback);
    };
  });

  Alpine$1.magic('dispatch', el => {
    return (event, detail = {}) => {
      return el._x_dispatch(event, detail);
    };
  });

  Alpine$1.magic('watch', el => {
    return (key, callback) => {
      let evaluate = el._x_evaluator(key);

      let firstTime = true;
      Alpine$1.effect(() => {
        let value = evaluate(); // This is a hack to force deep reactivity for things like "items.push()"

        let div = document.createElement('div');
        div.dataset.hey = value;
        if (!firstTime) callback(value);
        firstTime = false;
      });
    };
  });

  Alpine$1.magic('root', el => el._x_root());

  Alpine$1.magic('refs', el => el._x_root()._x_$refs || {});

  Alpine$1.magic('el', el => el);

  window.Alpine = Alpine$1;
  /**
   * Start It Up
   */

  if (!window.deferLoadingAlpine) window.deferLoadingAlpine = callback => callback();
  window.deferLoadingAlpine(() => Alpine$1.start());

})));
