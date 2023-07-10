import { ContrastChip } from "./contrast-chip.mjs";

class ColorChip extends HTMLElement {
  constructor() {
    super();
    this.styleNode = document.createElement('style');
    this.styleNode.textContent = `
      #wrapper {
        padding: 10px;
        font-size: large;
        text-align: center;
        width: fit-content;
      }

      #colorcode-container {
        font-size: medium;
        display: flex;
        justify-content: space-around;
        margin: 10px 0;
      }

      #colorcode {
        display: inline-block;
        height: 100%;
        width: 1.5em;
        text-align: center;
        font-weight: bold; color: var(--theme-background-color);
        background-color: var(--name-color);
      }

      #username { color: var(--name-color); }
      #hexcolor {
        display: block;
        color: var(--name-color);
        font-size: smaller;
        font-family: monospace;
      }

      #wrapper {
        display: flex;
        flex-direction: column;
      }
    `;

    this.wrapperNode = document.createElement('div');
    this.wrapperNode.id = 'wrapper';
    this.wrapperNode.innerHTML = `
      <div id="colorcode-container">
        <span id="colorcode"></span>
        <contrast-chip></contrast-chip>
      </div>
      <span id="username"></span>
      <span id="hexcolor"></span>
    `;

    this.colorCodeNode = this.wrapperNode.querySelector('#colorcode');
    /** @type {ContrastChip} */
    this.contrastNode = this.wrapperNode.querySelector('contrast-chip');
    this.usernameNode = this.wrapperNode.querySelector('#username');
    this.hexcolorNode = this.wrapperNode.querySelector('#hexcolor');
  }

  /**
   * Callback invoked by the browser when this element is attached to the DOM.
   * See: https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#using_the_lifecycle_callbacks
   */
  connectedCallback() {
    console.debug('color-chip connected', this);
    this.attachShadow({mode: "open"});
    this.attributeStyleMap.set('display', 'block');
    this.shadowRoot.append(this.styleNode, this.wrapperNode);
    this.attributeChangedCallback();
  }

  /**
   * Tells the browswer which attributes of this element we want to watch for
   * changes.
   */
  static get observedAttributes() {
    return ['color-code', 'name-color', 'username'];
  }

  /**
   * Callback invoked by the browser when one of the attributes returned by
   * `observedAttributes` changes.
   * See: https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#using_the_lifecycle_callbacks
   */
  attributeChangedCallback(name, oldValue, newValue) {
    console.debug('attribute changed', name, oldValue, newValue);
    this.attributeStyleMap.set('--name-color', this.nameColor());
    this.colorCodeNode.innerText = this.colorCode();
    this.usernameNode.innerText = this.username();
    this.hexcolorNode.innerText = this.nameColor();
    this.updateContrast();
  }

  /** Sets the given attribute, or removes it if the value is `null`. */
  setOrRemoveAttribute(name, value) {
    if (value === null) { this.removeAttribute(name); }
    else { this.setAttribute(name, value); }
  }

  colorCode() { return this._attributeOr('color-code', '??'); }
  nameColor() { return this._attributeOr('name-color', '#000000'); }
  username() { return this._attributeOr('username', 'ExampleUsername'); }

  /**
   * Returns the given attribute or a default value if the attribute doesn't
   * exist.
   */
  _attributeOr(name, def) {
    const attr = this.attributes.getNamedItem(name);
    return attr ? attr.value : def;
  }

  /**
   * Updates this node's contrast-chip by re-fetching the current background and
   * foreground colors.
   */
  updateContrast() {
    console.debug('updateContrast on', this.colorCode())
    const allBackgroundColors =
      this.computedStyleMap().get('--theme-background-color');
    if (!allBackgroundColors) {
      console.debug(
          'This chip has no background color, we cannot compute the contrast.');
      this.contrastNode.removeAttribute('background-color');
      this.contrastNode.removeAttribute('foreground-color');
    } else {
      this.contrastNode.setAttribute('background-color', allBackgroundColors[0]);
      this.contrastNode.setAttribute('foreground-color', this.nameColor());
    }
  }
}

customElements.define('color-chip', ColorChip);

export {ColorChip};