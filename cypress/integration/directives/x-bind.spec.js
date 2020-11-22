import { test } from '../../utils'

test('sets attribute bindings on initialize',
    `
    <div x-data="{ foo: 'bar' }">
        <span x-ref="me" x-bind:foo="foo">[Subject]</span>
    </div>
    `,
    () => {
        cy.get('span').should(el => {
            expect(el).to.have.attr('foo', 'bar')
        })
    }
)

test('class attribute bindings are merged by string syntax',
    `
    <div x-data="{ isOn: false }">
        <span class="foo" x-bind:class="isOn ? 'bar': ''"></span>

        <button @click="isOn = ! isOn">button</button>
    </div>
    `,
    () => {
        cy.get('span').should('have.class', 'foo')
        cy.get('span').should('not.have.class', 'bar')
        cy.get('button').click()
        cy.get('span').should('have.class', 'foo')
        cy.get('span').should('have.class', 'bar')
    }
)

test('class attribute bindings are added by string syntax',
    `
    <div x-data="{ initialClass: 'foo' }">
        <span x-bind:class="initialClass"></span>
    </div>
    `,
    () => {
        cy.get('span').should('have.class', 'foo')
    }
)

test('non-boolean attributes set to null/undefined/false are removed from the element',
    `
    <div x-data="{}">
        <a href="#hello" x-bind:href="null">null</a>
        <a href="#hello" x-bind:href="false">false</a>
        <a href="#hello" x-bind:href="undefined">undefined</a>
        <!-- custom attribute see https://github.com/alpinejs/alpine/issues/280 -->
        <span visible="true" x-bind:visible="null">null</span>
        <span visible="true" x-bind:visible="false">false</span>
        <span visible="true" x-bind:visible="undefined">undefined</span>
    </div>
    `,
    () => {
        let beMissingHref = el => expect(el).not.to.have.attr('href')
        let beMissingVisible = el => expect(el).not.to.have.attr('visible')

        cy.get('a:nth-child(1)').should(beMissingHref)
        cy.get('a:nth-child(2)').should(beMissingHref)
        cy.get('a:nth-child(3)').should(beMissingHref)
        cy.get('span:nth-child(1)').should(beMissingVisible)
        cy.get('span:nth-child(2)').should(beMissingVisible)
        cy.get('span:nth-child(3)').should(beMissingVisible)
    }
)

test('non-boolean empty string attributes are not removed',
    `
    <div x-data>
        <a href="#hello" x-bind:href="''"></a>
    </div>
    `,
    () => {
        let haveEmptyHref = el => expect(el).to.have.attr('href', '')

        cy.get('a').should(haveEmptyHref)
    }
)

test('boolean attribute values are set to their attribute name if true and removed if false',
    `
    <div x-data="{ isSet: true }">
        <span @click="isSet = false" id="setToFalse">Set To False</span>

        <input x-bind:disabled="isSet"></input>
        <input x-bind:checked="isSet"></input>
        <input x-bind:required="isSet"></input>
        <input x-bind:readonly="isSet"></input>
        <details x-bind:open="isSet"></details>
        <select x-bind:multiple="isSet"></select>
        <option x-bind:selected="isSet"></option>
        <textarea x-bind:autofocus="isSet"></textarea>
        <dl x-bind:itemscope="isSet"></dl>
        <form x-bind:novalidate="isSet"></form>
        <iframe
            x-bind:allowfullscreen="isSet"
            x-bind:allowpaymentrequest="isSet"
        ></iframe>
        <button x-bind:formnovalidate="isSet"></button>
        <audio
            x-bind:autoplay="isSet"
            x-bind:controls="isSet"
            x-bind:loop="isSet"
            x-bind:muted="isSet"
        ></audio>
        <video x-bind:playsinline="isSet"></video>
        <track x-bind:default="isSet" />
        <img x-bind:ismap="isSet" />
        <ol x-bind:reversed="isSet"></ol>
    </div>
    `,
    () => {
        let haveAttrNameAndValue = attr => el => expect(el).to.have.attr(attr, attr)
        let beMissingAttribute = attr => el => expect(el).not.to.have.attr(attr)

        cy.get('input:nth-of-type(1)').should(haveAttrNameAndValue('disabled'))
        cy.get('input:nth-of-type(2)').should(haveAttrNameAndValue('checked'))
        cy.get('input:nth-of-type(3)').should(haveAttrNameAndValue('required'))
        cy.get('input:nth-of-type(4)').should(haveAttrNameAndValue('readonly'))
        cy.get('details').should(haveAttrNameAndValue('open'))
        cy.get('select').should(haveAttrNameAndValue('multiple'))
        cy.get('option').should(haveAttrNameAndValue('selected'))
        cy.get('textarea').should(haveAttrNameAndValue('autofocus'))
        cy.get('dl').should(haveAttrNameAndValue('itemscope'))
        cy.get('form').should(haveAttrNameAndValue('novalidate'))
        cy.get('iframe').should(haveAttrNameAndValue('allowfullscreen'))
        cy.get('iframe').should(haveAttrNameAndValue('allowpaymentrequest'))
        cy.get('button').should(haveAttrNameAndValue('formnovalidate'))
        cy.get('audio').should(haveAttrNameAndValue('autoplay'))
        cy.get('audio').should(haveAttrNameAndValue('controls'))
        cy.get('audio').should(haveAttrNameAndValue('loop'))
        cy.get('audio').should(haveAttrNameAndValue('muted'))
        cy.get('video').should(haveAttrNameAndValue('playsinline'))
        cy.get('track').should(haveAttrNameAndValue('default'))
        cy.get('img').should(haveAttrNameAndValue('ismap'))
        cy.get('ol').should(haveAttrNameAndValue('reversed'))

        cy.get('#setToFalse').click()

        cy.get('input:nth-of-type(1)').should(beMissingAttribute('disabled'))
        cy.get('input:nth-of-type(2)').should(beMissingAttribute('checked'))
        cy.get('input:nth-of-type(3)').should(beMissingAttribute('required'))
        cy.get('input:nth-of-type(4)').should(beMissingAttribute('readonly'))
        cy.get('details').should(beMissingAttribute('open'))
        cy.get('select').should(beMissingAttribute('multiple'))
        cy.get('option').should(beMissingAttribute('selected'))
        cy.get('textarea').should(beMissingAttribute('autofocus'))
        cy.get('dl').should(beMissingAttribute('itemscope'))
        cy.get('form').should(beMissingAttribute('novalidate'))
        cy.get('iframe').should(beMissingAttribute('allowfullscreen'))
        cy.get('iframe').should(beMissingAttribute('allowpaymentrequest'))
        cy.get('button').should(beMissingAttribute('formnovalidate'))
        cy.get('audio').should(beMissingAttribute('autoplay'))
        cy.get('audio').should(beMissingAttribute('controls'))
        cy.get('audio').should(beMissingAttribute('loop'))
        cy.get('audio').should(beMissingAttribute('muted'))
        cy.get('video').should(beMissingAttribute('playsinline'))
        cy.get('track').should(beMissingAttribute('default'))
        cy.get('img').should(beMissingAttribute('ismap'))
        cy.get('ol').should(beMissingAttribute('reversed'))
        cy.get('script').should(beMissingAttribute('async'))
        cy.get('script').should(beMissingAttribute('defer'))
        cy.get('script').should(beMissingAttribute('nomodule'))
    }
)

test('boolean empty string attributes are not removed',
    `
    <div x-data="{}">
        <input x-bind:disabled="''">
    </div>
    `,
    () => {
        let haveDisabledAttr = el => expect(el).to.have.attr('disabled', 'disabled')

        cy.get('input').should(haveDisabledAttr)
    }
)

test('binding supports short syntax',
    `
    <div x-data="{ foo: 'bar' }">
        <span :class="foo"></span>
    </div>
    `,
    () => {
        cy.get('span').should('have.class', 'bar')
    }
)

test('checkbox is unchecked by default',
    `
    <div x-data="{foo: {bar: 'baz'}}">
        <input type="checkbox" x-bind:value="''"></input>
        <input type="checkbox" x-bind:value="'test'"></input>
        <input type="checkbox" x-bind:value="foo.bar"></input>
        <input type="checkbox" x-bind:value="0"></input>
        <input type="checkbox" x-bind:value="10"></input>
    </div>
    `,
    () => {
        cy.get('input:nth-of-type(1)').should('not.be.checked')
        cy.get('input:nth-of-type(2)').should('not.be.checked')
        cy.get('input:nth-of-type(3)').should('not.be.checked')
        cy.get('input:nth-of-type(4)').should('not.be.checked')
        cy.get('input:nth-of-type(5)').should('not.be.checked')
    }
)

test('radio is unchecked by default',
    `
    <div x-data="{foo: {bar: 'baz'}}">
        <input type="radio" x-bind:value="''"></input>
        <input type="radio" x-bind:value="'test'"></input>
        <input type="radio" x-bind:value="foo.bar"></input>
        <input type="radio" x-bind:value="0"></input>
        <input type="radio" x-bind:value="10"></input>
    </div>
    `,
    () => {
        cy.get('input:nth-of-type(1)').should('not.be.checked')
        cy.get('input:nth-of-type(2)').should('not.be.checked')
        cy.get('input:nth-of-type(3)').should('not.be.checked')
        cy.get('input:nth-of-type(4)').should('not.be.checked')
        cy.get('input:nth-of-type(5)').should('not.be.checked')
    }
)

test('checkbox values are set correctly',
    `
    <div x-data="{ stringValue: 'foo', trueValue: true, falseValue: false }">
        <input type="checkbox" name="stringCheckbox" :value="stringValue" />
        <input type="checkbox" name="trueCheckbox" :value="trueValue" />
        <input type="checkbox" name="falseCheckbox" :value="falseValue" />
    </div>
    `,
    () => {
        let haveValue = value => el => expect(el).to.have.value(value)

        cy.get('input:nth-of-type(1)').should(haveValue('foo'))
        cy.get('input:nth-of-type(2)').should(haveValue('on'))
        cy.get('input:nth-of-type(3)').should(haveValue('on'))
    }
)

test('radio values are set correctly',
    `
    <div x-data="{lists: [{id: 1}, {id: 8}], selectedListID: '8'}">
        <template x-for="list in lists" :key="list.id">
            <input x-model="selectedListID" type="radio" :value="list.id.toString()" :id="'list-' + list.id">
        </template>
        <input type="radio" id="list-test" value="test" x-model="selectedListID">
    </div>
    `,
    () => {
        let haveValue = value => el => expect(el).to.have.value(value)
        let beChecked = el => expect(el[0].checked).to.be.true
        let beUnChecked = el => expect(el[0].checked).to.be.false

        cy.get('#list-1').should(haveValue('1'))
        cy.get('#list-1').should(beUnChecked)
        cy.get('#list-8').should(haveValue('8'))
        cy.get('#list-8').should(beChecked)
        cy.get('#list-test').should(haveValue('test'))
        cy.get('#list-test').should(beUnChecked)
    }
)

test('classes are removed before being added',
    `
    <div x-data="{ isOpen: true }">
        <span class="text-red" :class="isOpen ? 'block' : 'hidden'">
            Span
        </span>
        <button @click="isOpen = !isOpen">click me</button>
    </div>
    `,
    () => {
        let haveClasses = classes => el => classes.forEach(aClass => expect(el).to.have.class(aClass))
        let notHaveClasses = classes => el => classes.forEach(aClass => expect(el).not.to.have.class(aClass))

        cy.get('span').should(haveClasses(['block', 'text-red']))
        cy.get('button').click()
        cy.get('span').should(haveClasses(['hidden', 'text-red']))
        cy.get('span').should(notHaveClasses(['block']))
    }
)

test('extra whitespace in class binding string syntax is ignored',
    `
    <div x-data>
        <span x-bind:class="'  foo  bar  '"></span>
    </div>
    `,
    () => {
        let haveClasses = classes => el => classes.forEach(aClass => expect(el).to.have.class(aClass))

        cy.get('span').should(haveClasses(['foo', 'bar']))
    }
)

test('undefined class binding resolves to empty string',
    `
    <div x-data="{ errorClass: (hasError) => { if (hasError) { return 'red' } } }">
        <span id="error" x-bind:class="errorClass(true)">should be red</span>
        <span id="empty" x-bind:class="errorClass(false)">should be empty</span>
    </div>
    `,
    () => {
        let haveClasses = classes => el => classes.forEach(aClass => expect(el).to.have.class(aClass))
        let notHaveClasses = classes => el => classes.forEach(aClass => expect(el).not.to.have.class(aClass))

        cy.get('span:nth-of-type(1)').should(haveClasses(['red']))
        cy.get('span:nth-of-type(2)').should(notHaveClasses(['red']))
    }
)

test('.camel modifier correctly sets name of attribute',
    `
    <div x-data>
        <svg x-bind:view-box.camel="'0 0 42 42'"></svg>
    </div>
    `,
    () => {
        let haveAttribute = (name, value) => el => expect(el).to.have.attr(name, value)

        cy.get('svg').should(haveAttribute('viewBox', '0 0 42 42'))
    }
)

test('attribute binding names can contain numbers',
    `
    <svg x-data>
        <line x1="1" y1="2" :x2="3" x-bind:y2="4" />
    </svg>
    `,
    () => {
        let haveAttribute = (name, value) => el => expect(el).to.have.attr(name, value)

        cy.get('line').should(haveAttribute('x2', '3'))
        cy.get('line').should(haveAttribute('y2', '4'))
    }
)

test('non-string and non-boolean attributes are cast to string when bound to checkbox',
    `
    <div x-data="{ number: 100, zero: 0, bool: true, nullProp: null }">
        <input type="checkbox" id="number" :value="number">
        <input type="checkbox" id="zero" :value="zero">
        <input type="checkbox" id="boolean" :value="bool">
        <input type="checkbox" id="null" :value="nullProp">
    </div>
    `,
    () => {
        let haveValue = value => el => expect(el).to.have.value(value)

        cy.get('input:nth-of-type(1)').should(haveValue('100'))
        cy.get('input:nth-of-type(2)').should(haveValue('0'))
        cy.get('input:nth-of-type(3)').should(haveValue('on'))
        cy.get('input:nth-of-type(4)').should(haveValue('on'))
    }
)
