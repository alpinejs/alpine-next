import { test } from '../../utils'

test('$nextTick works',
    `
        <div x-data="{foo: 'bar'}">
            <span x-text="foo" x-ref="span"></span>

            <button x-on:click="foo = 'baz'; $nextTick(() => {$refs.span.textContent = 'bob'})">click</button>
        </div>
    `,
    () => {
        cy.get('span').should('have.text', 'bar')
        cy.get('button').click()
        cy.get('span').should('have.text', 'bob')
    }
)

test('$nextTick waits for x-for to finish rendering',
    `
        <div x-data="{list: ['one', 'two'], check: 2}">
            <template x-for="item in list">
                <span x-text="item"></span>
            </template>

            <p x-text="check"></p>

            <button x-on:click="list = ['one', 'two', 'three']; $nextTick(() => {check = document.querySelectorAll('span').length})">click</button>
        </div>
    `,
    () => {
        cy.get('p').should('have.text', '2')
        cy.get('button').click()
        cy.get('p').should('have.text', '3')
    }
)

test('$nextTick works with transition',
    `
        <div x-data="{ show: false, loggedDisplayStyle: null }" x-init="$nextTick(() => { loggedDisplayStyle = document.querySelector('h1').style.display })">
            <h1 x-show="show" x-transition:enter="animation-enter"></h1>

            <h2 x-text="loggedDisplayStyle"></h2>

            <button @click="show = true; $nextTick(() => { loggedDisplayStyle = document.querySelector('h1').style.display })">click</button>
        </div>
    `,
    () => {
        cy.get('h2').should('have.text', 'none')
        cy.get('button').click()
        cy.get('h2').should('have.text', '')
    }
)
