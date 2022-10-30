import parsePropTypes from 'parse-prop-types';
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
    let propType = propsTypes[propName]?.type?.name;

    switch (propType) {
        case "number":
            propValue = Number(propValue);
            break;
        case "bool":
            propValue = !/^(false|0)$/i.test(propValue);
            break;
        case "array":
        case "object":
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
 * @param modeShadow {Boolean}
 *
 * @return HTMLElement
 */
export function register(ReactComponent, name, React, ReactDOM, modeShadow = false) {
    const propsTypes = parsePropTypes(ReactComponent);

    class WebComponent extends HTMLElement {
        reactRoot = null;
        reactChildren = null;

        connectedCallback() {
            this.reactChildren = parseChildren(this.innerHTML); // extract and store children elements
            this.renderRoot();
        }

        renderRoot() {
            let props = this.getProps();

            props.rootElement = this; // inject web component inside ReactComponent props (can be used to dispatch events)

            if (!this.reactRoot) { // create React root for the first rendering
                let container = modeShadow ? this.attachShadow({ mode: 'open' }) : this;
                this.reactRoot = ReactDOM.createRoot(container);
            }

            this.reactRoot.render(<ReactComponent {...props}>{this.reactChildren}</ReactComponent>);
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

    customElements.define(name, WebComponent);
}
