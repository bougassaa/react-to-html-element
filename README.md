# react-to-html-element

`react-to-html-element` turns a React component into a Web Component.

## Usages
The React component must declare its properties using [proptypes](https://www.npmjs.com/package/prop-types).

```js
// ...
import PropTypes from 'prop-types';

const MyButton = ({ isDisabled, identifier, someString, someObject, someArray, children }) => {
    // do anything here with properties
    return <button disabled={isDisabled} data-identifier={identifier} data-extra={someString}>{children}</button>
}

MyButton.propTypes = {
    isDisabled: PropTypes.bool,
    identifier: PropTypes.number,
    someString: PropTypes.string,
    someObject: PropTypes.object,
    someArray: PropTypes.array,
}
```

The `children` and `rootElement` properties do not need to be declared, they will be automatically injected into the component.

Then after declaring the properties, you must register your React components as WebComponent, like this :

```js
import React from 'react';
import * as ReactDOM from "react-dom/client";

// ⚠️ always import react-to-html-element before importing your components
import { register } from "react-to-html-element";

import MyButton from "./src/MyButton";

register(MyButton, 'my-button', React, ReactDOM);
```

It's up to you to find the ideal location to register your components and then build them, export them, publish them etc... (you can imagine publishing them to a CDN, npm...)

Use of the web component created :

```html
<html>
<body>
   <my-button is-disabled="true" identifier="45" some-string="Hello" some-object='{"name": "Will"}' some-array="[1, 2, 3]">
       It's a Button
   </my-button>
</body>
</html>
```

## rootElement

This is a property injected into all registered React components, which corresponds to the instance of the WebComponent `rootElement instanceof HTMLElement`. For example, it can be used to trigger or intercept JavaScript events :

```js
function MyButton({ someString, rootElement }) {
    const buttonClicked = () => {
        const event = new CustomEvent('btnClicked', { detail: {identifier: 45}})
        rootElement.dispatchEvent(event)
    }

    return (
        <button onClick={buttonClicked}>{someString}</button>
    );
}
```
How to listen event :
```html
<html>
<body>
    <my-button some-string="Hello"></my-button>

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            let button = document.querySelector('my-button');

            button.addEventListener('btnClicked', function (e) {
                console.log('identifier clicked : ' + e.detail.identifier);
            });
        })
    </script>
</body>
</html>
```

## Update attributes
After the component has been rendered, you can update the attributes, and the component will be re-rendered :

```js
let button = document.querySelector('my-button');
button.someString = "Good bye";
// or
button.setAttribute("some-string", "Good bye");

button.someArray = [1, 2, 3];
button.someBool = true;
// ...
```
## API
The `register` function has as parameters :

- `ReactComponent` The React component that needs to be turned into a WebComponent.
- `name` The name of the desired WebComponent tag.
- `React` The version of [React](https://www.npmjs.com/package/react) that was used to create the components.
- `ReactDOM` The version of [ReactDOM](https://www.npmjs.com/package/react-dom) that was used to create the components.
- `modeShadow = false` Create components in [shadow](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM) mode.
