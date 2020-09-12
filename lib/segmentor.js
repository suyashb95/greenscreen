const bodyPix = require('@tensorflow-models/body-pix');
const tfjs = require('@tensorflow/tfjs-node');
const fs = require('fs');

class Segmentor {
    constructor(logger) {
        this.logger = logger;
        this.logger.info(tfjs.getBackend());
    }

    async loadImage(path) {
        this.logger.info(`Loading image at ${path}`);
        const file = await fs.promises.readFile(path);
        const image = tfjs.node.decodeImage(file, 3);
        return image;
    }

    async segmentImage(fileName) {
        const image = this.loadImage(fileName);
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
        return personSegmentation;
    }
}

module.exports = Segmentor;
