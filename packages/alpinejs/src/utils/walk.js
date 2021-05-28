export function asyncWalk(el, callback) {
    return new Promise(resolve => {
        callback(el, () => {
            let promises = []

            let node = el.firstElementChild

            while (node) {
                promises.push(walk(node, callback))

                node = node.nextElementSibling
            }

            Promise.all(promises).then(() => {
                resolve()
            })
        })

    })
}

export function walk(el, callback) {
    if (el instanceof DocumentFragment) {
        Array.from(el.children).forEach(el => walk(el, callback))

        return
    }

    if (el instanceof ShadowRoot) {
        Array.from(el.children).forEach(el => walk(el, callback))

        return
    }

    callback(el, () => {
        let node = el.firstElementChild

        while (node) {
            walk(node, callback)

            node = node.nextElementSibling
        }
    })
}
