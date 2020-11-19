
window.Element.prototype._x_root = function() {
    if (this.hasAttribute('x-data')) return this

    if (! this.parentElement) return

    return this.parentElement._x_root()
}
