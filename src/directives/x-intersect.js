import Alpine from '../alpine'
import { evaluator } from '../evaluator'

Alpine.directive('intersect', (el, value, modifiers, expression, effect) => {
    let evaluate = evaluator(el, expression, {}, false)

    if (['in', 'leave'].includes(value)) {
        el._x_intersectLeave(evaluate, modifiers)
    } else {
        el._x_intersectEnter(evaluate, modifiers)
    }
})

window.Element.prototype._x_intersectEnter = function (callback, modifiers) {
    this._x_intersect((entry, observer) => {
        if (entry.intersectionRatio > 0) {
            callback()

            modifiers.includes('once') && observer.unobserve(this)
        }
    })
}

window.Element.prototype._x_intersectLeave = function (callback, modifiers) {
    this._x_intersect((entry, observer) => {
        if (! entry.intersectionRatio > 0) {
            callback()

            modifiers.includes('once') && observer.unobserve(this)
        }
    })
}

window.Element.prototype._x_intersect = function (callback) {
    let observer = new IntersectionObserver(entries => {
        entries.forEach(entry => callback(entry, observer))
    })

    observer.observe(this);

    return observer
}
