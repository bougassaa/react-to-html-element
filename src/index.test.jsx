import { expect, it } from 'vitest';
import React from "react";
import * as ReactDOM from "react-dom/client";
import { Window } from 'happy-dom';
import { register } from "./index";

const queryDOM = (document, selector) => new Promise((resolve => {
    setTimeout(_ => resolve(document.querySelector(selector)), 200);
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
})
