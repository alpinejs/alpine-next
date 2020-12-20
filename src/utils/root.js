
export function root(el) {
    if (el.hasAttribute('x-data') || el.hasAttribute('x-data.append')) return el

    if (! el.parentElement) return

    return root(el.parentElement)
}
