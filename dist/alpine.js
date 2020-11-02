(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
    factory();
}((function () { 'use strict';

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

    var data$1 = (el, value, modifiers, expression) => {
        expression = expression === '' ? '{}' : expression;

        el.__x__data = el.__x__evaluate(expression);
        el.__x__$data = hyperactiv.observe(el.__x__data);
        el.__x__dataStack = new Set(el.__x__closestDataStack());
        el.__x__dataStack.add(el.__x__$data);
    };

    var init = (el, value, modifiers, expression) => {
        el.__x__evaluate(expression);
    };

    var text = (el, value, modifiers, expression, reactive) => {
        let evaluate = el.__x__getEvaluator(expression);

        reactive(() => {
            el.innerText = evaluate();
        });
    };

    var bind = (el, value, modifiers, expression, reactive) => {
        let attrName = value;
        let evaluate = el.__x__getEvaluator(expression);

        reactive(() => {
            let value = evaluate();

            attrName = modifiers.includes('camel') ? camelCase(attrName) : attrName;

            el.__x__bind(attrName, value);
        });
    };

    function bind$1(name, value) {
        switch (name) {
            case 'value':
                bindInputValue(this, value);
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
            if (typeof value !== 'boolean' && ! [null, undefined].includes(value)) {
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
            if (el.value === value) return

            el.value = value;
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
        const arrayWrappedValue = [].concat(value).map(value => { return value + '' });

        Array.from(el.options).forEach(option => {
            option.selected = arrayWrappedValue.includes(option.value || option.text);
        });
    }

    function camelCase(subject) {
        return subject.toLowerCase().replace(/-(\w)/g, (match, char) => char.toUpperCase())
    }

    function checkedAttrLooseCompare(valueA, valueB) {
        return valueA == valueB
    }

    function isBooleanAttr(attrName) {
        // As per HTML spec table https://html.spec.whatwg.org/multipage/indices.html#attributes-3:boolean-attribute
        // Array roughly ordered by estimated usage
        const booleanAttributes = [
            'disabled','checked','required','readonly','hidden','open', 'selected',
            'autofocus', 'itemscope', 'multiple', 'novalidate','allowfullscreen',
            'allowpaymentrequest', 'formnovalidate', 'autoplay', 'controls', 'loop',
            'muted', 'playsinline', 'default', 'ismap', 'reversed', 'async', 'defer',
            'nomodule'
        ];

        return booleanAttributes.includes(attrName)
    }

    var model = (el, value, modifiers, expression, reactive) => {
        let evaluate = el.__x__getEvaluator(expression);
        let assignmentExpression = `${expression} = rightSideOfExpression($event, ${expression})`;
        let evaluateAssignment = el.__x__getEvaluator(assignmentExpression);

        // If the element we are binding to is a select, a radio, or checkbox
        // we'll listen for the change event instead of the "input" event.
        var event = (el.tagName.toLowerCase() === 'select')
            || ['checkbox', 'radio'].includes(el.type)
            || modifiers.includes('lazy')
                ? 'change' : 'input';

        let assigmentFunction = generateAssignmentFunction(el, modifiers, expression);

        el.__x__on(el, event, modifiers, (e) => {
            evaluateAssignment({
                '$event': e,
                rightSideOfExpression: assigmentFunction
            });
        });

        reactive(() => {
            let value = evaluate();

            // If nested model key is undefined, set the default value to empty string.
            if (value === undefined && expression.match(/\./)) value = '';

            el.__x__bind('value', value);
        });
    };

    function generateAssignmentFunction(el, modifiers, expression) {
        if (el.type === 'radio') {
            // Radio buttons only work properly when they share a name attribute.
            // People might assume we take care of that for them, because
            // they already set a shared "x-model" attribute.
            if (! el.hasAttribute('name')) el.setAttribute('name', expression);
        }

        return (event, currentValue) => {
            // Check for event.detail due to an issue where IE11 handles other events as a CustomEvent.
            if (event instanceof CustomEvent && event.detail) {
                return event.detail
            } else if (el.type === 'checkbox') {
                // If the data we are binding to is an array, toggle its value inside the array.
                if (Array.isArray(currentValue)) {
                    let newValue = modifiers.includes('number') ? safeParseNumber(event.target.value) : event.target.value;
                    return event.target.checked ? currentValue.concat([newValue]) : currentValue.filter(el => !checkedAttrLooseCompare$1(el, newValue))
                } else {
                    return event.target.checked
                }
            } else if (el.tagName.toLowerCase() === 'select' && el.multiple) {
                return modifiers.includes('number')
                    ? Array.from(event.target.selectedOptions).map(option => {
                        let rawValue = option.value || option.text;
                        return safeParseNumber(rawValue)
                    })
                    : Array.from(event.target.selectedOptions).map(option => {
                        return option.value || option.text
                    })
            } else {
                let rawValue = event.target.value;
                return modifiers.includes('number')
                    ? safeParseNumber(rawValue)
                    : (modifiers.includes('trim') ? rawValue.trim() : rawValue)
            }
        }
    }


    function safeParseNumber(rawValue) {
        let number = rawValue ? parseFloat(rawValue) : null;
        return isNumeric(number) ? number : rawValue
    }

    function checkedAttrLooseCompare$1(valueA, valueB) {
        return valueA == valueB
    }

    var on = (el, value, modifiers, expression) => {
        let evaluate = el.__x__getEvaluator(expression);

        el.__x__on(el, value, modifiers, e => {
            evaluate({
                '$event': e
            });
        });
    };

    function on$1(el, event, modifiers, callback) {
        let target = modifiers.includes('window') ? window : el;

        target.addEventListener(event, callback);
    }

    var directives = {
        data: data$1,
        init,
        bind,
        model,
        text,
        on,
    };

    function getAttrs() {
        let directives = Array.from(this.attributes).filter(isXAttr).map(parseHtmlAttribute);

        return sortDirectives(directives)
    }

    let xAttrRE = /^x-([^:]+)\b/;

    function isXAttr(attr) {
        const name = replaceAtAndColonWithStandardSyntax(attr.name);

        return xAttrRE.test(name)
    }

    function sortDirectives(directives) {
        let directiveOrder = ['data', 'init', 'for', 'bind', 'model', 'show', 'catch-all'];

        return directives.sort((a, b) => {
            let typeA = directiveOrder.indexOf(a.type) === -1 ? 'catch-all' : a.type;
            let typeB = directiveOrder.indexOf(b.type) === -1 ? 'catch-all' : b.type;

            return directiveOrder.indexOf(typeA) - directiveOrder.indexOf(typeB)
        })
    }

    function parseHtmlAttribute({ name, value }) {
        const normalizedName = replaceAtAndColonWithStandardSyntax(name);

        const typeMatch = normalizedName.match(xAttrRE);
        const valueMatch = normalizedName.match(/:([a-zA-Z0-9\-:]+)/);
        const modifiers = normalizedName.match(/\.[^.\]]+(?=[^\]]*$)/g) || [];

        return {
            type: typeMatch ? typeMatch[1] : null,
            value: valueMatch ? valueMatch[1] : null,
            modifiers: modifiers.map(i => i.replace('.', '')),
            expression: value,
        }
    }

    function replaceAtAndColonWithStandardSyntax(name) {
        if (name.startsWith('@')) {
            return name.replace('@', 'x-on:')
        } else if (name.startsWith(':')) {
            return name.replace(':', 'x-bind:')
        }

        return name
    }

    function init$1() {
        let attrs = this.__x__getAttrs();

        attrs.forEach(attr => {
            let noop = () => {};
            let run = this.__x__directives[attr.type] || noop;

            run(this, attr.value, attr.modifiers, attr.expression, hyperactiv.computed);
        });
    }

    function show() {
        if (el.style.display === 'none' || el.__x_transition) {
            transitionIn(this, () => {
                show();
            });
        }
    }

    function hide() {
        if (el.style.display !== 'none') {
            transitionOut(this, () => {
                hide();
            });
        }
    }

    function convertClassStringToArray(classList, filterFn = Boolean) {
        return classList.split(' ').filter(filterFn)
    }

    const TRANSITION_TYPE_IN = 'in';
    const TRANSITION_TYPE_OUT = 'out';
    const TRANSITION_CANCELLED = 'cancelled';

    function transitionIn(el, show, reject, component, forceSkip = false) {
        // We don't want to transition on the initial page load.
        if (forceSkip) return show()

        if (el.__x_transition && el.__x_transition.type === TRANSITION_TYPE_IN) {
            // there is already a similar transition going on, this was probably triggered by
            // a change in a different property, let's just leave the previous one doing its job
            return
        }

        const attrs = getXAttrs(el, component, 'transition');
        const showAttr = getXAttrs(el, component, 'show')[0];

        // If this is triggered by a x-show.transition.
        if (showAttr && showAttr.modifiers.includes('transition')) {
            let modifiers = showAttr.modifiers;

            // If x-show.transition.out, we'll skip the "in" transition.
            if (modifiers.includes('out') && ! modifiers.includes('in')) return show()

            const settingBothSidesOfTransition = modifiers.includes('in') && modifiers.includes('out');

            // If x-show.transition.in...out... only use "in" related modifiers for this transition.
            modifiers = settingBothSidesOfTransition
                ? modifiers.filter((i, index) => index < modifiers.indexOf('out')) : modifiers;

            transitionHelperIn(el, modifiers, show, reject);
        // Otherwise, we can assume x-transition:enter.
        } else if (attrs.some(attr => ['enter', 'enter-start', 'enter-end'].includes(attr.value))) {
            transitionClassesIn(el, component, attrs, show, reject);
        } else {
        // If neither, just show that damn thing.
            show();
        }
    }

    function transitionOut(el, hide, reject, component, forceSkip = false) {
        // We don't want to transition on the initial page load.
        if (forceSkip) return hide()

        if (el.__x_transition && el.__x_transition.type === TRANSITION_TYPE_OUT) {
            // there is already a similar transition going on, this was probably triggered by
            // a change in a different property, let's just leave the previous one doing its job
            return
        }

        const attrs = getXAttrs(el, component, 'transition');
        const showAttr = getXAttrs(el, component, 'show')[0];

        if (showAttr && showAttr.modifiers.includes('transition')) {
            let modifiers = showAttr.modifiers;

            if (modifiers.includes('in') && ! modifiers.includes('out')) return hide()

            const settingBothSidesOfTransition = modifiers.includes('in') && modifiers.includes('out');

            modifiers = settingBothSidesOfTransition
                ? modifiers.filter((i, index) => index > modifiers.indexOf('out')) : modifiers;

            transitionHelperOut(el, modifiers, settingBothSidesOfTransition, hide, reject);
        } else if (attrs.some(attr => ['leave', 'leave-start', 'leave-end'].includes(attr.value))) {
            transitionClassesOut(el, component, attrs, hide, reject);
        } else {
            hide();
        }
    }

    function transitionHelperIn(el, modifiers, showCallback, reject) {
        // Default values inspired by: https://material.io/design/motion/speed.html#duration
        const styleValues = {
            duration: modifierValue(modifiers, 'duration', 150),
            origin: modifierValue(modifiers, 'origin', 'center'),
            first: {
                opacity: 0,
                scale: modifierValue(modifiers, 'scale', 95),
            },
            second: {
                opacity: 1,
                scale: 100,
            },
        };

        transitionHelper(el, modifiers, showCallback, () => {}, reject, styleValues, TRANSITION_TYPE_IN);
    }

    function transitionHelperOut(el, modifiers, settingBothSidesOfTransition, hideCallback, reject) {
        // Make the "out" transition .5x slower than the "in". (Visually better)
        // HOWEVER, if they explicitly set a duration for the "out" transition,
        // use that.
        const duration = settingBothSidesOfTransition
            ? modifierValue(modifiers, 'duration', 150)
            : modifierValue(modifiers, 'duration', 150) / 2;

        const styleValues = {
            duration: duration,
            origin: modifierValue(modifiers, 'origin', 'center'),
            first: {
                opacity: 1,
                scale: 100,
            },
            second: {
                opacity: 0,
                scale: modifierValue(modifiers, 'scale', 95),
            },
        };

        transitionHelper(el, modifiers, () => {}, hideCallback, reject, styleValues, TRANSITION_TYPE_OUT);
    }

    function modifierValue(modifiers, key, fallback) {
        // If the modifier isn't present, use the default.
        if (modifiers.indexOf(key) === -1) return fallback

        // If it IS present, grab the value after it: x-show.transition.duration.500ms
        const rawValue = modifiers[modifiers.indexOf(key) + 1];

        if (! rawValue) return fallback

        if (key === 'scale') {
            // Check if the very next value is NOT a number and return the fallback.
            // If x-show.transition.scale, we'll use the default scale value.
            // That is how a user opts out of the opacity transition.
            if (! isNumeric(rawValue)) return fallback
        }

        if (key === 'duration') {
            // Support x-show.transition.duration.500ms && duration.500
            let match = rawValue.match(/([0-9]+)ms/);
            if (match) return match[1]
        }

        if (key === 'origin') {
            // Support chaining origin directions: x-show.transition.top.right
            if (['top', 'right', 'left', 'center', 'bottom'].includes(modifiers[modifiers.indexOf(key) + 2])) {
                return [rawValue, modifiers[modifiers.indexOf(key) + 2]].join(' ')
            }
        }

        return rawValue
    }

    function transitionHelper(el, modifiers, hook1, hook2, reject, styleValues, type) {
        // clear the previous transition if exists to avoid caching the wrong styles
        if (el.__x_transition) {
            el.__x_transition.cancel && el.__x_transition.cancel();
        }

        // If the user set these style values, we'll put them back when we're done with them.
        const opacityCache = el.style.opacity;
        const transformCache = el.style.transform;
        const transformOriginCache = el.style.transformOrigin;

        // If no modifiers are present: x-show.transition, we'll default to both opacity and scale.
        const noModifiers = ! modifiers.includes('opacity') && ! modifiers.includes('scale');
        const transitionOpacity = noModifiers || modifiers.includes('opacity');
        const transitionScale = noModifiers || modifiers.includes('scale');

        // These are the explicit stages of a transition (same stages for in and for out).
        // This way you can get a birds eye view of the hooks, and the differences
        // between them.
        const stages = {
            start() {
                if (transitionOpacity) el.style.opacity = styleValues.first.opacity;
                if (transitionScale) el.style.transform = `scale(${styleValues.first.scale / 100})`;
            },
            during() {
                if (transitionScale) el.style.transformOrigin = styleValues.origin;
                el.style.transitionProperty = [(transitionOpacity ? `opacity` : ``), (transitionScale ? `transform` : ``)].join(' ').trim();
                el.style.transitionDuration = `${styleValues.duration / 1000}s`;
                el.style.transitionTimingFunction = `cubic-bezier(0.4, 0.0, 0.2, 1)`;
            },
            show() {
                hook1();
            },
            end() {
                if (transitionOpacity) el.style.opacity = styleValues.second.opacity;
                if (transitionScale) el.style.transform = `scale(${styleValues.second.scale / 100})`;
            },
            hide() {
                hook2();
            },
            cleanup() {
                if (transitionOpacity) el.style.opacity = opacityCache;
                if (transitionScale) el.style.transform = transformCache;
                if (transitionScale) el.style.transformOrigin = transformOriginCache;
                el.style.transitionProperty = null;
                el.style.transitionDuration = null;
                el.style.transitionTimingFunction = null;
            },
        };

        transition(el, stages, type, reject);
    }

    function transitionClassesIn(el, component, directives, showCallback, reject) {
        const enter = convertClassStringToArray(ensureStringExpression((directives.find(i => i.value === 'enter') || { expression: '' }).expression, el, component));
        const enterStart = convertClassStringToArray(ensureStringExpression((directives.find(i => i.value === 'enter-start') || { expression: '' }).expression, el, component));
        const enterEnd = convertClassStringToArray(ensureStringExpression((directives.find(i => i.value === 'enter-end') || { expression: '' }).expression, el, component));

        transitionClasses(el, enter, enterStart, enterEnd, showCallback, () => {}, TRANSITION_TYPE_IN, reject);
    }

    function transitionClassesOut(el, component, directives, hideCallback, reject) {
        const leave = convertClassStringToArray(ensureStringExpression((directives.find(i => i.value === 'leave') || { expression: '' }).expression, el, component));
        const leaveStart = convertClassStringToArray(ensureStringExpression((directives.find(i => i.value === 'leave-start') || { expression: '' }).expression, el, component));
        const leaveEnd = convertClassStringToArray(ensureStringExpression((directives.find(i => i.value === 'leave-end') || { expression: '' }).expression, el, component));

        transitionClasses(el, leave, leaveStart, leaveEnd, () => {}, hideCallback, TRANSITION_TYPE_OUT, reject);
    }

    function transitionClasses(el, classesDuring, classesStart, classesEnd, hook1, hook2, type, reject) {
        // clear the previous transition if exists to avoid caching the wrong classes
        if (el.__x_transition) {
            el.__x_transition.cancel && el.__x_transition.cancel();
        }

        const originalClasses = el.__x_original_classes || [];

        const stages = {
            start() {
                el.classList.add(...classesStart);
            },
            during() {
                el.classList.add(...classesDuring);
            },
            show() {
                hook1();
            },
            end() {
                // Don't remove classes that were in the original class attribute.
                el.classList.remove(...classesStart.filter(i => !originalClasses.includes(i)));
                el.classList.add(...classesEnd);
            },
            hide() {
                hook2();
            },
            cleanup() {
                el.classList.remove(...classesDuring.filter(i => !originalClasses.includes(i)));
                el.classList.remove(...classesEnd.filter(i => !originalClasses.includes(i)));
            },
        };

        transition(el, stages, type, reject);
    }

    function transition(el, stages, type, reject) {
        const finish = once(() => {
            stages.hide();

            // Adding an "isConnected" check, in case the callback
            // removed the element from the DOM.
            if (el.isConnected) {
                stages.cleanup();
            }

            delete el.__x_transition;
        });

        el.__x_transition = {
            // Set transition type so we can avoid clearing transition if the direction is the same
           type: type,
            // create a callback for the last stages of the transition so we can call it
            // from different point and early terminate it. Once will ensure that function
            // is only called one time.
            cancel: once(() => {
                reject(TRANSITION_CANCELLED);

                finish();
            }),
            finish,
            // This store the next animation frame so we can cancel it
            nextFrame: null
        };

        stages.start();
        stages.during();

        el.__x_transition.nextFrame = requestAnimationFrame(() => {
            // Note: Safari's transitionDuration property will list out comma separated transition durations
            // for every single transition property. Let's grab the first one and call it a day.
            let duration = Number(getComputedStyle(el).transitionDuration.replace(/,.*/, '').replace('s', '')) * 1000;

            if (duration === 0) {
                duration = Number(getComputedStyle(el).animationDuration.replace('s', '')) * 1000;
            }

            stages.show();

            el.__x_transition.nextFrame = requestAnimationFrame(() => {
                stages.end();

                setTimeout(el.__x_transition.finish, duration);
            });
        });
    }

    /**
     * Extend DOM with Alpine functionality.
     */
    window.Element.prototype.__x__directives = directives;
    window.Element.prototype.__x__getAttrs = getAttrs;
    window.Element.prototype.__x__init = init$1;
    window.Element.prototype.__x__bind = bind$1;
    window.Element.prototype.__x__on = on$1;
    window.Element.prototype.__x__show = show;
    window.Element.prototype.__x__hide = hide;
    window.Element.prototype.__x__initChunk = function () {
        walk(this, el => {
            el.__x__init();
        });
    };

    window.Element.prototype.__x__getEvaluator = function (expression) {
        let dataStack = this.__x__closestDataStack();
        let reversedDataStack = Array.from(dataStack).concat([{'$el': this}]).reverse();

        let names = reversedDataStack.map((data, index) => `$data${index}`);

        let namesWithPlaceholder = ['$dataPlaceholder'].concat(names);

        let withExpression = namesWithPlaceholder.reduce((carry, current) => { return `with (${current}) { ${carry} }` }, `__x__result = ${expression}`);

        let namesWithPlaceholderAndDefault = names.concat(['$dataPlaceholder = {}']);

        let evaluator = new Function(namesWithPlaceholderAndDefault, `var __x__result; ${withExpression}; return __x__result`);

        return evaluator.bind(null, ...reversedDataStack)
    };

    window.Element.prototype.__x__evaluate = function (expression, extras = {}) {
        return this.__x__getEvaluator(expression)(extras)
    };

    window.Element.prototype.__x__closestDataStack = function () {
        if (this.__x__dataStack) return this.__x__dataStack

        if (! this.parentElement) return new Set

        return this.parentElement.__x__closestDataStack()
    };

    function walk(el, callback, forceFirst = true) {
        if (! forceFirst && (el.hasAttribute('x-data') || el.__x_for)) return

        callback(el);

        let node = el.firstElementChild;

        while (node) {
            walk(node, callback, false);

            node = node.nextElementSibling;
        }
    }

    /**
     * Define Alpine boot logic.
     */
    function start() {
        document.querySelectorAll('[x-data]').forEach(el => {
            el.__x__initChunk();
        });
    }

    /**
     * Boot Alpine (or defer).
     */
    if (window.deferLoadingAlpine) {
        window.deferLoadingAlpine(() => {
            start();
        });
    } else {
        start();
    }

})));
