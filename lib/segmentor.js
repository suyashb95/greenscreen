const bodyPix = require('@tensorflow-models/body-pix');
const tfjs = require('@tensorflow/tfjs-node');
const fs = require('fs');
const { Image, createCanvas, ImageData, createImageData } = require('canvas');

class Segmentor {
    constructor(logger) {
        this.logger = logger;
    }

    async initializeNet() {
        this.net = await bodyPix.load({
            architecture: 'MobileNetV1',
            outputStride: 16,
            internalResolution: 'low',
            multiplier: 0.50,
            quantBytes: 2,
        });
    }

    async loadImage(path) {
        this.logger.info(`Loading image at ${path}`);
        const file = await fs.promises.readFile(path);
        const image = tfjs.node.decodeImage(file, 3);
        return image;
    }

    async segmentImage(buffer) {
        const canvas = createCanvas(1280, 720);
        const ctx = canvas.getContext('2d');
        const image = new Image();
        image.onload = () => ctx.drawImage(image, 0, 0, 1280, 720);
        image.src = buffer;
        const tensor = tfjs.browser.fromPixels(canvas);

        const personSegmentation = await this.net.segmentPerson(tensor, {
            flipHorizontal: false,
            internalResolution: 'low',
            segmentationThreshold: 0.7,
        });

        return personSegmentation;
    }
}

module.exports = Segmentor;



