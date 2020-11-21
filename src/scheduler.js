
export default {
    tasks: [],
    shouldFlush: false,

    task(callback) {
        this.tasks.push(callback)
    },

    pingFlush() {
        this.shouldFlush = true

        queueMicrotask(() => {
            if (this.shouldFlush) this.flush()
            this.shouldFlush = false
        })
    },

    flush() {
        setTimeout(() => {
            let DEADLINE = performance.now() + 80

            while (this.tasks.length > 0) {
                //  || performance.now() >= DEADLINE
                if (navigator?.scheduling?.isInputPending()) {
                    // Yield if we have to handle an input event, or we're out of time.
                    setTimeout(this.flush.bind(this))
                    return;
                }

                this.tasks.shift()()
            }
        })
    }
}
