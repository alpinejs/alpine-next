import hyperactiv from 'hyperactiv'

let Alpine = {
    observe: hyperactiv.observe,

    effect: hyperactiv.computed,

    directives: {},

    magics: {},

    components: {},

    directive(name, callback) {
        this.directives[name] = callback
    },

    magic(name, callback) {
        this.magics[name] = callback
    },

    component(name, callback) {
        this.components[name] = callback
    },

    getElementMagics(el) {
        let magics = {}

        Object.entries(this.magics).forEach(([name, callback]) => {
            Object.defineProperty(magics, `$${name}`, {
                get() { return callback(el) },
                enumerable: true,
            })
        })

        return magics
    },

    clonedComponentAccessor() {
        let components = {}

        Object.entries(this.components).forEach(([name, componentObject]) => {
            Object.defineProperty(components, name, {
                get() { return {...componentObject} },
                enumerable: true,
            })
        })

        return components
    },

    start() {
        window.dispatchEvent(new CustomEvent('alpine:loading'), { bubbles: true })

        document.querySelectorAll('[x-data]').forEach(el => {
            el._x_initChunk()
        })

        window.dispatchEvent(new CustomEvent('alpine:loaded'), { bubbles: true })

        this.listenForNewDomElementsToInitialize()
    },

    listenForNewDomElementsToInitialize() {
        let observer = new MutationObserver(mutations => {
            for(let mutation of mutations) {
                if (mutation.type !== 'childList') return

                for(let node of mutation.addedNodes) {
                    if (node.nodeType !== 1 || node._x_skip_mutation_observer) return

                    node._x_initChunk()
                }
            }
        })

        observer.observe(document.querySelector('body'), { subtree: true, childList: true })
    },
}

export default Alpine
