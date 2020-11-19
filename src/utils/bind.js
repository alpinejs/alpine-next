
window.Element.prototype._x_bind = function(name, value, modifiers = []) {
    name = modifiers.includes('camel') ? camelCase(name) : name

    switch (name) {
        case 'value':
            bindInputValue(this, value)
            break;

        case 'class':
            bindClasses(this, value)
            break;

        default:
            bindAttribute(this, name, value)
            break;
    }
}

function bindInputValue(el, value) {
    if (el.type === 'radio') {
        // Set radio value from x-bind:value, if no "value" attribute exists.
        // If there are any initial state values, radio will have a correct
        // "checked" value since x-bind:value is processed before x-model.
        if (el.attributes.value === undefined) {
            el.value = value
        }

        // @todo: removed this because getting "attrType" is tough.
        // We'll see what breaks
        if (window.fromModel) {
            el.checked = checkedAttrLooseCompare(el.value, value)
        }
    } else if (el.type === 'checkbox') {
        // If we are explicitly binding a string to the :value, set the string,
        // If the value is a boolean, leave it alone, it will be set to "on"
        // automatically.
        if (typeof value !== 'boolean' && ! [null, undefined].includes(value)) {
            el.value = String(value)
        } else {
            if (Array.isArray(value)) {
                el.checked = value.some(val => checkedAttrLooseCompare(val, el.value))
            } else {
                el.checked = !!value
            }
        }
    } else if (el.tagName === 'SELECT') {
        updateSelect(el, value)
    } else {
        if (el.value === value) return

        el.value = value
    }
}

function bindClasses(el, value) {
    if (el._x_undoAddedClasses) el._x_undoAddedClasses()

    el._x_undoAddedClasses = el._x_classes(value)
}

function bindAttribute(el, name, value) {
    // If an attribute's bound value is null, undefined or false, remove the attribute
    if ([null, undefined, false].includes(value)) {
        el.removeAttribute(name)
    } else {
        isBooleanAttr(name) ? setIfChanged(el, name, name) : setIfChanged(el, name, value)
    }
}

function setIfChanged(el, attrName, value) {
    if (el.getAttribute(attrName) != value) {
        el.setAttribute(attrName, value)
    }
}

function updateSelect(el, value) {
    const arrayWrappedValue = [].concat(value).map(value => { return value + '' })

    Array.from(el.options).forEach(option => {
        option.selected = arrayWrappedValue.includes(option.value || option.text)
    })
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
    ]

    return booleanAttributes.includes(attrName)
}
