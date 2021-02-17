import { getStore } from '../stores'

export default () => name => getStore(name)
