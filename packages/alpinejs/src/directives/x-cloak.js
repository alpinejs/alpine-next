import { directive, prefix } from '.'
import { nextTick } from '../nextTick'

directive('cloak', el => nextTick(() => el.removeAttribute(prefix('cloak'))))
