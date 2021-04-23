
export function alpineGlobal() {
    if (isBuildingForCdn()) {
        return window.Alpine
    } else {
        return import('alpinejs')
    }
}

export function isBuildingForCdn() {
    if (typeof CDN === 'boolean') return CDN

    return false
}
