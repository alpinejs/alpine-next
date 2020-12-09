import Alpine from '../alpine'
import scheduler from '../scheduler'

Alpine.magic('nextTick', el => callback => scheduler.nextTick(callback))
