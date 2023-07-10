import { WcagContrastLevel, computeColorContrast } from "./wcag-contrast.mjs";

class ContrastChip extends HTMLElement {
  constructor() {
    super();
    this.styleNode = document.createElement('style');
    this.styleNode.textContent = `
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
      .great-contrast::after {
        content: 'contrast:' attr(data-contrast-ratio) ' :D';
        color: #a0ffa0;
        font-weight: bold;
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
    `

    this.chipNode = document.createElement('span');
    this.chipNode.id = 'contrast';
  }

  connectedCallback() {
    this.attachShadow({mode: 'open'});
    this.shadowRoot.append(this.styleNode, this.chipNode);
  }

  static get observedAttributes() {
    return ['foreground-color', 'background-color'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    this.updateContrast();
  }

  foregroundColor() {
    return this._attributeOr('foreground-color', '#000000');
  }
  backgroundColor() {
    return this._attributeOr('background-color', '#000000');
  }

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
  updateContrast() {
    const {ratio, maxLevel} = this._computeContrast();
    this.chipNode.setAttribute('data-contrast-ratio', ratio.toFixed(2));
    this.chipNode.setAttribute('data-wcag-max-level', maxLevel);
    switch (maxLevel) {
      case WcagContrastLevel.AA_LARGE:
        this.chipNode.className = 'meh-contrast';
        break;
      case WcagContrastLevel.AA:
        this.chipNode.className = 'good-contrast';
        break;
      case WcagContrastLevel.AAA:
        this.chipNode.className = 'great-contrast';
        break;
      default:
        this.chipNode.className = 'bad-contrast';
    }
  }

  /**
   * @returns {{ratio: number, maxLevel: WcagContrastLevel?}}
   */
  _computeContrast() {
    const backgroundColor = this.backgroundColor();
    const foregroundColor = this.foregroundColor();
    const ratio = computeColorContrast(foregroundColor, backgroundColor);
    const maxLevel = WcagContrastLevel.strictestLevelOfRatio(ratio);
    console.debug('contrast ratio of fg color', foregroundColor, 'to bg',
                  backgroundColor, 'is', ratio, 'at WCAG level',
                  maxLevel);
    return {ratio, maxLevel};
  }
}
customElements.define('contrast-chip', ContrastChip);

export {ContrastChip};