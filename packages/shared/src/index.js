import Alpine from 'alpinejs'

export function alpineGlobal() {
    if (isBuildingForCdn()) {
        return window.Alpine
    } else {
        return Alpine
    }
}

export function isBuildingForCdn() {
    if (typeof CDN === 'boolean') return CDN

    return false
}
