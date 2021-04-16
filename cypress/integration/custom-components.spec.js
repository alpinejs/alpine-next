import { haveText, test } from '../utils'

test('can register custom components properties',
    `
        <script>
            document.addEventListener('alpine:initializing', () => {
                Alpine.component('component', () => ({
                    foo: 'bar'
                }))
            })
        </script>

        <div x-data="component">
            <span x-text="foo"></span>
        </div>
    `,
    ({ get }) => get('span').should(haveText('bar'))
)

test('init functions inside custom components are called automatically',
    `
        <script>
            document.addEventListener('alpine:initializing', () => {
                Alpine.component('component', () => ({
                    init() {
                        this.foo = 'baz'
                    },

                    foo: 'bar'
                }))
            })
        </script>

        <div x-data="component">
            <span x-text="foo"></span>
        </div>
    `,
    ({ get }) => {
        get('span').should(haveText('baz'))
    }
)

test('init functions "this" context is reactive',
    `
        <script>
            document.addEventListener('alpine:initializing', () => {
                Alpine.component('component', () => ({
                    init() {
                        window.addEventListener('click', () => {
                            this.foo = 'baz'
                        })
                    },

                    foo: 'bar'
                }))
            })
        </script>

        <div x-data="component">
            <span x-text="foo"></span>

            <button>click me</button>
        </div>
    `,
    ({ get }) => {
        get('span').should(haveText('bar'))
        get('button').click()
        get('span').should(haveText('baz'))
    }
)
