import Alpine from '../alpine'
import scheduler from '../scheduler'

Alpine.directive('cloak', (el) => {
    scheduler.nextTick(() => {
        el.removeAttribute('x-cloak')
    })
})
