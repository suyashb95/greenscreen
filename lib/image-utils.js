/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

const {cpuBlur} = require('@tensorflow-models/body-pix/dist/blur');
const { createCanvas, ImageData } = require('canvas');

const offScreenCanvases = {};

function isSafari() {
  return false;
}

function flipCanvasHorizontal(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.scale(-1, 1);
  ctx.translate(-canvas.width, 0);
}

function drawWithCompositing(
    ctx, image,
    compositOperation) {
  ctx.globalCompositeOperation = compositOperation;
  ctx.drawImage(image, 0, 0);
}

function createOffScreenCanvas() {
  const offScreenCanvas = createCanvas(640, 480);
  return offScreenCanvas;
}

function ensureOffscreenCanvasCreated(id) {
  if (!offScreenCanvases[id]) {
    offScreenCanvases[id] = createOffScreenCanvas();
  }
  return offScreenCanvases[id];
}

function drawAndBlurImageOnCanvas(
    image, blurAmount, canvas) {
  const {height, width} = image;
  const ctx = canvas.getContext('2d');
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  if (isSafari()) {
    cpuBlur(canvas, image, blurAmount);
  } else {
    (ctx).filter = `blur(${blurAmount}px)`;
    ctx.drawImage(image, 0, 0, width, height);
  }
  ctx.restore();
}

function drawAndBlurImageOnOffScreenCanvas(
    image, blurAmount,
    offscreenCanvasName) {
  const canvas = ensureOffscreenCanvasCreated(offscreenCanvasName);
  if (blurAmount === 0) {
    renderImageToCanvas(image, canvas);
  } else {
    drawAndBlurImageOnCanvas(image, blurAmount, canvas);
  }
  return canvas;
}

function renderImageToCanvas(image, canvas) {
  const {width, height} = image;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(image, 0, 0, width, height);
}
/**
 * Draw an image on a canvas
 */
function renderImageDataToCanvas(image, canvas) {
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');

  ctx.putImageData(image, 0, 0);
}

function renderImageDataToOffScreenCanvas(
    image, canvasName) {
  const canvas = ensureOffscreenCanvasCreated(canvasName);
  renderImageDataToCanvas(image, canvas);

  return canvas;
}

/**
 * Given the output from estimating multi-person segmentation, generates an
 * image with foreground and background color at each pixel determined by the
 * corresponding binary segmentation value at the pixel from the output.  In
 * other words, pixels where there is a person will be colored with foreground
 * color and where there is not a person will be colored with background color.
 *
 * @param personOrPartSegmentation The output from
 * `segmentPerson`, `segmentMultiPerson`,
 * `segmentPersonParts` or `segmentMultiPersonParts`. They can
 * be SemanticPersonSegmentation object, an array of PersonSegmentation object,
 * SemanticPartSegmentation object, or an array of PartSegmentation object.
 *
 * @param foreground Default to {r:0, g:0, b:0, a: 0}. The foreground color
 * (r,g,b,a) for visualizing pixels that belong to people.
 *
 * @param background Default to {r:0, g:0, b:0, a: 255}. The background color
 * (r,g,b,a) for visualizing pixels that don't belong to people.
 *
 * @param drawContour Default to false. Whether to draw the contour around each
 * person's segmentation mask or body part mask.
 *
 * @param foregroundIds Default to [1]. The integer values that represent
 * foreground. For person segmentation, 1 is the foreground. For body part
 * segmentation, it can be a subset of all body parts ids.
 *
 * @returns An ImageData with the same width and height of
 * all the PersonSegmentation in multiPersonSegmentation, with opacity and
 * transparency at each pixel determined by the corresponding binary
 * segmentation value at the pixel from the output.
 */
 function toMask(
    personOrPartSegmentation,
    foreground = {
      r: 0,
      g: 0,
      b: 0,
      a: 0
    },
    background = {
      r: 0,
      g: 0,
      b: 0,
      a: 255
    },
    drawContour = false, foregroundIds = [1]) {
  if (Array.isArray(personOrPartSegmentation) &&
      personOrPartSegmentation.length === 0) {
    return null;
  }

  let multiPersonOrPartSegmentation;

  if (!Array.isArray(personOrPartSegmentation)) {
    multiPersonOrPartSegmentation = [personOrPartSegmentation];
  } else {
    multiPersonOrPartSegmentation = personOrPartSegmentation;
  }

  const {width, height} = multiPersonOrPartSegmentation[0];
  const bytes = new Uint8ClampedArray(width * height * 4);

  function drawStroke(
      bytes, row, column, width,
      radius, color = {r: 0, g: 255, b: 255, a: 255}) {
    for (let i = -radius; i <= radius; i++) {
      for (let j = -radius; j <= radius; j++) {
        if (i !== 0 && j !== 0) {
          const n = (row + i) * width + (column + j);
          bytes[4 * n + 0] = color.r;
          bytes[4 * n + 1] = color.g;
          bytes[4 * n + 2] = color.b;
          bytes[4 * n + 3] = color.a;
        }
      }
    }
  }

  function isSegmentationBoundary(
      segmentationData,
      row,
      column,
      width,
      foregroundIds = [1],
      radius = 1,
      ) {
    let numberBackgroundPixels = 0;
    for (let i = -radius; i <= radius; i++) {
      for (let j = -radius; j <= radius; j++) {
        if (i !== 0 && j !== 0) {
          const n = (row + i) * width + (column + j);
          if (!foregroundIds.some(id => id === segmentationData[n])) {
            numberBackgroundPixels += 1;
          }
        }
      }
    }
    return numberBackgroundPixels > 0;
  }

  for (let i = 0; i < height; i += 1) {
    for (let j = 0; j < width; j += 1) {
      const n = i * width + j;
      bytes[4 * n + 0] = background.r;
      bytes[4 * n + 1] = background.g;
      bytes[4 * n + 2] = background.b;
      bytes[4 * n + 3] = background.a;
      for (let k = 0; k < multiPersonOrPartSegmentation.length; k++) {
        if (foregroundIds.some(
                id => id === multiPersonOrPartSegmentation[k].data[n])) {
          bytes[4 * n] = foreground.r;
          bytes[4 * n + 1] = foreground.g;
          bytes[4 * n + 2] = foreground.b;
          bytes[4 * n + 3] = foreground.a;
          const isBoundary = isSegmentationBoundary(
              multiPersonOrPartSegmentation[k].data, i, j, width,
              foregroundIds);
          if (drawContour && i - 1 >= 0 && i + 1 < height && j - 1 >= 0 &&
              j + 1 < width && isBoundary) {
            drawStroke(bytes, i, j, width, 1);
          }
        }
      }
    }
  }

  return new ImageData(bytes, width, height);
}

const CANVAS_NAMES = {
  blurred: 'blurred',
  blurredMask: 'blurred-mask',
  mask: 'mask',
  lowresPartMask: 'lowres-part-mask',
};

function createPersonMask(
    multiPersonSegmentation,
    edgeBlurAmount) {
  const backgroundMaskImage = toMask(
      multiPersonSegmentation, {r: 0, g: 0, b: 0, a: 255},
      {r: 0, g: 0, b: 0, a: 0});

  const backgroundMask =
      renderImageDataToOffScreenCanvas(backgroundMaskImage, CANVAS_NAMES.mask);
  if (edgeBlurAmount === 0) {
    return backgroundMask;
  } else {
    return drawAndBlurImageOnOffScreenCanvas(
        backgroundMask, edgeBlurAmount, CANVAS_NAMES.blurredMask);
  }
}

/**
 * Given a personSegmentation and an image, draws the image with its background
 * blurred onto the canvas.
 *
 * @param canvas The canvas to draw the background-blurred image onto.
 *
 * @param image The image to blur the background of and draw.
 *
 * @param personSegmentation A SemanticPersonSegmentation or an array of
 * PersonSegmentation object.
 *
 * @param backgroundBlurAmount How many pixels in the background blend into each
 * other.  Defaults to 3. Should be an integer between 1 and 20.
 *
 * @param edgeBlurAmount How many pixels to blur on the edge between the person
 * and the background by.  Defaults to 3. Should be an integer between 0 and 20.
 *
 * @param flipHorizontal If the output should be flipped horizontally.  Defaults
 * to false.
 */
 function drawBokehEffect(
    canvas, image,
    multiPersonSegmentation,
    backgroundBlurAmount = 3, edgeBlurAmount = 3, flipHorizontal = false) {
  const blurredImage = drawAndBlurImageOnOffScreenCanvas(
      image, backgroundBlurAmount, CANVAS_NAMES.blurred);
  canvas.width = blurredImage.width;
  canvas.height = blurredImage.height;

  const ctx = canvas.getContext('2d');

  if (Array.isArray(multiPersonSegmentation) &&
      multiPersonSegmentation.length === 0) {
    ctx.drawImage(blurredImage, 0, 0);
    return;
  }

  const personMask = createPersonMask(multiPersonSegmentation, edgeBlurAmount);

  ctx.save();
  if (flipHorizontal) {
    flipCanvasHorizontal(canvas);
  }
  // draw the original image on the final canvas
  const [height, width] = [image.height, image.width];
  ctx.drawImage(image, 0, 0, width, height);

  // "destination-in" - "The existing canvas content is kept where both the
  // new shape and existing canvas content overlap. Everything else is made
  // transparent."
  // crop what's not the person using the mask from the original image
  drawWithCompositing(ctx, personMask, 'destination-in');
  // "destination-over" - "The existing canvas content is kept where both the
  // new shape and existing canvas content overlap. Everything else is made
  // transparent."
  // draw the blurred background on top of the original image where it doesn't
  // overlap.
  drawWithCompositing(ctx, blurredImage, 'destination-over');
  ctx.restore();
  return blurredImage;
}

module.exports = { drawBokehEffect };
