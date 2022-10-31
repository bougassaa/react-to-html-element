import {assert, expect, test, beforeEach} from 'vitest';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import React from "react";
import * as ReactDOM from "react-dom/client";
import PropTypes from "prop-types";
import { register } from "./index";

GlobalRegistrator.register();

test("basics with react", () => {
    let root = document.createElement('div');
    document.body.appendChild(root);

    const TestButton = ({ label }) => <button>{label}</button>;

    TestButton.propTypes = {
        label: PropTypes.string
    }

    register(TestButton, 'test-button', React, ReactDOM);

    const el = document.createElement('test-button');
    el.setAttribute('label', 'hello');

    root.appendChild(el);

    console.log(root.innerHTML);

    assert(true);
})

GlobalRegistrator.unregister();
