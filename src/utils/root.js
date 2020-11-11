
window.Element.prototype._x_root = function() {
    if (this.hasAttribute('x-data')) return this

    return this.parentElement._x_root()
}
