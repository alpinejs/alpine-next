import { haveAttribute, haveValue, haveClasses, test } from '../../utils'

test('sets attribute bindings on initialize',
    `
        <div x-data="{ foo: 'bar' }">
            <span x-ref="me" x-bind:foo="foo">[Subject]</span>
        </div>
    `,
    get => {
        get('span').should(el => {
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
    get => {
        get('span').should('have.class', 'foo')
        get('span').should('not.have.class', 'bar')
        get('button').click()
        get('span').should('have.class', 'foo')
        get('span').should('have.class', 'bar')
    }
)

test('class attribute bindings are added by string syntax',
    `
        <div x-data="{ initialClass: 'foo' }">
            <span x-bind:class="initialClass"></span>
        </div>
    `,
    get => {
        get('span').should(haveClasses(['foo']))
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
    get => {
        let beMissingHref = el => expect(el).not.to.have.attr('href')
        let beMissingVisible = el => expect(el).not.to.have.attr('visible')

        get('a:nth-child(1)').should(beMissingHref)
        get('a:nth-child(2)').should(beMissingHref)
        get('a:nth-child(3)').should(beMissingHref)
        get('span:nth-child(1)').should(beMissingVisible)
        get('span:nth-child(2)').should(beMissingVisible)
        get('span:nth-child(3)').should(beMissingVisible)
    }
)

test('non-boolean empty string attributes are not removed',
    `
        <div x-data>
            <a href="#hello" x-bind:href="''"></a>
        </div>
    `,
    get => {
        let haveEmptyHref = el => expect(el).to.have.attr('href', '')

        get('a').should(haveEmptyHref)
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
    get => {
        let haveAttrNameAndValue = attr => el => expect(el).to.have.attr(attr, attr)
        let beMissingAttribute = attr => el => expect(el).not.to.have.attr(attr)

        get('input:nth-of-type(1)').should(haveAttrNameAndValue('disabled'))
        get('input:nth-of-type(2)').should(haveAttrNameAndValue('checked'))
        get('input:nth-of-type(3)').should(haveAttrNameAndValue('required'))
        get('input:nth-of-type(4)').should(haveAttrNameAndValue('readonly'))
        get('details').should(haveAttrNameAndValue('open'))
        get('select').should(haveAttrNameAndValue('multiple'))
        get('option').should(haveAttrNameAndValue('selected'))
        get('textarea').should(haveAttrNameAndValue('autofocus'))
        get('dl').should(haveAttrNameAndValue('itemscope'))
        get('form').should(haveAttrNameAndValue('novalidate'))
        get('iframe').should(haveAttrNameAndValue('allowfullscreen'))
        get('iframe').should(haveAttrNameAndValue('allowpaymentrequest'))
        get('button').should(haveAttrNameAndValue('formnovalidate'))
        get('audio').should(haveAttrNameAndValue('autoplay'))
        get('audio').should(haveAttrNameAndValue('controls'))
        get('audio').should(haveAttrNameAndValue('loop'))
        get('audio').should(haveAttrNameAndValue('muted'))
        get('video').should(haveAttrNameAndValue('playsinline'))
        get('track').should(haveAttrNameAndValue('default'))
        get('img').should(haveAttrNameAndValue('ismap'))
        get('ol').should(haveAttrNameAndValue('reversed'))

        get('#setToFalse').click()

        get('input:nth-of-type(1)').should(beMissingAttribute('disabled'))
        get('input:nth-of-type(2)').should(beMissingAttribute('checked'))
        get('input:nth-of-type(3)').should(beMissingAttribute('required'))
        get('input:nth-of-type(4)').should(beMissingAttribute('readonly'))
        get('details').should(beMissingAttribute('open'))
        get('select').should(beMissingAttribute('multiple'))
        get('option').should(beMissingAttribute('selected'))
        get('textarea').should(beMissingAttribute('autofocus'))
        get('dl').should(beMissingAttribute('itemscope'))
        get('form').should(beMissingAttribute('novalidate'))
        get('iframe').should(beMissingAttribute('allowfullscreen'))
        get('iframe').should(beMissingAttribute('allowpaymentrequest'))
        get('button').should(beMissingAttribute('formnovalidate'))
        get('audio').should(beMissingAttribute('autoplay'))
        get('audio').should(beMissingAttribute('controls'))
        get('audio').should(beMissingAttribute('loop'))
        get('audio').should(beMissingAttribute('muted'))
        get('video').should(beMissingAttribute('playsinline'))
        get('track').should(beMissingAttribute('default'))
        get('img').should(beMissingAttribute('ismap'))
        get('ol').should(beMissingAttribute('reversed'))
        get('script').should(beMissingAttribute('async'))
        get('script').should(beMissingAttribute('defer'))
        get('script').should(beMissingAttribute('nomodule'))
    }
)

test('boolean empty string attributes are not removed',
    `
        <div x-data="{}">
            <input x-bind:disabled="''">
        </div>
    `,
    get => {
        let haveDisabledAttr = el => expect(el).to.have.attr('disabled', 'disabled')

        get('input').should(haveDisabledAttr)
    }
)

test('binding supports short syntax',
    `
        <div x-data="{ foo: 'bar' }">
            <span :class="foo"></span>
        </div>
    `,
    get => {
        get('span').should('have.class', 'bar')
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
    get => {
        get('input:nth-of-type(1)').should('not.be.checked')
        get('input:nth-of-type(2)').should('not.be.checked')
        get('input:nth-of-type(3)').should('not.be.checked')
        get('input:nth-of-type(4)').should('not.be.checked')
        get('input:nth-of-type(5)').should('not.be.checked')
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
    get => {
        get('input:nth-of-type(1)').should('not.be.checked')
        get('input:nth-of-type(2)').should('not.be.checked')
        get('input:nth-of-type(3)').should('not.be.checked')
        get('input:nth-of-type(4)').should('not.be.checked')
        get('input:nth-of-type(5)').should('not.be.checked')
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
    get => {
        let haveValue = value => el => expect(el).to.have.value(value)

        get('input:nth-of-type(1)').should(haveValue('foo'))
        get('input:nth-of-type(2)').should(haveValue('on'))
        get('input:nth-of-type(3)').should(haveValue('on'))
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
    get => {
        let haveValue = value => el => expect(el).to.have.value(value)
        let beChecked = el => expect(el[0].checked).to.be.true
        let beUnChecked = el => expect(el[0].checked).to.be.false

        get('#list-1').should(haveValue('1'))
        get('#list-1').should(beUnChecked)
        get('#list-8').should(haveValue('8'))
        get('#list-8').should(beChecked)
        get('#list-test').should(haveValue('test'))
        get('#list-test').should(beUnChecked)
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
    get => {
        let haveClasses = classes => el => classes.forEach(aClass => expect(el).to.have.class(aClass))
        let notHaveClasses = classes => el => classes.forEach(aClass => expect(el).not.to.have.class(aClass))

        get('span').should(haveClasses(['block', 'text-red']))
        get('button').click()
        get('span').should(haveClasses(['hidden', 'text-red']))
        get('span').should(notHaveClasses(['block']))
    }
)

test('extra whitespace in class binding string syntax is ignored',
    `
        <div x-data>
            <span x-bind:class="'  foo  bar  '"></span>
        </div>
    `,
    get => {
        let haveClasses = classes => el => classes.forEach(aClass => expect(el).to.have.class(aClass))

        get('span').should(haveClasses(['foo', 'bar']))
    }
)

test('undefined class binding resolves to empty string',
    `
        <div x-data="{ errorClass: (hasError) => { if (hasError) { return 'red' } } }">
            <span id="error" x-bind:class="errorClass(true)">should be red</span>
            <span id="empty" x-bind:class="errorClass(false)">should be empty</span>
        </div>
    `,
    get => {
        let haveClasses = classes => el => classes.forEach(aClass => expect(el).to.have.class(aClass))
        let notHaveClasses = classes => el => classes.forEach(aClass => expect(el).not.to.have.class(aClass))

        get('span:nth-of-type(1)').should(haveClasses(['red']))
        get('span:nth-of-type(2)').should(notHaveClasses(['red']))
    }
)

test('.camel modifier correctly sets name of attribute',
    `
        <div x-data>
            <svg x-bind:view-box.camel="'0 0 42 42'"></svg>
        </div>
    `,
    get => {
        let haveAttribute = (name, value) => el => expect(el).to.have.attr(name, value)

        get('svg').should(haveAttribute('viewBox', '0 0 42 42'))
    }
)

test('attribute binding names can contain numbers',
    `
        <svg x-data>
            <line x1="1" y1="2" :x2="3" x-bind:y2="4" />
        </svg>
    `,
    get => {
        get('line').should(haveAttribute('x2', '3'))
        get('line').should(haveAttribute('y2', '4'))
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
    get => {
        get('input:nth-of-type(1)').should(haveValue('100'))
        get('input:nth-of-type(2)').should(haveValue('0'))
        get('input:nth-of-type(3)').should(haveValue('on'))
        get('input:nth-of-type(4)').should(haveValue('on'))
    }
)
