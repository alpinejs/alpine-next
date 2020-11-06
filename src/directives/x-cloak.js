import Alpine from '../alpine'

Alpine.directive('cloak', (el) => {
    el.removeAttribute('x-cloak')
})
