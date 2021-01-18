import { beHidden, beVisible, haveText, test } from '../../utils'

test('can bind an object of directives',
    `
        <script>
            window.modal = function () {
                return {
                    foo: 'bar',
                    trigger: {
                        ['x-on:click']() { this.foo = 'baz' },
                    },
                    dialogue: {
                        ['x-text']() { return this.foo },
                    },
                }
            }
        </script>

        <div x-data="window.modal()">
            <button x-spread="trigger">Toggle</button>

            <span x-spread="dialogue">Modal Body</span>
        </div>
    `,
    get => {
        get('span').should(haveText('bar'))
        get('button').click()
        get('span').should(haveText('baz'))
    }
)

test('x-spread supports x-for',
    `
        <script>
            window.todos = () => { return {
                todos: ['foo', 'bar'],
                outputForExpression: {
                    ['x-for']: 'todo in todos',
                }
            }}
        </script>
        <div x-data="window.todos()">
            <ul>
                <template x-spread="outputForExpression">
                    <li x-text="todo"></li>
                </template>
            </ul>
        </div>
    `,
    get => {
        get('li:nth-of-type(1)').should(haveText('foo'))
        get('li:nth-of-type(2)').should(haveText('bar'))
    }
)

// @flaky
test('x-spread syntax supports x-transition',
    `
        <style>
            .transition { transition-property: background-color, border-color, color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
            .duration-100 { transition-duration: 100ms; }
        </style>
        <script>
            window.transitions = () => { return {
                show: true,
                outputClickExpression: {
                    ['@click']() { this.show = false },
                    ['x-text']() { return 'Click Me' },
                },
                outputTransitionExpression: {
                    ['x-show']() { return this.show },
                    ['x-transition:enter']: 'transition duration-100',
                    ['x-transition:leave']: 'transition duration-100',
                },
            }}
        </script>
        <div x-data="transitions()">
            <button x-spread="outputClickExpression"></button>

            <span x-spread="outputTransitionExpression">thing</span>
        </div>
    `,
    get => {
        get('span').should(beVisible())
        get('button').click()
        get('span').should(beVisible())
        get('span').should(beHidden())
    }
)

test('x-spread event handlers defined as functions receive the event object as their first argument',
    `
        <script>
            window.data = () => { return {
                button: {
                    ['@click']() {
                        this.$refs.span.innerText = this.$el.id
                    }
                }
            }}
        </script>
        <div x-data="window.data()">
            <button x-spread="button" id="bar">click me</button>

            <span x-ref="span">foo</span>
        </div>
    `,
    get => {
        get('span').should(haveText('foo'))
        get('button').click()
        get('span').should(haveText('bar'))
    }
)
