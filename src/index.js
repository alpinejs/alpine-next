
import Alpine from './alpine'

window.Alpine = Alpine

/**
 * Define Element Prototype Overrides
 */
import './prototype'

/**
 * Register Directives
 */
import './directives/x-transition'
import './directives/x-model'
import './directives/x-cloak'
import './directives/x-init'
import './directives/x-text'
import './directives/x-bind'
import './directives/x-show'
import './directives/x-for'
import './directives/x-ref'
import './directives/x-on'

/**
 * Register Magics
 */
import './magics/nextTick'
import './magics/dispatch'
import './magics/watch'
import './magics/root'
import './magics/refs'
import './magics/el'

/**
 * Start it up!
 */
if (! window.deferLoadingAlpine) window.deferLoadingAlpine = callback => callback()

window.deferLoadingAlpine(() => Alpine.start())
