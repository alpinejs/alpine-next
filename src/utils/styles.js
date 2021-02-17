
export function setStyles(el, styleObject) {
    let previousStyles = {}

    Object.entries(styleObject).forEach(([key, value]) => {
        previousStyles[key] = el.style[key]

        el.style[key] = value
    })

    setTimeout(() => {
        if (el.style.length === 0) {
            el.removeAttribute('style')
        }
    })

    return () => {
        setStyles(el, previousStyles)
    }
}
