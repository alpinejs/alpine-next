import Alpine from './csp-module'

window.Alpine = Alpine

queueMicrotask(() => {
    Alpine.start()
})
