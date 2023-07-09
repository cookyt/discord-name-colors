/**
 * Adapted from https://medium.com/tamman-inc/create-your-own-color-contrast-checker-11d8b95dff5b
 */

/**
 * Compute the relative luminance of a color.
 *
 * See the defintion of relative luminance in the WCAG 2.0 guidelines:
 * https://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
 *
 * @param {number} r The red component (0-255)
 * @param {number} g The green component (0-255)
 * @param {number} b The blue component (0-255)
 * @returns {number} A value in the range [0,1] where 0 means "darkest black"
 *     and 1 means "lightest white".
 */
function computeLuminance(r, g, b) {
	let [lumR, lumG, lumB] = [r, g, b].map(component => {
		let srgb_val = component / 255;
		return srgb_val <= 0.03928
			? srgb_val / 12.92
			: Math.pow((srgb_val + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * lumR + 0.7152 * lumG + 0.0722 * lumB;
}

/**
 * Compute the contrast ratio between the relative luminance values of two
 * colors.
 *
 * See the definition of contrast ratio in the WCAG 2.0 guidelines:
 * https://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
 *
 * @param {number} luminance1 The relative luminance of the first color (0-1)
 * @param {number} luminance2 The relative luminance of the second color (0-1)
 * @returns {number}
 */
function computeLuminanceContrast(luminance1, luminance2) {
	let lighterLum = Math.max(luminance1, luminance2);
	let darkerLum = Math.min(luminance1, luminance2);
	return (lighterLum + 0.05) / (darkerLum + 0.05);
}

/**
 * @typedef {{r: number, g: number, b: number, a?: number}} RgbColor
 */

/**
 * @param {string} rgbaStr an 'rgb(1,2,3)' style color string. Can optionally
 * include alpha. E.g., 'rgba(1,2,3,4)'.
 *
 * @returns {RgbColor}
*/
function parseRgbaSerializedColor(rgbaStr) {
  let matches = rgbaStr.trim().match(/rgba?\(([ 0-9,.+-]*)\)/);
  if (!matches) {
    throw new Error('Not a valid rgb() color string.', rgbaStr);
  }

  const nums = matches[1].split(',').map((val) => {
    const f = parseFloat(val.trim());
    if (Number.isNaN(f)) throw new Error(`Cannot parse "${val}" as float`);
    return f;
  });
  if (nums.length < 3) {
    throw new Error('rgba string is too short.', rgbaStr);
  }
  if (nums.length > 4) {
    throw new Error('rgba string is too long.', rgbaStr);
  }

  let ret = {r: nums[0], g: nums[1], b: nums[2]};
  if (nums.length === 4) {
    ret.a = nums[3];
  }
  return ret;
}

/**
 * @param {string} color a CSS color string in either rgb() rgba() or hex
 * format.
 * @returns {RgbColor}
 */
function parseColor(color) {
  color = color.trim();
  const span = document.createElement('span');
  span.style.color = color;
  // Browser does the normalization to rgba() format. Can technically accept
  // several different CSS color serializations, but we'll conservatively only
  // say we support hex and rgb().
  const rgbColor = span.style.color;
  console.debug('Parsed color from', color, 'to', rgbColor);
  return parseRgbaSerializedColor(rgbColor);
}

/**
 * Compute the contrast ratio between two colors.
 *
 * See: https://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
 *
 * @param {string} color1 A serialized CSS color in either hex or rgb() format.
 * @param {string} color2 A serialized CSS color in either hex or rgb() format.
 * @returns {number} A value between [1, 21] where 1 means the two colors are
 *     perceptually the same, and 21 is the highest possible contrast.
 */
function computeColorContrast(color1, color2) {
	let [luminance1, luminance2] = [color1, color2].map(color => {
    const {r, g, b} = parseColor(color);
    console.debug('Parsed color RGB is', r, g, b);
		return computeLuminance(r, g, b);
	});
	return computeLuminanceContrast(luminance1, luminance2);
}

/**
 * Enum for the WCAG contrast requirements. Uses the class-enum pattern as
 * typified by the Enumify library.
 */
class WcagContrastLevel {
  // Fine for large-sized text.
  // Min ISO-recomended ratio for people 20/20 vision.
  static AA_LARGE = new WcagContrastLevel('AA for Large Text', 3);

  // Ok for general use.
  // Extrapolation of AA_LARGE for people with 20/40 vision.
  static AA = new WcagContrastLevel('AA', 4.5);

  // Ideal, especially for large blocks of text.
  // Extrapolation of AA_LARGE for people with 20/80 vision.
  static AAA = new WcagContrastLevel('AAA', 7);

  constructor(name, minRatio) {
    this._name = name;
    this.minRatio = minRatio;
  }

  /**
   * Determine whether the given contrast ratio meets WCAG requirements at any
   * level (AA Large, AA, or AAA).
   *
   * @param {number} ratio The contrast ratio in the range [1,21].
   * @returns {WcagContrastLevel?} The strictest level achieved by the given
   *     ratio, or null if the ratio fails at all levels.
   */
  static strictestLevelOfRatio(ratio) {
    let maxLevel = null;
    for (const level of WcagContrastLevel) {
      if (ratio < level.minRatio) break;
      if (maxLevel === null || level.minRatio > maxLevel.minRatio) {
        maxLevel = level;
      }
    }
    return maxLevel;
  }

  static * [Symbol.iterator]() {
    yield this.AA_LARGE;
    yield this.AA;
    yield this.AAA;
  }

  toString() { return `${this._name} (${this.minRatio}:1)`; }
}

export {WcagContrastLevel, computeColorContrast};