
window.Element.prototype._x_root = function() {
    if (this.hasAttribute('x-data') || this.hasAttribute('x-data.append')) return this

    if (! this.parentElement) return

    return this.parentElement._x_root()
}
