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
 * _______________________________________________________
 * The Directives
 * -------------------------------------------------------
 *
 * Now that the core is all set up, we can register Alpine
 * directives like x-text or x-on that form the basis of
 * how Alpine adds behavior to an app's static markup.
 */
import './directives/x-transition'
import './directives/x-destroy'
import './directives/x-ignore'
import './directives/x-effect'
import './directives/x-model'
import './directives/x-cloak'
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
 * _______________________________________________________
 * The Magics
 * -------------------------------------------------------
 *
 * Yeah, we're calling them magics here like they're nouns.
 * These are the properties that are magically available
 * to all the Alpine expressions, within your web app.
 */
import './magics/$nextTick'
import './magics/$dispatch'
import './magics/$effect'
import './magics/$watch'
import './magics/$store'
import './magics/$refs'
import './magics/$el'

/**
 * _______________________________________________________
 * The Evaluator
 * -------------------------------------------------------
 *
 * Now we're ready to bootstrap Alpine's evaluation system.
 * It's the function that converts raw JavaScript string
 * expressions like @click="toggle()", into actual JS.
 */
import { normalEvaluator } from './evaluator'

Alpine.setEvaluator(normalEvaluator)

/**
 * _______________________________________________________
 * The Reactivity Engine
 * -------------------------------------------------------
 *
 * This is the reactivity core of Alpine. It's the part of
 * Alpine that triggers an element with x-text="message"
 * to update its inner text when "message" is changed.
 */
import { reactive, effect } from '@vue/reactivity/dist/reactivity.esm-browser.prod.js'

Alpine.setReactivity(reactive, effect)

/**
 * _________________
 * Turning The Key
 * -------------------------------------------------------
 *
 * First, we'll make the Alpine object available on window,
 * where everyone can access it. Then we'll breathe life
 * into an otherwise static blob of HTML in a browser.
 */
export default Alpine
