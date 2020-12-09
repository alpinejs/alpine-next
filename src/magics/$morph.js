import Alpine from '../alpine'
import scheduler from '../scheduler'
import morph from '../morph'

Alpine.magic('morph', el => (el, html) => morph(el, html))
