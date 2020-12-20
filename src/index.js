
import Alpine from './alpine'

/**
 * Register Directives
 */
import './directives/x-transition'
import './directives/x-intersect'
import './directives/x-spread'
import './directives/x-model'
import './directives/x-cloak'
import './directives/x-morph'
import './directives/x-watch'
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
import './magics/$nextTick'
import './magics/$dispatch'
import './magics/$ignore'
import './magics/$watch'
import './magics/$morph'
import './magics/$root'
import './magics/$refs'
import './magics/$get'
import './magics/$el'

/**
 * Start It Up
 */
window.Alpine = Alpine

Alpine.start()
