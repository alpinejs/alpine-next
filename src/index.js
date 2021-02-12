
import Alpine from './alpine'

/**
 * Register Directives
 */
import './directives/x-transition'
// import './directives/x-intersect'
// import './directives/x-element'
// import './directives/x-provide'
// import './directives/x-destroy'
// import './directives/x-scope'
import './directives/x-model'
import './directives/x-cloak'
// import './directives/x-morph'
import './directives/x-watch'
import './directives/x-init'
import './directives/x-text'
import './directives/x-bind'
import './directives/x-data'
import './directives/x-show'
import './directives/x-for'
import './directives/x-ref'
import './directives/x-if'
import './directives/x-on'

/**
 * Register Magics
 */
import './magics/$nextTick'
import './magics/$dispatch'
import './magics/$watch'
import './magics/$store'
// import './magics/$morph'
import './magics/$root'
import './magics/$refs'
import './magics/$el'

/**
 * Start It Up
 */
window.Alpine = Alpine

Alpine.start()
