import Alpine from '../alpine'

Alpine.magic('dispatch', el => {
    return (event, detail = {}) => {
        return el._x_dispatch(event, detail)
    }
})

window.Element.prototype._x_dispatch = function(event, detail = {}) {
    this.dispatchEvent(new CustomEvent(event, {
        detail,
        bubbles: true,
        // Allows events to pass the shadow DOM barrier.
        composed: true,
    }))
}
