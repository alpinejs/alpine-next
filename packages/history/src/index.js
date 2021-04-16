import Alpine from 'alpinejs'

export default function (el, { expression }) {
    let getValue = Alpine.evaluateLater(el, expression)

    alert('hey')
    track(
        expression,
        (setMeta) => {
            setMeta('foo', 'bar')
            let result; getValue(value => result = value); return result;
        },
        (value, getMeta) => {
            Alpine.evaluate(el, `${expression} = value`, { scope: { 'value': value } })
        },
    )
}

function track(key, getter, setter) {
    let url = new URL(window.location.href)

    if (url.searchParams.has(key)) {
        setter(url.searchParams.get(key), () => {})
    }

    let pause = false

    let firstTime = true

    window.effect(() => {
        let meta = {}

        let setMeta = (key, value) => meta[key] = value

        let value = getter(setMeta)

        if (pause) return

        let object = { value, meta }

        let url = new URL(window.location.href)

        url.searchParams.set(key, value)

        if (firstTime) {
            replace(url.toString(), key, object)
        } else {
            push(url.toString(), key, object)
        }

        firstTime = false
    })

    window.addEventListener('popstate', (e) => {
        if (! e.state) return
        if (! e.state.alpine) return

        Object.entries(e.state.alpine).forEach(([newKey, { value, meta }]) => {
            if (newKey !== key) return

            pause = true

            let getMeta = key => meta[key]

            setter(value, getMeta)

            pause = false
        })
    })
}

function replace(url, key, object) {
    let state = history.state || {}

    if (! state.alpine) state.alpine = {}

    state.alpine[key] = object

    history.replaceState(state, '', url)
}

function push(url, key, object) {
    let state = { alpine: {...history.state.alpine, ...{[key]: object}} }

    history.pushState(state, '', url)
}
