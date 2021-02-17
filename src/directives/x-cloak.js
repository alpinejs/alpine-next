import { nextTick } from '../nextTick'

export default el => nextTick(() => el.removeAttribute('x-cloak'))
