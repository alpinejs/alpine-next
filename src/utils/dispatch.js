
window.Element.prototype._x_dispatch = function(event, detail = {}) {
    this.dispatchEvent(new CustomEvent(event, {
        detail,
        bubbles: true,
    }))
}
