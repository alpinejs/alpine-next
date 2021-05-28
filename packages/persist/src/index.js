
// This is: `{ count: $persist(0) }`
export function magic(el, { Alpine }) {
    return Alpine.interceptor((key, path) => {
        return {
            init(initialValue, setter) {
                if (localStorage.getItem(path)) {
                    setter(localStorage.getItem(path))
                } else {
                    setter(initialValue)
                }
            },
            set(value, setter) {
                localStorage.setItem(path, value)

                setter(value)
            },
        }
    })
}
