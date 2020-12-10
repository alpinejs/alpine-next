import Alpine from './../alpine.js'

Alpine.intercept(({ name, value }) => {
    if (name.startsWith(':')) name = name.replace(':', 'x-bind:')

    return { name,  value }
})
