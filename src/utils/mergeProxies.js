
export default function mergeProxies(...objects) {
    return new Proxy({}, {
        get: (target, name) => {
            return (objects.find(object => Object.keys(object).includes(name)) || {})[name];
        },

        set: (target, name, value) => {
            let closestObjectWithKey = objects.find(object => Object.keys(object).includes(name))
            let closestCanonicalObject = objects.find(object => object['_x_canonical'])

            if (closestObjectWithKey) {
                closestObjectWithKey[name] = value
            } else if (closestCanonicalObject) {
                closestCanonicalObject[name] = value
            } else {
                objects[objects.length - 1][name] = value
            }

            return true
        },
    })
}
