
import Alpine from './alpine'

window.Alpine = Alpine

/**
 * Register Element Prototype Utilities
 */
import './utils/attributes'
import './utils/intersect'
import './utils/evaluate'
import './utils/dispatch'
import './utils/classes'
import './utils/focus'
import './utils/root'
import './utils/bind'
import './utils/on'

/**
 * Register Directives
 */
import './directives/x-transition'
import './directives/x-intersect'
import './directives/x-spread'
import './directives/x-model'
import './directives/x-cloak'
import './directives/x-init'
import './directives/x-text'
import './directives/x-bind'
import './directives/x-data'
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
 * Start It Up
 */
if (! window.deferLoadingAlpine) window.deferLoadingAlpine = callback => callback()

window.deferLoadingAlpine(() => Alpine.start())
