import { warn } from './warn'

export function setClasses(el, classString) {
    let isInvalidType = subject => (typeof subject === 'object' && ! subject instanceof String) || Array.isArray(subject)

    if (isInvalidType(classString)) warn('class bindings must return a string or a stringable type. Arrays and Objects are no longer supported.')

    // This is to allow short ifs like: :class="show || 'hidden'"
    if (classString === true) classString = ''

    let split = classString => classString.split(' ').filter(Boolean)

    let missingClasses = classString => classString.split(' ').filter(i => ! el.classList.contains(i)).filter(Boolean)

    let addClassesAndReturnUndo = classes => {
        el.classList.add(...classes)

        return () => { el.classList.remove(...classes) }
    }

    return addClassesAndReturnUndo(missingClasses(classString || ''))
}

export function toggleClasses(el, classObject) {
    let split = classString => classString.split(' ').filter(Boolean)

    let forAdd = Object.entries(classObject).flatMap(([classString, bool]) => bool ? split(classString) : false).filter(Boolean)
    let forRemove = Object.entries(classObject).flatMap(([classString, bool]) => ! bool ? split(classString) : false).filter(Boolean)

    let added = []
    let removed = []

    forAdd.forEach(i => {
        if (! el.classList.contains(i)) {
            el.classList.add(i)
            added.push(i)
        }
    })

    forRemove.forEach(i => {
        if (el.classList.contains(i)) {
            el.classList.remove(i)
            removed.push(i)
        }
    })

    return () => {
        added.forEach(i => el.classList.remove(i))
        removed.forEach(i => el.classList.add(i))
    }
}
