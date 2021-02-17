import { root as getRoot } from '../utils/root'

export default (el, { expression }) => {
    let root = getRoot(el)

    if (! root._x_refs) root._x_refs = {}

    root._x_refs[expression] = el
}
