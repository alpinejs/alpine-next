
export default (el, { modifiers }) => modifiers.includes('self')
    ? el.__x_ignore_self = true
    : el.__x_ignore = true
