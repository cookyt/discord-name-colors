import { WcagContrastLevel, computeColorContrast } from "./wcag-contrast.mjs";

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

      #contrast {
        display: inline-block;
        height: 100%;
        background-color: hsl(221.54deg 12.31% 4.92%);
        text-align: center;
      }
      #contrast::after {
        display: inline-block;
        padding-left: .1em;
        padding-right: .1em;
      }
      .good-contrast::after {
        content: 'contrast:' attr(data-contrast-ratio) ' :)';
        color: #a0ffa0;
      }
      .meh-contrast::after {
        content: 'contrast:' attr(data-contrast-ratio) ' :/';
        color: #efef7b;
      }
      .bad-contrast::after {
        content: 'contrast:' attr(data-contrast-ratio) ' :(';
        color: #ff6161;
      }

      #username {
        color: var(--name-color);
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
        <span id="contrast"></span>
      </div>
      <span id="username"></span>
    `;

    this.colorCodeNode = this.wrapperNode.querySelector('#colorcode');
    this.contrastNode = this.wrapperNode.querySelector('#contrast');
    this.usernameNode = this.wrapperNode.querySelector('#username');
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
    this._updateContrast();
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
   * Recomputes the contrast of this color-chip and updates the chip's
   * internal styles to reflect this. Call this any time the name-color or
   * background color changes.
   */
  _updateContrast() {
    const {ratio, maxLevel} = this._computeContrast();
    this.contrastNode.setAttribute('data-contrast-ratio', ratio.toFixed(2));
    this.contrastNode.setAttribute('data-wcag-max-level', maxLevel);
    switch (maxLevel) {
      case WcagContrastLevel.AA_LARGE:
        this.contrastNode.className = 'meh-contrast';
        break;
      case WcagContrastLevel.AA:
      case WcagContrastLevel.AAA:
        this.contrastNode.className = 'good-contrast';
        break;
      default:
        this.contrastNode.className = 'bad-contrast';
    }
  }

  /**
   * @returns {{ratio: number, maxLevel: WcagContrastLevel?}}
   */
  _computeContrast() {
    const allBackgroundColors =
      this.computedStyleMap().get('--theme-background-color');
    if (!allBackgroundColors) {
      console.debug(
          'This chip has no background color, we cannot compute the contrast.');
      return {ratio: 1, maxLevel: null}
    }

    const backgroundColor = allBackgroundColors[0];
    const foregroundColor = this.nameColor();
    const ratio = computeColorContrast(foregroundColor, backgroundColor);
    const maxLevel = WcagContrastLevel.strictestLevelOfRatio(ratio);
    console.debug('contrast ratio of fg color', foregroundColor, 'to bg',
                  backgroundColor, 'is', ratio, 'at WCAG level', maxLevel);
    return {ratio, maxLevel};
  }
}

customElements.define('color-chip', ColorChip);