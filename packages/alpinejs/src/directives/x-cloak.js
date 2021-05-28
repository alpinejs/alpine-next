import { directive, prefix } from '.'
import { mutateDom } from '../mutation'
import { nextTick } from '../nextTick'

directive('cloak', el => nextTick(() => mutateDom(() => el.removeAttribute(prefix('cloak')))))
