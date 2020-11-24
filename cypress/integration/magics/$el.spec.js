import { test, haveText } from '../../utils'

test('works',
    `
        <div x-data>
            <button @click="$el.innerText = 'foo'">click me</button>
        </div>
    `,
    get => {
        get('button').should(haveText('click me'))
        get('button').click()
        get('button').should(haveText('foo'))
    }
)
