
export default {
    tasks: [],
    nextTicks: [],
    shouldFlush: false,

    task(callback) {
        this.tasks.push(callback)
        this.shouldFlushAtEndOfRequest()
    },

    nextTick(callback) {
        this.nextTicks.push(callback)
        this.shouldFlushAtEndOfRequest()
    },

    holdNextTicks() {
        this.holdNextTicksOver = true
    },

    releaseNextTicks() {
        while (this.nextTicks.length > 0) {
            this.nextTicks.shift()()
        }

        this.holdNextTicksOver = false
    },

    shouldFlushAtEndOfRequest() {
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

            if (! this.holdNextTicksOver) {
                // Flush anything added by $nextTick
                while (this.nextTicks.length > 0) {
                    this.nextTicks.shift()()
                }
            }
        })
    }
}
