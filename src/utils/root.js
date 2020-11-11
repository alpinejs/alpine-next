
window.Element.prototype.root = function() {
    if (this.hasAttribute('x-data')) return this

    return this.parentElement._x_root()
}
