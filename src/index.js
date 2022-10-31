import { Parser, ProcessingInstructions } from 'html-to-react';

const toCamelCase = (str = "") => {
    return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''));
}

const toDashedStyle = (str = "") => {
    return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
}

const parseChildren = (str) => {
    const isValidNode = (node) => {
        return !(node.type === "text" && !node.data.trim()); // remove empty text elements
    }

    const parser = new Parser();
    const processingInstructions = new ProcessingInstructions();
    const child = parser.parseWithInstructions(str, isValidNode, processingInstructions.defaultProcessingInstructions);

    return child instanceof Array ? child.filter(child => child !== false) : child;
}

const convertAttribute = (attribute, propsTypes) => {
    let propName = toCamelCase(attribute.name);
    let propValue = attribute.value;

    switch (propsTypes[propName]) {
        case Number:
            propValue = Number(propValue);
            break;
        case Boolean:
            propValue = !/^(false|0)$/i.test(propValue);
            break;
        case Array:
        case Object:
            propValue = JSON.parse(propValue);
            break;
    }

    return {
        name: propName,
        value: propValue
    }
}

/**
 * @param ReactComponent {ReactComponent|function}
 * @param name {String}
 * @param React {React}
 * @param ReactDOM {ReactDOM}
 * @param options {Object}
 *
 * @return HTMLElement
 */
export function register(ReactComponent, name, React, ReactDOM, options = {}) {
    options = {...{modeShadow: false, returnElement: false, hasReactRef: false}, ...options}

    if (!React || !ReactDOM) {
        console.error("React and ReactDOM parameters must not be empty");
        return null;
    }

    const propsTypes = ReactComponent.componentProps ?? {};

    class WebComponent extends HTMLElement {
        reactRoot = null;
        reactElement = null;
        reactChildren = null;

        connectedCallback() {
            this.reactChildren = parseChildren(this.innerHTML); // extract and store children elements
            this.renderRoot();
        }

        renderRoot() {
            let props = this.getProps();

            if (options.hasReactRef) {
                props.ref = React.createRef(); // inject ref parameter inside ReactComponent props (can be used to call function inside component)
            }

            props.rootElement = this; // inject web component inside ReactComponent props (can be used to dispatch events)

            if (!this.reactRoot) { // create React root for the first rendering
                let container = options.modeShadow ? this.attachShadow({ mode: 'open' }) : this;
                this.reactRoot = ReactDOM.createRoot(container);
            }

            this.reactElement = React.createElement(ReactComponent, props, this.reactChildren);

            this.reactRoot.render(this.reactElement);
        }

        getProps() {
            return [...this.attributes]
                .filter(attr => toCamelCase(attr.name) in propsTypes)
                .map(attr => convertAttribute(attr, propsTypes))
                .reduce((props, prop) =>
                    ({...props, [prop.name]: prop.value}), {});
        }

        attributeChangedCallback(name, oldValue, newValue) {
            if (this.reactRoot) { // on each change of props, re-render the component
                this.renderRoot();
            }
        }

        getReactRef() {
            if (this.reactElement?.ref?.current) {
                return this.reactElement.ref.current;
            }
            console.warn("You're calling the ref when the React component isn't ready yet. Otherwise you forgot to use forwardRef to your React component")
        }

        getAsyncReactRef() {
            let time = Date.now();
            return new Promise((resolve, reject) => {
                let interval = setInterval(() => {
                    if (this.reactElement?.ref?.current) {
                        clearInterval(interval);
                        resolve(this.reactElement.ref.current);
                    }

                    if (time + 3000 < Date.now()) { // waiting for the component to be ready for 3 seconds max
                        console.warn("ref not found on this component, check that you have used forwardRef on your React component");
                        clearInterval(interval);
                        reject(false);
                    }
                }, 0);
            });
        }

        static get observedAttributes() {
            let propsNames = Object.keys(propsTypes);
            return [...new Set([...propsNames, ...propsNames.map(prop => toDashedStyle(prop))])];
        }
    }

    Object.keys(propsTypes).forEach(propName => {
        Object.defineProperty(WebComponent.prototype, propName, {
            get() {
                return this.getAttribute(toDashedStyle(propName));
            },
            set(value) {
                this.setAttribute(toDashedStyle(propName), value);
            },
        });
    })

    if (options.returnElement) {
        return WebComponent;
    }

    customElements.define(name, WebComponent);
}
