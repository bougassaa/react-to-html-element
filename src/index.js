import parsePropTypes from "parse-prop-types";
import HTMLParsedElement from 'html-parsed-element';
import { Parser, ProcessingInstructions } from "html-to-react";

const toCamelCase = (str = "") => {
    return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ""));
};

const toDashedStyle = (str = "") => {
    return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
};

// turn the innerHTML into React children
const parseChildren = (str) => {
    const isValidNode = (node) => {
        return !(node.type === "text" && !node.data.trim()); // remove empty text elements
    };

    const parser = new Parser();
    const processingInstructions = new ProcessingInstructions();
    const child = parser.parseWithInstructions(str, isValidNode, processingInstructions.defaultProcessingInstructions);

    if (!child) {
        return null;
    }

    return child instanceof Array ? child.filter(child => child !== false) : [child];
};

const getPropType = (typeInfo) => {
    if (typeof typeInfo === "object" && "type" in typeInfo) {
        return typeInfo.type.name;
    } else {
        return typeInfo;
    }
};

// convert attribute values to their defined types
const convertAttribute = (attribute, propsTypes) => {
    let propName = toCamelCase(attribute.name);
    let propValue = attribute.value;

    switch (getPropType(propsTypes[propName])) {
        case "number":
        case Number:
            propValue = Number(propValue);
            break;
        case "bool":
        case Boolean:
            propValue = !/^(false|0)$/i.test(propValue);
            break;
        case "object":
        case "array":
        case Array:
        case Object:
            propValue = JSON.parse(propValue);
            break;
    }

    return {
        name: propName,
        value: propValue
    }
};

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
    // default options merged with user options
    options = {...{modeShadow: false, returnElement: false, hasReactRef: false, className: "html-component"}, ...options}

    if (!React || !ReactDOM) {
        throw "React and ReactDOM parameters must not be empty";
    }

    // retrieve properties and their types from the component definition
    const propsTypes = ReactComponent.componentProps || parsePropTypes(ReactComponent) || {};

    class WebComponent extends HTMLParsedElement {
        reactRoot = null;
        reactElement = null;
        reactChildren = null;

        parsedCallback() {
            this.reactChildren = parseChildren(this.innerHTML); // extract and store children elements
            this.renderRoot();
        }

        renderRoot() {
            let props = {...this.getProps(), ...this.getSlots()};

            if (options.hasReactRef) {
                props.ref = React.createRef(); // inject ref parameter inside ReactComponent props (can be used to call function inside component)
            }

            props.rootElement = this; // inject web component inside ReactComponent props (can be used to dispatch events)

            if (!this.reactRoot) { // create React root for the first rendering
                let container = options.modeShadow ? this.attachShadow({ mode: "open" }) : this;

                if (options.className) {
                    container.classList.add(options.className);
                }

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

        getSlots() {
            let slots = {};

            if (this.reactChildren instanceof Array) {
                this.reactChildren.forEach(child => {
                    let name;

                    if (child.type === "slot" && child?.props?.name) {
                        name = child.props.name;
                    } else if (child?.props?.slot) {
                        name = child.props.slot;
                    }

                    const type = getPropType(propsTypes[name]);
                    if (name && (type === Node || type === "node")) {
                        slots[name] = child;
                    }
                })
            }

            return slots;
        }

        // eslint-disable-next-line no-unused-vars
        attributeChangedCallback(name, oldValue, newValue) {
            if (this.reactRoot) { // on each change of props, re-render the component
                this.renderRoot();
            }
        }

        getReactRef() {
            if (this.reactElement?.ref?.current) {
                return this.reactElement.ref.current;
            }
            this.warnRefProblem();
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
                        this.warnRefProblem();
                        clearInterval(interval);
                        reject(false);
                    }
                }, 0);
            });
        }

        warnRefProblem() {
            console.warn("Ref not available, possible causes are :\n- The component is not ready yet, use the getAsyncReactRef function instead.\n" +
                "- Check that the {hasReactRef: true} option has been added to the component registration\n- Check that you have wrapped the React component " +
                "with the state forwardRef\n\nSee the documentation for more info https://github.com/bougassaa/react-to-html-element#usage-of-ref");
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
                const v = typeof value === "object" ? JSON.stringify(value) : value;
                this.setAttribute(toDashedStyle(propName), v);
            },
        });
    })

    if (options.returnElement) {
        return WebComponent;
    }

    customElements.define(name, WebComponent);
}
