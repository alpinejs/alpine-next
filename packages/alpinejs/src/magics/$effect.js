import { magic } from '../magics'
import { effect } from '../reactivity'

magic('effect', () => callback => effect(callback))
