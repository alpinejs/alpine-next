
export default {
    things: [],

    defer(callback) {
        this.things.push(callback)
    },

    runThrough() {
        while(this.things.length > 0) {
            this.things.shift()()
        }
    }
}
