document.addEventListener('alpine:initializing', () => {
    Alpine.component('foo', () => ({
        hey: 'there',

        yo() {
            return this.hey
        },

        doSomething() {
            this.hey = 'yoyoy'
        },
    }))
})
