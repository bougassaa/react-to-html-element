import { expect, it } from 'vitest';
import React from "react";
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

it("check string property", async () => {
    const TestButton = ({ someString }) => <button data-string={someString}>Button</button>;

    TestButton.componentProps = {
        someString: String,
    }

    const document = defineElement(TestButton, 'test-button');

    const button = document.createElement('test-button');
    button.someString = "hello";
    document.body.appendChild(button);

    let element = await queryDOM(document, 'test-button');

    expect(element.firstChild.dataset.string).toBe("hello");
});

it("check boolean property", async () => {
    const TestButton = ({ isDisabled }) => <button disabled={isDisabled}>Button</button>;

    TestButton.componentProps = {
        isDisabled: Boolean,
    }

    const document = defineElement(TestButton, 'test-button');

    const button = document.createElement('test-button');
    button.isDisabled = true;
    document.body.appendChild(button);

    let element = await queryDOM(document, 'test-button');

    expect(element.firstChild.disabled).toBe(true);
});

it("check number property", async () => {
    const TestButton = ({ someNumber }) => <button data-number={someNumber}>Button</button>;

    TestButton.componentProps = {
        someNumber: Number,
    }

    const document = defineElement(TestButton, 'test-button');

    const button = document.createElement('test-button');
    button.someNumber = 9999;
    document.body.appendChild(button);

    let element = await queryDOM(document, 'test-button');

    expect(element.firstChild.dataset.number.toString()).toBe('9999');
});

it("check object property", async () => {
    const TestButton = ({ someObject }) => <button data-prop1={someObject.prop1} data-prop2={someObject.prop2}>Button</button>;

    TestButton.componentProps = {
        someObject: Object,
    }

    const document = defineElement(TestButton, 'test-button');

    const button = document.createElement('test-button');
    button.someObject = { prop1: "foo", prop2: "bar" };
    document.body.appendChild(button);

    let element = await queryDOM(document, 'test-button');

    expect(element.firstChild.dataset.prop1).toBe('foo');
    expect(element.firstChild.dataset.prop2).toBe('bar');
});

it("check array property", async () => {
    const TestButton = ({ someArray }) => <button data-elem1={someArray[0]} data-elem2={someArray[1]}>Button</button>;

    TestButton.componentProps = {
        someArray: Array,
    }

    const document = defineElement(TestButton, 'test-button');

    const button = document.createElement('test-button');
    button.someArray = ["foo", "bar"];
    document.body.appendChild(button);

    let element = await queryDOM(document, 'test-button');

    expect(element.firstChild.dataset.elem1).toBe('foo');
    expect(element.firstChild.dataset.elem2).toBe('bar');
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
