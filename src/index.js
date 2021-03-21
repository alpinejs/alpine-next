/**
 *           _
 *     /\   | |     (_)            (_)
 *    /  \  | |_ __  _ _ __   ___   _ ___
 *   / /\ \ | | '_ \| | '_ \ / _ \ | / __|
 *  / ____ \| | |_) | | | | |  __/_| \__ \
 * /_/    \_\_| .__/|_|_| |_|\___(_) |___/
 *            | |                 _/ |
 *            |_|                |__/
 *
 * Let's build Alpine together. It's easier than you think.
 * For starters, we'll import Alpine's core. This is the
 * object that will expose all of Alpine's public API.
 */
import Alpine from './alpine'

/**
 * _______________
 * The Evaluator |
 * --------------
 *
 * Now we're ready to bootstrap Alpine's evaluation system.
 * It's the function that converts raw JavaScript string
 * expressions like @click="toggle()", into actual JS.
 */
import { normalEvaluator } from './evaluator'

Alpine.setEvaluator(normalEvaluator)

/**
 * _______________________
 * The Reactivity Engine |
 * ----------------------
 *
 * This is the reactivity core of Alpine. It's the part of
 * Alpine that triggers an element with x-text="message"
 * to update its inner text when "message" is changed.
 */
import { reactive, effect } from '@vue/reactivity'

Alpine.setReactivity(reactive, effect)


/**
 * ________________
 * The Directives |
 * ---------------
 *
 * Now that the core is all set up, we can register Alpine
 * directives like x-text or x-on that form the basis of
 * how Alpine adds behavior to an app's static markup.
 */
import xTransition from './directives/x-transition'; Alpine.directive('transition', xTransition)
import xDestroy from './directives/x-destroy'; Alpine.directive('destroy', xDestroy)
import xMorph from './directives/x-morph'; Alpine.directive('morph', xMorph)
import xModel from './directives/x-model'; Alpine.directive('model', xModel)
import xCloak from './directives/x-cloak'; Alpine.directive('cloak', xCloak)
import xIgnore from './directives/x-ignore'; Alpine.directive('ignore', xIgnore)
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
 * ____________
 * The Magics |
 * -----------
 *
 * Yeah, we're calling them magics here like they're nouns.
 * These are the properties that are magically available
 * to all the Alpine expressions, within your web app.
 */
import nextTick from './magics/$nextTick'; Alpine.magic('nextTick', nextTick)
import dispatch from './magics/$dispatch'; Alpine.magic('dispatch', dispatch)
import watch from './magics/$watch'; Alpine.magic('watch', watch)
import store from './magics/$store'; Alpine.magic('store', store)
import refs from './magics/$refs'; Alpine.magic('refs', refs)
import el from './magics/$el'; Alpine.magic('el', el)

/**
 * _________________
 * Turning The Key |
 * ----------------
 *
 * First, we'll make the Alpine object available on window,
 * where everyone can access it. Then we'll breathe life
 * into an otherwise static blob of HTML in a browser.
 */
window.Alpine = Alpine

Alpine.start()
