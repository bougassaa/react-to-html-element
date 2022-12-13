import PropTypes from "prop-types";
import { expect, it } from 'vitest';
import React, {forwardRef, useImperativeHandle, useState} from "react";
import * as ReactDOM from "react-dom/client";
import { Window } from 'happy-dom';
import { register } from "./index";

const queryDOM = (document, selector) => new Promise((resolve => {
    setTimeout(() => resolve(document.querySelector(selector)), 100);
}));

const defineElement = (ReactComponent, tagName, win = null) => {
    const element = register(ReactComponent, null, React, ReactDOM, {returnElement: true});
    const window = win ?? new Window();

    window.customElements.define(tagName, element);

    return window.document;
}

const assertAttributes = element => {
    expect(element.firstChild.dataset.string).toBe("hello");
    expect(element.firstChild.dataset.bool).toBe("true");
    expect(element.firstChild.dataset.number.toString()).toBe("9999");
    expect(element.firstChild.dataset.prop1).toBe("foo");
    expect(element.firstChild.dataset.prop2).toBe("bar");
    expect(element.firstChild.dataset.elem1).toBe("foo");
    expect(element.firstChild.dataset.elem2).toBe("bar");
}

const TestButtonAttributes = () => {
    const TestButton = ({ someString, someBool, someNumber, someArray, someObject }) =>
        <button data-string={someString}
                data-bool={someBool}
                data-number={someNumber}
                data-prop1={someObject.prop1}
                data-prop2={someObject.prop2}
                data-elem1={someArray[0]}
                data-elem2={someArray[1]}>
            button
        </button>;

    TestButton.componentProps = {
        someString: String,
        someBool: Boolean,
        someNumber: Number,
        someArray: Array,
        someObject: Object,
    }

    return TestButton;
}

const assertNode = async (ReactElement) => {
    const document = defineElement(ReactElement, 'test-container');

    document.write(`<test-container>
        <p slot="slot1">foo</p>
        <slot name="slot2">bar</slot>
    </test-container>`);

    let element = await queryDOM(document, 'test-container');

    expect(element.firstChild.childElementCount).toBe(2);

    const children = element.firstChild.childNodes;

    expect(children[0].nodeName).toBe("P");
    expect(children[0].innerText).toBe("foo");

    expect(children[1].nodeName).toBe("SLOT");
    expect(children[1].innerText).toBe("bar");
}

it("render simple button and check text inside", async () => {
    const TestButton = ({ label }) => <button>{label}</button>;

    TestButton.componentProps = {
        label: String
    }

    const document = defineElement(TestButton, 'test-button');

    document.write(`<test-button label="Button content"></test-button>`);

    let element = await queryDOM(document, 'test-button');

    expect(element.firstChild.nodeName).toBe('BUTTON');
    expect(element.firstChild.innerText).toBe('Button content');
});

it("check attribute setter", async () => {
    const document = defineElement(TestButtonAttributes(), 'test-button');

    const button = document.createElement('test-button');
    button.someString = "hello";
    button.someBool = true;
    button.someNumber = 9999;
    button.someObject = { prop1: "foo", prop2: "bar" };
    button.someArray = ["foo", "bar"];

    document.body.appendChild(button);

    let element = await queryDOM(document, 'test-button');

    assertAttributes(element);
});

it("check HTML attribute", async () => {
    const document = defineElement(TestButtonAttributes(), 'test-button');

    document.write(`<test-button some-string="hello" some-bool="true" some-number="9999" some-object='{"prop1":"foo","prop2":"bar"}' some-array='["foo","bar"]'></test-button>`);

    let element = await queryDOM(document, 'test-button');

    assertAttributes(element);
});

it("check setAttribute function", async () => {
    const document = defineElement(TestButtonAttributes(), 'test-button');

    const button = document.createElement('test-button');
    button.setAttribute("some-string", "hello");
    button.setAttribute("some-bool", "true");
    button.setAttribute("some-number", "9999");
    button.setAttribute("some-array", '["foo", "bar"]');
    button.setAttribute("some-object", '{"prop1": "foo", "prop2": "bar"}');

    document.body.appendChild(button);

    let element = await queryDOM(document, 'test-button');

    assertAttributes(element);
});

it("check children text", async () => {
    const TestButton = ({ children }) => <button>{children}</button>;

    const document = defineElement(TestButton, 'test-button');

    const button = document.createElement('test-button');
    button.innerText = "hello";
    document.body.appendChild(button);

    let element = await queryDOM(document, 'test-button');

    expect(element.firstChild.innerText).toBe("hello");
});

it("check children text", async () => {
    const TestFirstContent = ({ children }) => <div>{children}</div>;
    const TestSecondContent = ({ children }) => <div>{children}</div>;

    const window = new Window();
    const document = window.document;

    defineElement(TestFirstContent, 'test-first-content', window);
    defineElement(TestSecondContent, 'test-second-content', window);

    document.write(`<test-first-content>
        <test-second-content>hello</test-second-content>
    </test-first-content>`);

    let element = await queryDOM(document, 'test-first-content');

    expect(element.firstChild.nodeName).toBe("DIV");
    expect(element.firstChild.firstChild.nodeName).toBe("TEST-SECOND-CONTENT");
    expect(element.firstChild.firstChild.firstChild.nodeName).toBe("DIV");
    expect(element.firstChild.firstChild.firstChild.innerText).toBe("hello");
});

/**
 * @steps
 * - create component which using useSate
 * - by default the component render BUTTON
 * - if the user click on this button, the second state will render SPAN
 * - verify that before clicking on button it's a BUTTON and after it will be SPAN
 */
it("check use state", async () => {
    const TestButton = () => {
        const [hideButton, setHideButton] = useState(false);

        if (hideButton) {
            return <span>span</span>
        } else {
            return <button onClick={() => setHideButton(true)}>button</button>
        }
    }

    const document = defineElement(TestButton, 'test-button');

    const button = document.createElement('test-button');
    document.body.appendChild(button);

    let element = await queryDOM(document, 'test-button');

    expect(element.firstChild.nodeName).toBe("BUTTON");
    expect(element.firstChild.innerText).toBe("button");

    element.firstChild.click();

    element = await queryDOM(document, 'test-button');

    expect(element.firstChild.nodeName).toBe("SPAN");
    expect(element.firstChild.innerText).toBe("span");
});

it("check component render many elements", async () => {
    const TestSpans = () => (
        <>
            <span>span1</span>
            <span>span2</span>
            <span>span3</span>
        </>
    );

    const document = defineElement(TestSpans, 'test-spans');

    const spans = document.createElement('test-spans');
    document.body.appendChild(spans);

    let element = await queryDOM(document, 'test-spans');

    expect(element.childElementCount).toBe(3);

    element.childNodes.forEach((child) => {
        expect(child.nodeName).toBe("SPAN");
    });
});


it("check dispatch event", async () => {
    const TestButton = ({ rootElement }) => {
        const buttonClicked = () => {
            const event = new CustomEvent('btnClicked')
            rootElement.dispatchEvent(event)
        }

        return <button onClick={buttonClicked}>button</button>;
    };

    const document = defineElement(TestButton, 'test-button');

    const button = document.createElement('test-button');

    button.addEventListener('btnClicked', function () {
        button.dataset.hasBeenClicked = "true";
    });

    document.body.appendChild(button);

    let element = await queryDOM(document, 'test-button');

    expect(element.dataset.hasBeenClicked).toBeUndefined();

    element.firstChild.click();

    element = await queryDOM(document, 'test-button');

    expect(element.dataset.hasBeenClicked).toBe("true");
});

it("check ref component", async () => {
    const TestInput = forwardRef((props, ref) => {
        return <input ref={ref} type="text"/>;
    });

    const options = {returnElement: true, hasReactRef: true};

    class WCInput extends register(TestInput, null, React, ReactDOM, options)
    {
        focusInput() {
            this.getReactRef().focus();
        }
    }

    const window = new Window();

    window.customElements.define("test-input", WCInput);
    const document = window.document;

    const input = document.createElement('test-input');
    document.body.appendChild(input);

    let element = await queryDOM(document, 'test-input');

    element.focusInput();

    element = await queryDOM(document, 'test-input');

    expect(document.activeElement).toBe(element.firstChild);
});

it("check ref component with function that return value", async () => {
    const TestInput = forwardRef(({value}, ref) => {

        useImperativeHandle(ref, () => ({
            isValid: () => {
                return value === "hello";
            }
        }));

        return <input type="text" defaultValue={value}/>;
    });

    TestInput.componentProps = {
        value: String
    }

    const options = {returnElement: true, hasReactRef: true};

    class WCInput extends register(TestInput, null, React, ReactDOM, options)
    {
        isValid() {
            return this.getReactRef().isValid();
        }
    }

    const window = new Window();

    window.customElements.define("test-input", WCInput);
    const document = window.document;

    const input = document.createElement('test-input');
    document.body.appendChild(input);

    let element = await queryDOM(document, 'test-input');

    expect(element.isValid()).toBe(false);

    element.value = "hello";

    element = await queryDOM(document, 'test-input');

    expect(element.isValid()).toBe(true);
});

it("check multiple children", async () => {
    const TestContainer = ({ children }) =>  <div>{children}</div>;

    const document = defineElement(TestContainer, 'test-container');

    document.write(`<test-container>
        <p>Paragraph</p>
        <div>First div</div>
        <div>Second div</div>
    </test-container>`);

    let element = await queryDOM(document, 'test-container');

    expect(element.firstChild.childElementCount).toBe(3);

    const children = element.firstChild.childNodes;

    expect(children[0].nodeName).toBe("P");
    expect(children[0].innerText).toBe("Paragraph");

    expect(children[1].nodeName).toBe("DIV");
    expect(children[1].innerText).toBe("First div");

    expect(children[2].nodeName).toBe("DIV");
    expect(children[2].innerText).toBe("Second div");
});

it("check slots", async () => {
    const TestContainer = ({ slot1, slot2 }) =>  <div>{slot1}{slot2}</div>;

    TestContainer.componentProps = {
        slot1: Node,
        slot2: Node
    }

    await assertNode(TestContainer);
});

it("check slots using prop-types", async () => {
    const TestContainer = ({ slot1, slot2 }) =>  <div>{slot1}{slot2}</div>;

    TestContainer.propTypes = {
        slot1: PropTypes.node,
        slot2: PropTypes.node
    }

    await assertNode(TestContainer);
});

it("check many elements including slot in same page", async () => {
    const TestContainer = ({ body }) =>  <div>{body}</div>;

    TestContainer.componentProps = {
        body: Node,
    }

    const document = defineElement(TestContainer, 'test-container');

    document.write(`
        <test-container id="container1"><slot name="body">foo</slot></test-container>
        <test-container id="container2"><slot name="body">bar</slot></test-container>
    `);

    const element1 = await queryDOM(document, '#container1');
    const element2 = await queryDOM(document, '#container2');

    expect(element1.firstChild.firstChild.innerText).toBe("foo");
    expect(element2.firstChild.firstChild.innerText).toBe("bar");
});

it("check property changed", async () => {
    const TestButton = ({ label }) => <button>{label}</button>;

    TestButton.componentProps = {
        label: String
    }

    const document = defineElement(TestButton, 'test-button');

    document.write(`<test-button label="foo"></test-button>`);

    let element = await queryDOM(document, 'test-button');

    expect(element.firstChild.innerText).toBe("foo");

    element.label = "bar"

    element = await queryDOM(document, 'test-button');

    expect(element.firstChild.innerText).toBe("bar");
    expect(element.getAttribute("label")).toBe("bar");
});

it("check getAttributes and update props", async () => {
    const document = defineElement(TestButtonAttributes(), 'test-button');

    const button = document.createElement('test-button');
    button.someString = "hello";
    button.someBool = true;
    button.someNumber = 9999;
    button.someObject = { prop1: "foo", prop2: "bar" };
    button.someArray = ["foo", "bar"];
    document.body.appendChild(button);

    let element = await queryDOM(document, 'test-button');

    assertAttributes(element);

    element.someString = "bye";
    element.someBool = false;
    element.someNumber = 5555;
    element.someObject = { name: "joe", city: "paris" };
    element.someArray = [1, 2];

    element = await queryDOM(document, 'test-button');

    expect(element.getAttribute("some-string")).toBe("bye");
    expect(element.getAttribute("some-bool")).toBe("false");
    expect(element.getAttribute("some-number")).toBe("5555");
    expect(element.getAttribute("some-object")).toBe('{"name":"joe","city":"paris"}');
    expect(element.getAttribute("some-array")).toBe('[1,2]');
});

it("check child with empty string", async () => {
    const TestContainer = ({ children }) => <div>{children}</div>;

    const document = defineElement(TestContainer, 'test-container');

    document.write(`<test-container>
        <button>Button</button>
    </test-container>`);

    let element = await queryDOM(document, 'test-container');
    let buttonNode = element.firstElementChild.firstElementChild;

    expect(buttonNode.nodeName).toBe("BUTTON");
    expect(buttonNode.innerText).toBe("Button");
});

it("check function inside component that change value", async () => {
    const TestInput = ({ value }) => {
        return <input defaultValue={value} type="text"/>;
    };

    TestInput.componentProps = {
        value: String
    }

    class WCInput extends register(TestInput, null, React, ReactDOM, {returnElement: true})
    {
        setDefaultValue() {
            this.value = 'Default value';
        }
    }

    const window = new Window();

    window.customElements.define("test-input", WCInput);
    const document = window.document;

    const input = document.createElement('test-input');
    document.body.appendChild(input);

    let element = await queryDOM(document, 'test-input');

    expect(element.firstChild.defaultValue).toBe('');
    expect(element.value).toBeNull();

    element.setDefaultValue();

    element = await queryDOM(document, 'test-input');

    expect(element.firstChild.defaultValue).toBe('Default value');
    expect(element.value).toBe('Default value');
});

it("check cascade children", async () => {
    const TestContainer = ({ children }) => <div>{children}</div>;

    const document = defineElement(TestContainer, 'test-container');

    document.write(`<test-container>
        <h1>foo bar <span><i></i></span></h1>
    </test-container>`);

    let element = await queryDOM(document, 'test-container');
    let div = element.firstChild;

    expect(div.nodeName).toBe("DIV");
    expect(div.firstChild.nodeName).toBe("H1");
    expect(div.firstChild.childNodes[0].nodeName).toBe("#text");
    expect(div.firstChild.childNodes[1].nodeName).toBe("SPAN");
    expect(div.firstChild.childNodes[1].firstChild.nodeName).toBe("I");
});

it("check with prop-types", async () => {
    const TestButton = ({ someString, someBool, someNumber, someArray, someObject }) =>
        <button data-string={someString}
                data-bool={someBool}
                data-number={someNumber}
                data-prop1={someObject.prop1}
                data-prop2={someObject.prop2}
                data-elem1={someArray[0]}
                data-elem2={someArray[1]}>
            button
        </button>;

    TestButton.propTypes = {
        someString: PropTypes.string,
        someBool: PropTypes.bool,
        someNumber: PropTypes.number,
        someArray: PropTypes.array,
        someObject: PropTypes.object,
    };

    const document = defineElement(TestButton, 'test-button');

    const button = document.createElement('test-button');
    button.someString = "hello";
    button.someBool = true;
    button.someNumber = 9999;
    button.someObject = { prop1: "foo", prop2: "bar" };
    button.someArray = ["foo", "bar"];

    document.body.appendChild(button);

    let element = await queryDOM(document, 'test-button');

    assertAttributes(element);
});

it("check class name exist", async () => {
    const TestButton = () => <button>Button</button>;

    const document = defineElement(TestButton, 'test-button');

    document.write(`<test-button></test-button>`);

    let element = await queryDOM(document, 'test-button');

    expect(element.classList.contains('html-element')).toBeTruthy();
});

it("render simple button and check if is hydrated", async () => {
    const TestButton = ({ label }) => <button>{label}</button>;

    TestButton.componentProps = {
        label: String
    }

    const document = defineElement(TestButton, 'test-button');

    document.write(`<test-button label="Button content"></test-button>`);

    let element = await queryDOM(document, 'test-button');

    expect(element.getAttribute("custom-state")).toBe('hydrated');
});

it("check null value of string props", async () => {
    const TestButton = ({ label }) => <button>{label}</button>;

    TestButton.componentProps = {
        label: String
    }

    const document = defineElement(TestButton, 'test-button');

    const button = document.createElement('test-button');
    button.label = null;

    let element = await queryDOM(document, 'test-button');

    document.body.appendChild(button);

    element = await queryDOM(document, 'test-button > button');

    expect(element.innerText.length).toBe(0);
});

it("check value attribute of input", async () => {
    const TestDiv = ({ children }) => <div>{children}</div>;

    const document = defineElement(TestDiv, 'test-div');

    document.write(`<test-div>
        <input type="text" value="toto">
    </test-div>`);

    let element = await queryDOM(document, 'test-div input');

    expect(element.value).toBe('toto');
});