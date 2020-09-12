const bodyPix = require('@tensorflow-models/body-pix');
const tfjs = require('@tensorflow/tfjs-node');
const fs = require('fs');
const logger = require('./utils/logger.js');

logger.info(tfjs.getBackend());

async function loadImage(path) {
    const file = await fs.promises.readFile(path);
    const image = await tfjs.node.decodeImage(file, 3);
    return image;
}

async function segmentImage(fileName) {
    const image = await loadImage(fileName);
    const net = await bodyPix.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        internalResolution: 'low',
        multiplier: 0.50,
        quantBytes: 2,
    });

    const personSegmentation = await net.segmentPerson(image, {
        flipHorizontal: false,
        internalResolution: 'low',
        segmentationThreshold: 0.7,
    });
    logger.info(personSegmentation);
}

segmentImage('./data/4.png');
