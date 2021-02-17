import Alpine from './alpine'

/**
 * Register Directives
 */
import xtransition from './directives/x-transition'
Alpine.directive('transition', xtransition)

import xdestroy from './directives/x-destroy'
Alpine.directive('destroy', xdestroy)

import xmorph from './directives/x-morph'
Alpine.directive('morph', xmorph)

import xmodel from './directives/x-model'
Alpine.directive('model', xmodel)

import xcloak from './directives/x-cloak'
Alpine.directive('cloak', xcloak)

import xinit from './directives/x-init'
Alpine.directive('init', xinit)

import xtext from './directives/x-text'
Alpine.directive('text', xtext)

import xbind from './directives/x-bind'
Alpine.directive('bind', xbind)

import xdata from './directives/x-data'
Alpine.directive('data', xdata)

import xshow from './directives/x-show'
Alpine.directive('show', xshow)

import xfor from './directives/x-for'
Alpine.directive('for', xfor)

import xref from './directives/x-ref'
Alpine.directive('ref', xref)

import xif from './directives/x-if'
Alpine.directive('if', xif)

import xon from './directives/x-on'
Alpine.directive('on', xon)


/**
 * Register Magics
 */
Alpine.magic('nextTick', import('./magics/$nextTick'))
Alpine.magic('dispatch', import('./magics/$dispatch'))
Alpine.magic('watch', import('./magics/$watch'))
Alpine.magic('store', import('./magics/$store'))
Alpine.magic('refs', import('./magics/$refs'))
Alpine.magic('el', import('./magics/$el'))

/**
 * Start It Up
 */
Alpine.start()

/**
 * Make It Available
 */
window.Alpine = Alpine
