export function history(Alpine) {
    Alpine.magic('history', (el, { Alpine }) =>  {
        return Alpine.interceptor((key, path) => {
            let pause = false

            return {
                init(initialValue, set, reactiveSet) {
                    let value = initialValue
                    let url = new URL(window.location.href)

                    if (url.searchParams.has(path)) {
                        set(url.searchParams.get(path))
                        value = url.searchParams.get(path)
                    }

                    let object = { value }

                    url.searchParams.set(path, value)

                    replace(url.toString(), path, object)

                    window.addEventListener('popstate', (e) => {
                        if (! e.state) return
                        if (! e.state.alpine) return

                        Object.entries(e.state.alpine).forEach(([newKey, { value }]) => {
                            if (newKey !== key) return

                            pause = true

                            reactiveSet(value)

                            pause = false
                        })
                    })
                },
                set(value, set) {
                    set(value)

                    if (pause) return

                    let object = { value }

                    let url = new URL(window.location.href)

                    url.searchParams.set(path, value)

                    push(url.toString(), path, object)
                },
            }
        })
    })
}

function replace(url, key, object) {
    let state = window.history.state || {}

    if (! state.alpine) state.alpine = {}

    state.alpine[key] = object

    window.history.replaceState(state, '', url)
}

function push(url, key, object) {
    let state = { alpine: {...window.history.state.alpine, ...{[key]: object}} }

    window.history.pushState(state, '', url)
}
