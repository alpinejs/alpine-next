
window.Element.prototype.dispatch = function(event, detail = {}) {
    this.dispatchEvent(new CustomEvent(event, {
        detail,
        bubbles: true,
    }))
}
