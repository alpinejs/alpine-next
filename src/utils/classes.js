
window.Element.prototype._x_classes = function(classString) {
    let isInvalidType = subject => (typeof subject === 'object' && ! subject instanceof String) || Array.isArray(subject)

    if (isInvalidType(classString)) console.warn('Alpine: class bindings must return a string or a stringable type. Arrays and Objects are no longer supported.')

    // This is to allow short ifs like: :class="show || 'hidden'"
    if (classString === true) classString = ''

    let split = classString => classString.split(' ').filter(Boolean)

    let missingClasses = classString => classString.split(' ').filter(i => ! this.classList.contains(i)).filter(Boolean)

    let addClassesAndReturnUndo = classes => {
        this.classList.add(...classes)

        return () => { this.classList.remove(...classes) }
    }

    return addClassesAndReturnUndo(missingClasses(classString || ''))
}
