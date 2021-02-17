import { dispatch } from '../utils/dispatch'

export default el => dispatch.bind(dispatch, el)
