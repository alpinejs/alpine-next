import { reactive } from '@vue/reactivity'
import Alpine from '../alpine'
import { evaluateSync } from '../utils/evaluate'
import { closestDataStack } from '../utils/closest'

document.addEventListener('alpine:initializing', () => {
    document.querySelectorAll('[x-element]').forEach(template => {
        registerElement(template.getAttribute('x-element'), template)
    })
})

function registerElement(name, template) {
    customElements.define(name, class extends HTMLElement {
        constructor() {
            super()

            let props = template.hasAttribute('x-props')
                ? evaluateSync(template, template.getAttribute('x-props'))
                : {}

            this.setAttribute('x-element', name)

            console.log('construct', name)

            this._x_defaultProps = props
            this._x_template = template
        }
    })
}

Alpine.directive('element', (el, value, modifiers, expression, effect) => {
    // We need to do this after Alpine has run through all the "light" dom.
    queueMicrotask(() => {
        console.log('handle x-element', expression)

        let template = el._x_template
        let props = el._x_defaultProps

        let element = createElement(template)

        let injectData = generateInjectDataObject(template, el)

        element._x_dataStack = new Set([generateReactivePropObject(props, el._x_bindings, el), injectData])

        transferAttributes(element, el, props)

        element._x_ignoreMutationObserver = true
        element._x_customElementRoot = true

        el.replaceWith(element)

        Alpine.initTree(element)

        el.removeAttribute('x-element')
        element.setAttribute('x-element', expression)

        element.querySelector('slot')?.replaceWith(...el.childNodes)
    })
})

function generateInjectDataObject(template, el) {
    let reactiveRoot = {}

    if (! template.hasAttribute('x-inject')) return {}

    let injectNames = template.getAttribute('x-inject').split(',').map(i => i.trim())

    injectNames.forEach(injectName => {
        let getClosestProvides = (el, name) => {
            if (! el) return {}

            if (el._x_provides && el._x_provides[injectName] !== undefined) return el._x_provides

            return getClosestProvides(el.parentNode, name)
        }

        let provides = getClosestProvides(el, injectName)

        Object.defineProperty(reactiveRoot, injectName, {
            get() {
                return provides[injectName]
            },
        })
    })

    return reactiveRoot
}

function generateReactivePropObject(props, bindings, el) {
    let reactiveRoot = {}

    Object.entries(props).forEach(([propName, propDefault]) => {
        // If the property was bound on the custom-element with x-bind.
        if (bindings && typeof bindings[propName] !== undefined) {
            Object.defineProperty(reactiveRoot, propName, {
                get() {
                    return bindings[propName]()
                }
            })

            return
        }

        // If the element has the property on itself.
        if (el.hasAttribute(propName)) {
            reactiveRoot[propName] = this.getAttribute(propName)

            return
        }

        reactiveRoot[propName] = propDefault
    })

    return reactiveRoot
}

function transferAttributes(from, to, props) {
    // Exempt props from attribute forwarding
    Object.keys(props).forEach((propName) => {
        if (from.hasAttribute(propName)) from.removeAttribute(propName)
    })

    // Merge classes
    if (from.hasAttribute('class') && to.hasAttribute('class')) {
        let froms = from.getAttribute('class').split(' ').map(i => i.trim())
        let tos = to.getAttribute('class').split(' ').map(i => i.trim())

        from.setAttribute('class', Array.from(new Set([...froms, ...tos])).join(' '))
    }

    Array.from(from.attributes).forEach(attribute => {
        to.setAttribute(attribute.name, attribute.value)
    })
}

function createElement(htmlOrTemplate) {
    if (typeof htmlOrTemplate === 'string') {
        return document.createRange().createContextualFragment(htmlOrTemplate).firstElementChild
    }

    return htmlOrTemplate.content.firstElementChild.cloneNode(true)
}













// function registerElement(name, template) {
//     customElements.define(name, class extends HTMLElement {
//         constructor() {
//             super()

//             let shadow = this.attachShadow({ mode: 'open' })

//             Array.from(template.content.children).forEach(child => {
//                 shadow.append(child.cloneNode(true))
//             })

//             // @todo: totally undecided on this.
//             // this.setAttribute('invisible', true)
//             // this.style.display = 'contents'

//             // This is great and does great things, but breaks flex
//             // this.style.display = 'contents'

//             // The main mutation observer won't pick up changes inside
//             // shadow roots (like els added by x-for).
//             Alpine.listenForAndReactToDomManipulations(this.shadowRoot)

//             Alpine.scheduler.nextTick(() => {
//                 let reactiveRoot = Alpine.reactive({})

//                 let customElementRoot = this

//                 if (template.hasAttribute('x-props')) {
//                     let props = evaluateSync(this.shadowRoot, template.getAttribute('x-props'))

//                     Object.entries(props).forEach(([propName, propDefault]) => {
//                         // If the property was bound on the custom-element with x-bind.
//                         if (this._x_bindings && typeof this._x_bindings[propName] !== undefined) {
//                             Object.defineProperty(reactiveRoot, propName, {
//                                 get() {
//                                     return customElementRoot._x_bindings[propName]()
//                                 }
//                             })

//                             return
//                         }

//                         // If the element has the property on itself.
//                         if (this.hasAttribute(propName)) {
//                             reactiveRoot[propName] = this.getAttribute(propName)

//                             return
//                         }

//                         reactiveRoot[propName] = propDefault
//                     })

//                 }

//                 if (template.hasAttribute('x-inject')) {
//                     let injectNames = template.getAttribute('x-inject').split(',').map(i => i.trim())

//                     injectNames.forEach(injectName => {
//                         let getClosestProvides = (el, name) => {
//                             if (! el) return {}

//                             if (el._x_provides && el._x_provides[injectName] !== undefined) return el._x_provides

//                             return getClosestProvides(el.parentNode, name)
//                         }

//                         // We're gonna cache provides in the outer scope so we don't
//                         // have to crawl up the dom tree every time we want it.
//                         let provides

//                         Object.defineProperty(reactiveRoot, injectName, {
//                             get() {
//                                 if (! provides) {
//                                     provides = getClosestProvides(customElementRoot, injectName)
//                                 }

//                                 return provides[injectName]
//                             },
//                         })
//                     })

//                 }

//                 this.shadowRoot._x_dataStack = new Set(closestDataStack(this.shadowRoot))
//                 this.shadowRoot._x_dataStack.add(Alpine.reactive(reactiveRoot))

//                 Alpine.initTree(shadow)
//             })
//         }
//     })
// }
