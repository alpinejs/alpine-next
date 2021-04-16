import { directive } from "../directives"

let handler = () => {}

handler.inline = (el, { modifiers }) => modifiers.includes('self')
    ? el._x_ignore_self = true
    : el._x_ignore = true

directive('ignore', handler)
