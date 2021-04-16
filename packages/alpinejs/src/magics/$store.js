import { getStore } from '../store'
import { magic } from '../magics'

magic('store', () => name => getStore(name))
