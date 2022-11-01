import { expect, it } from 'vitest';
import React, {useState} from "react";
import * as ReactDOM from "react-dom/client";
import { Window } from 'happy-dom';
import { register } from "./index";

const queryDOM = (document, selector) => new Promise((resolve => {
    setTimeout(_ => resolve(document.querySelector(selector)), 100);
}));

const defineElement = (ReactComponent, tagName) => {
    const element = register(ReactComponent, null, React, ReactDOM, {returnElement: true});
    const window = new Window();

    window.customElements.define(tagName, element);

    return window.document;
}

it("render simple button and check text inside", async () => {
    const TestButton = ({ label }) => <button>{label}</button>;

    TestButton.componentProps = {
        label: String
    }

    const document = defineElement(TestButton, 'test-button');

    const button = document.createElement('test-button');
    button.label = 'Button content';
    document.body.appendChild(button);

    let element = await queryDOM(document, 'test-button');

    expect(element.firstChild.nodeName).toBe('BUTTON');
    expect(element.firstChild.innerText).toBe('Button content');
});

it("check attribute setter", async () => {
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

    const document = defineElement(TestButton, 'test-button');

    const button = document.createElement('test-button');
    button.someString = "hello";
    button.someBool = true;
    button.someNumber = 9999;
    button.someObject = { prop1: "foo", prop2: "bar" };
    button.someArray = ["foo", "bar"];

    document.body.appendChild(button);

    let element = await queryDOM(document, 'test-button');

    expect(element.firstChild.dataset.string).toBe("hello");
    expect(element.firstChild.dataset.bool).toBe("true");
    expect(element.firstChild.dataset.number.toString()).toBe("9999");
    expect(element.firstChild.dataset.prop1).toBe("foo");
    expect(element.firstChild.dataset.prop2).toBe("bar");
    expect(element.firstChild.dataset.elem1).toBe("foo");
    expect(element.firstChild.dataset.elem2).toBe("bar");
});

it("check setAttribute function", async () => {
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

    const document = defineElement(TestButton, 'test-button');

    const button = document.createElement('test-button');
    button.setAttribute("some-string", "hello");
    button.setAttribute("some-bool", "true");
    button.setAttribute("some-number", "9999");
    button.setAttribute("some-array", '["foo", "bar"]');
    button.setAttribute("some-object", '{"prop1": "foo", "prop2": "bar"}');

    document.body.appendChild(button);

    let element = await queryDOM(document, 'test-button');

    expect(element.firstChild.dataset.string).toBe("hello");
    expect(element.firstChild.dataset.bool).toBe("true");
    expect(element.firstChild.dataset.number.toString()).toBe('9999');
    expect(element.firstChild.dataset.prop1).toBe("foo");
    expect(element.firstChild.dataset.prop2).toBe("bar");
    expect(element.firstChild.dataset.elem1).toBe("foo");
    expect(element.firstChild.dataset.elem2).toBe("bar");
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
