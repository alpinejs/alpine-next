import Alpine from '../alpine'
import { root } from '../utils/root'

Alpine.magic('refs', el => root(el)._x_refs || {})
