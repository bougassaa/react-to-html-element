[![Node.js CI](https://github.com/bougassaa/react-to-html-element/actions/workflows/node.js.yml/badge.svg?branch=master)](https://github.com/bougassaa/react-to-html-element/actions/workflows/node.js.yml)
[![made-with-javascript](https://img.shields.io/badge/Made%20with-JavaScript-1f425f.svg)](https://www.javascript.com)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/bougassaa/react-to-html-element/graphs/commit-activity)
[![GitHub latest commit](https://badgen.net/github/last-commit/bougassaa/react-to-html-element)](https://github.com/bougassaa/react-to-html-element/commit)
[![Npm package version](https://badgen.net/npm/v/react-to-html-element)](https://www.npmjs.com/package/react-to-html-element)
# react-to-html-element

`react-to-html-element` turns a React component into a Web Component. To see a practical case of how to use in your existing applications, see the [Example](#example) section _(after reading the documentation of course 😊)_

Sections :

- [Basic usage](#usages)
- [Extend the WebComponent](#extend-the-webcomponent)
- [Slots](#slots)
- [RootElement](#rootelement)
- [Usage of Ref](#usage-of-ref)
- [Update attributes](#update-attributes)
- [API](#api)
  - [Conflicts to avoid](#conflicts-to-avoid)
- [Example](#example)

## Usages
The React component must declare its properties and their types in the static `componentProps` attribute (or [prop-types](https://www.npmjs.com/package/prop-types)), as in the example below.

```js
import React from 'react';
import PropTypes from "prop-types"; // add this line, if you want to declare with PropTypes

const MyButton = ({ someBool, someNumber, someString, someObject, someArray, someSlot, children }) => {
    // do anything here with properties
    return (
        <button disabled={someBool} data-identifier={someNumber} data-extra={someString}>
            {children}
        </button>
    );
}

// Declare as below without using prop-types
MyButton.componentProps = {
    someBool: Boolean,
    someNumber: Number,
    someString: String,
    someObject: Object,
    someArray: Array,
    someSlot: Node,
    someFunc: Function,
}

// Or else using prop-types 
MyButton.propTypes = {
    someBool: PropTypes.bool,
    someNumber: PropTypes.number,
    someString: PropTypes.string,
    someObject: PropTypes.object,
    someArray: PropTypes.array,
    someSlot: PropTypes.node,
    someFunc: PropTypes.func,
}

export default MyButton;
```

Then after declaring the properties, you must register your React components as WebComponent, like this :

```js
import React from 'react';
import * as ReactDOM from "react-dom/client";
import { register } from "react-to-html-element";
import MyButton from "./src/MyButton";

register(MyButton, 'my-button', React, ReactDOM);
```

It's up to you to find the ideal location to register your components and then build them, export them, publish them etc... (you can imagine publishing them to a CDN, npm...)

Use of the web component created :

```html
<html>
<body>
   <my-button some-bool="true" some-number="45" some-string="Hello" some-object='{"name": "Will"}' some-array="[1, 2, 3]">
       It's a Button
   </my-button>
</body>
</html>
```

## Extend the WebComponent
You can create an extension of the WebComponent to suit your needs, by adding `{returnElement: true}` as options. and then it's up to you to define the WebComponent in the DOM.
```js
// ...
import { register } from "react-to-html-element";
import MyButton from "./src/MyButton";

class WCButton extends register(MyButton, null, React, ReactDOM, {returnElement: true})
{
    constructor(props) {
        super(props);
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('Component connected to the DOM');
    }
}

customElements.define('my-button', WCButton); // define your component to the DOM
```

## Slots
It is possible to add [slots](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot) in your custom elements. They will be added to the React component props. Here is an example of how to do it :
```html
<my-dialog>
    <slot name="header">...</slot>
    <slot name="body">...</slot>
    <slot name="footer">...</slot>
</my-dialog>
<!-- Or else you can do as below -->
<my-dialog>
    <h3 slot="header">...</h3>
    <p slot="body">...</p>
    <div slot="footer">...</div>
</my-dialog>
```
In your React component :
```js
import React from 'react';

const MyDialog = ({ header, body, footer }) => {
    return (
        <div>
            <div>{header}</div>
            <div>{body}</div>
            <div>{footer}</div>
        </div>
    );
}

MyDialog.componentProps = {
    header: Node,
    body: Node,
    footer: Node,
}

export default MyDialog;
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

## Usage of Ref
Let's take the example of a React component that has a function that can be called from the DOM, for example validating that an input is valid and returning `true` if it is or otherwise `false`.

```js
import React, {forwardRef, useImperativeHandle} from 'react';

const MyInput = forwardRef(({placeholder}, ref) => {

    useImperativeHandle(ref, () => ({
        isValid: () => {
            // put logic here
            return true; // or return false
        }
    }));

    return <input placeholder={placeholder} type="text"/>;
});

MyInput.componentProps = {
    placeholder: String,
}

export default MyInput;
```
There are 3 important points :

- The component must be wrapped with [forwardRef](https://reactjs.org/docs/react-api.html#reactforwardref) hook.
- Add as second parameter the variable `ref`, example `(props, ref) or ({props1, prop2}, ref)`.
- Use the [useImperativeHandle](https://reactjs.org/docs/hooks-reference.html#useimperativehandle) hook to expose functions outside the component.

After doing that, now here is an example of how to register the component :
```js
// ...
import { register } from "react-to-html-element";
import MyInput from "./src/MyInput";

class WCInput extends register(MyInput, null, React, ReactDOM, {returnElement: true, hasReactRef: true})
{
    constructor(props) {
        super(props);
    }
    
    async isInputValidAsync() {
        let ref = await this.getAsyncReactRef();
        return ref.isValid(); // call the React component function
    }
    
    isInputValid() { // or you can do it like this
        return this.getReactRef().isValid(); // call the React component function
    }
}

customElements.define('my-input', WCInput); // define your component to the DOM

// call function like this :
let input = document.querySelector('my-input');
let isValid = input.isInputValid();

// or with async (inside async function) :
let input = document.querySelector('my-input');
let isValid = await input.isInputValidAsync();
```
The asynchronous should be used in case the WebComponent may not be ready in the DOM yet, to avoid having `undefined`

Below is another example of using the ref to sibling the input inside a React component and toggle focus on it :
```js
// ...
const MyInput = forwardRef((props, ref) => {
    return <input ref={ref} type="text"/>;
});

class WCInput extends register(MyInput, null, React, ReactDOM, {returnElement: true, hasReactRef: true})
{
    // ...
    focusInput() {
        this.getReactRef().focus(); // call focus method of input
    }
}

// clicking on a button activates the focus on the input :
let input = document.querySelector('my-input');

button.addEventListener('click', function () {
    input.focusInput();
});
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

Function attributes need a reference to declared function:
```html

<my-button handle-click="sayHello"></my-button>
<my-button handle-click="Greeting.sayHello"></my-button>

<script>
  function sayHello() { ... }
  
  class Greeting {
    static sayHello() { ... }
  }
</script>

// and retrieve the function inside you React component (props.handleClick)
```
## API
The `register` function has as parameters :

- `ReactComponent` The React component that needs to be turned into a WebComponent.
- `name` The name of the desired WebComponent tag.
- `React` The version of [React](https://www.npmjs.com/package/react) that was used to create the components.
- `ReactDOM` The version of [ReactDOM](https://www.npmjs.com/package/react-dom) that was used to create the components.
- `options` : object of options `default = {modeShadow: false, returnElement: false, hasReactRef: false, className: "html-element"}`
  - `modeShadow` Create components in [shadow](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM) mode.
  - `returnElement` The function returns the WebComponent to be overridden
  - `hasReactRef` The React component will have [ref](https://reactjs.org/docs/refs-and-the-dom.html) functionality enabled
  - `className` CSS class that will be added to the HTML container

### Conflicts to avoid
There are points to know to allow the proper functioning of this package:

- If you rewrite the `connectedCallback` method of the returned component always call the parent by doing: `super.connectedCallback();`
- The `children`, `rootElement` and `ref` properties do not need to be declared, they will be automatically injected into the component.
- Do not use these properties in your components: `custom` `custom-parent` `custom-state`
- If you encounter a problem of [FOUC](https://en.wikipedia.org/wiki/Flash_of_unstyled_content), flickering, glitch (visual problem), add these CSS rules:
```css
[custom]:not([custom-state="hydrated"]) {
    visibility: hidden;
}

:not(:defined) {
    visibility: hidden;
}
```

## Example
See example on codesandbox: [https://codesandbox.io/s/react-to-html-element-397stp](https://codesandbox.io/s/react-to-html-element-397stp)

To go further, you can imagine for example having a component library in React, which you could export to all your applications, here is an example among hundreds that you could imagine.

Start by creating a React app using [create-react-app](https://reactjs.org/docs/create-a-new-react-app.html). You can base yourself on the example in [codesandbox](https://codesandbox.io/s/react-to-html-element-397stp), it's exactly the same things except that we will talk about the build and include in your applications.

```
npx create-react-app my-web-components
cd my-web-components
```
You can remove all the files created by create-react-app inside the `src` folder, it's up to you to create your tree (structure). You can imagine something like this :

```
my-web-components/
└── src/
    ├── components/
    │   ├── MyButton.jsx
    │   ├── MyInput.jsx
    │   └── ...
    ├── layouts/
    │   ├── Header.jsx
    │   ├── Footer.jsx
    │   └── ...
    ├── style/
    │   ├── index.css
    │   ├── my-button.css
    │   ├── my-input.css
    │   └── ...
    └── index.js
package.json
```

Install `react-to-html-element` in your project:

```
npm install react-to-html-element
```

Then it's up to you, from the README and the examples in codesandbox, create your components and **register** them in the `src/index.js` file!

Then we will use the react-scripts build command which is already installed with create-react-app, being at the root of your project and doing this command :

```
npm run build
```

After the command completes, there is a `build` folder created in the root. Inside are the compiled and minified files, for example :

```
build/static/js/main.e77e15c3.js
build/static/css/main.2e73bf20.css    👈 and if you included css
```

These files contain your WebComponents ready to be used anywhere! How to use them :

```html
<!doctype html>
<html>
<head>
    <link rel="stylesheet" href="build/static/css/main.2e73bf20.css">
</head>
<body>
    <my-button>Button</my-button>

    <script src="build/static/js/main.e77e15c3.js"></script> <-- put the JS build here
</body>
</html>
```
