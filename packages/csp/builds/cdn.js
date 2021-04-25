import history from '../src/index.js'

document.addEventListener('alpine:initializing', () => {
    window.Alpine.directive('history', history)
})
