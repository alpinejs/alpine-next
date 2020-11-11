
window.Element.prototype._x_classes = function(classString) {
    let split = classString => classString.split(' ').filter(Boolean)

    let missingClasses = classString => classString.split(' ').filter(i => ! this.classList.contains(i)).filter(Boolean)

    let addClassesAndReturnUndo = classes => {
        this.classList.add(...classes)

        return () => { this.classList.remove(...classes) }
    }

    return addClassesAndReturnUndo(missingClasses(classString))
}
