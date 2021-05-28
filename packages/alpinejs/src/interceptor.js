export function initInterceptors(data) {
    let isObject = val => typeof val === 'object' && !Array.isArray(val) && val !== null

    let recurse = (obj, basePath = '') => {
        Object.entries(obj).forEach(([key, value]) => {
            let path = basePath === '' ? key : `${basePath}.${key}`

            if (typeof value === 'function' && value.interceptor) {
                Object.defineProperty(obj, key, value(key, path))
            }

            if (isObject(value)) {
                recurse(value, path)
            }
        })
    }

    return recurse(data)
}

export function interceptor(callback) {
    return initialValue => {
        let parentIniter = () => {}
        let parentSetter = () => {}

        if (typeof initialValue === 'function' && initialValue.interceptor) {
            let parent = initialValue(key, path)

            parentIniter = parent.init
            parentSetter = parent.set
        }

        function func(key, path) {
            let store = initialValue

            let { init: initer, set: setter } = callback(key, path)

            let inited = false

            let setValue = i => store = i
            let reactiveSetValue = function (i) { this[key] = i }

            let setup = (context) => {
                if (inited) return

                parentIniter.bind(context)(store, setValue, reactiveSetValue.bind(context))
                initer.bind(context)(store, setValue, reactiveSetValue.bind(context))

                inited = true
            }

            return {
                get() {
                    setup(this)

                    return store
                },
                set(value) {
                    setup(this)

                    setter.bind(this)(value, setValue, reactiveSetValue.bind(this))

                    parentSetter.bind(this)(store, setValue, reactiveSetValue.bind(this))
                },
                enumerable: true,
                configurable: true,
            }
        }

        func.interceptor = true

        return func
    }
}
