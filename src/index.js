import Alpine from './alpine'

/**
 * Register Directives
 */
import xTransition from './directives/x-transition'; Alpine.directive('transition', xTransition)
import xDestroy from './directives/x-destroy'; Alpine.directive('destroy', xDestroy)
import xMorph from './directives/x-morph'; Alpine.directive('morph', xMorph)
import xModel from './directives/x-model'; Alpine.directive('model', xModel)
import xCloak from './directives/x-cloak'; Alpine.directive('cloak', xCloak)
import xInit from './directives/x-init'; Alpine.directive('init', xInit)
import xText from './directives/x-text'; Alpine.directive('text', xText)
import xBind from './directives/x-bind'; Alpine.directive('bind', xBind)
import xData from './directives/x-data'; Alpine.directive('data', xData)
import xShow from './directives/x-show'; Alpine.directive('show', xShow)
import xFor from './directives/x-for'; Alpine.directive('for', xFor)
import xRef from './directives/x-ref'; Alpine.directive('ref', xRef)
import xIf from './directives/x-if'; Alpine.directive('if', xIf)
import xOn from './directives/x-on'; Alpine.directive('on', xOn)


/**
 * Register Magics
 */
import nextTick from './magics/$nextTick'; Alpine.magic('nextTick', nextTick)
import dispatch from './magics/$dispatch'; Alpine.magic('dispatch', dispatch)
import watch from './magics/$watch'; Alpine.magic('watch', watch)
import store from './magics/$store'; Alpine.magic('store', store)
import refs from './magics/$refs'; Alpine.magic('refs', refs)
import el from './magics/$el'; Alpine.magic('el', el)

/**
 * Make It Available
 */
window.Alpine = Alpine

/**
 * Start It Up
 */
Alpine.start()
