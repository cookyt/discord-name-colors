import {ColorChip} from "./color-chip.mjs";
import {ContrastChip} from "./contrast-chip.mjs";

function updateUsername() {
  console.debug('updateUsername called');
  const usernameInput = document.querySelector("#usernameInput");
  const usernameText = (usernameInput.value === "")
      ? null
      : usernameInput.value;
  const nodes = document.querySelectorAll("color-chip");
  for (/** @type {ColorChip} */ const node of nodes) {
    node.setOrRemoveAttribute('username', usernameText);
  }
}

function updateBackgroundColor() {
  console.debug('updateBackgroundColor called');
  /** @type {HTMLInputElement} */
  const body = document.querySelector('body');
  const lightMode = document.querySelector("#lightModeInput");
  if (lightMode.checked) {
    body.style.setProperty('--theme-background-color',
                            'var(--light-background-color)');
    body.style.setProperty('--theme-foreground-color',
                            'var(--light-foreground-color)');
  } else {
    body.style.setProperty('--theme-background-color',
                            'var(--dark-background-color)');
    body.style.setProperty('--theme-foreground-color',
                            'var(--dark-foreground-color)');
  }
  const nodes = document.querySelectorAll("color-chip");
  for (/** @type {ColorChip} */ const node of nodes) {
    node.updateContrast();
  }
}

function appendColorChip() {
  const newColorNode = document.querySelector('#newColorInput');
  const chip = document.createElement('color-chip');
  chip.setAttribute('name-color', newColorNode.value);

  const col = document.createElement('div');
  col.className = 'chip-col';
  col.appendChild(chip);

  const container = document.querySelector('#chip-container');
  container.appendChild(col);
}

function updateContrastPreview() {
  /** @type {ContrastChip} */
  const input = document.querySelector('#newColorInput');
  const chip = document.querySelector('#contrastPreview');

  const allBackgroundColors =
    input.computedStyleMap().get('--theme-background-color');
  if (allBackgroundColors) {
    chip.setAttribute('background-color', allBackgroundColors[0]);
    chip.setAttribute('foreground-color', input.value);
  } else {
    chip.removeAttribute('background-color');
    chip.removeAttribute('foreground-color');
  }
}

// I think Chrome's color picker is broken. Doesn't let you copy/paste hex
// codes. See: https://github.com/adobe/leonardo/issues/82
function updateColorPickerFromText() {
  const picker = document.querySelector('#newColorInput');
  const text = document.querySelector('#newColorInputText');
  console.log(text, picker);
  if (text.value.match(/#?[a-f0-9A-F]{6}/)) {
    picker.value = text.value;
  }
}
function updateColorTextFromPicker() {
  const picker = document.querySelector('#newColorInput');
  const text = document.querySelector('#newColorInputText');
  text.value = picker.value;
}

updateBackgroundColor();
updateUsername();
updateContrastPreview();
updateColorTextFromPicker();

document.querySelector("#usernameInput")
    .addEventListener('input', () => updateUsername());
document.querySelector("#lightModeInput")
    .addEventListener('input', () => {
      updateBackgroundColor();
      updateContrastPreview();
    });
document.querySelector('#newColorInputButton')
    .addEventListener('click', () => appendColorChip());
document.querySelector('#newColorInput')
    .addEventListener('input', () => {
      updateColorTextFromPicker();
      updateContrastPreview();
    });
document.querySelector('#newColorInputText')
    .addEventListener('input', () => {
      updateColorPickerFromText();
      updateContrastPreview();
    });