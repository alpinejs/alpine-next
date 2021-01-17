import { reactive } from '@vue/reactivity'
import Alpine from '../alpine'
import { evaluateSync } from '../utils/evaluate'
import { closestDataStack } from '../utils/closest'

document.addEventListener('alpine:initialized', () => {
    document.querySelectorAll('[x-element]').forEach(template => {
        registerElement(template.getAttribute('x-element'), template)
    })
})

function registerElement(name, template) {
    customElements.define(name, class extends HTMLElement {
        constructor() {
            super()

            let shadow = this.attachShadow({ mode: 'open' })

            Array.from(template.content.children).forEach(child => {
                shadow.append(child.cloneNode(true))
            })

            // @todo: totally undecided on this.
            // this.setAttribute('invisible', true)
            // this.style.display = 'contents'

            // This is great and does great things, but breaks flex
            // this.style.display = 'contents'

            // The main mutation observer won't pick up changes inside
            // shadow roots (like els added by x-for).
            Alpine.listenForAndReactToDomManipulations(this.shadowRoot)

            Alpine.scheduler.nextTick(() => {
                let reactiveRoot = Alpine.reactive({})

                let customElementRoot = this

                if (template.hasAttribute('x-props')) {
                    let props = evaluateSync(this.shadowRoot, template.getAttribute('x-props'))

                    Object.entries(props).forEach(([propName, propDefault]) => {
                        // If the property was bound on the custom-element with x-bind.
                        if (this._x_bindings && typeof this._x_bindings[propName] !== undefined) {
                            Object.defineProperty(reactiveRoot, propName, {
                                get() {
                                    return customElementRoot._x_bindings[propName]()
                                }
                            })

                            return
                        }

                        // If the element has the property on itself.
                        if (this.hasAttribute(propName)) {
                            reactiveRoot[propName] = this.getAttribute(propName)

                            return
                        }

                        reactiveRoot[propName] = propDefault
                    })

                }

                if (template.hasAttribute('x-inject')) {
                    let injectNames = template.getAttribute('x-inject').split(',').map(i => i.trim())

                    injectNames.forEach(injectName => {
                        let getClosestProvides = (el, name) => {
                            if (! el) return {}

                            if (el._x_provides && el._x_provides[injectName] !== undefined) return el._x_provides

                            return getClosestProvides(el.parentNode, name)
                        }

                        // We're gonna cache provides in the outer scope so we don't
                        // have to crawl up the dom tree every time we want it.
                        let provides

                        Object.defineProperty(reactiveRoot, injectName, {
                            get() {
                                if (! provides) {
                                    provides = getClosestProvides(customElementRoot, injectName)
                                }

                                return provides[injectName]
                            },
                        })
                    })

                }

                this.shadowRoot._x_dataStack = new Set(closestDataStack(this.shadowRoot))
                this.shadowRoot._x_dataStack.add(Alpine.reactive(reactiveRoot))

                Alpine.initTree(shadow)
            })
        }
    })
}


function createElement(htmlOrTemplate) {
    if (typeof htmlOrTemplate === 'string') {
        return document.createRange().createContextualFragment(htmlOrTemplate).firstElementChild
    }

    return htmlOrTemplate.content.firstElementChild.cloneNode(true)
}
