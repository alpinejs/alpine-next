import { beVisible, notBeVisible, notHaveAttribute, test } from '../../utils'

test('x-if',
    `
        <div x-data="{ show: false }">
            <button @click="show = ! show">Toggle</button>

            <template x-if="show">
                <h1>Toggle Me</h1>
            </template>
        </div>
    `,
    get => {
        get('h1').should(notBeVisible())
        get('button').click()
        get('h1').should(beVisible())
        get('button').click()
        get('h1').should(notBeVisible())
    }
)

test('x-if with multiple root elements',
    `
        <div x-data="{ show: false }">
            <button @click="show = ! show">Toggle</button>

            <template x-if="show">
                <h1>Toggle Me</h1>
                <h2>Toggle Me Too</h2>
            </template>
        </div>
    `,
    get => {
        get('h1').should(notBeVisible())
        get('h2').should(notBeVisible())
        get('button').click()
        get('h1').should(beVisible())
        get('h2').should(beVisible())
        get('button').click()
        get('h1').should(notBeVisible())
        get('h2').should(notBeVisible())
    }
)
