const bodyPix = require('@tensorflow-models/body-pix');
const tfjs = require('@tensorflow/tfjs-node');
const fs = require('fs');
const { Image, createCanvas } = require('canvas');

tfjs.enableProdMode();

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

    initializeCanvas() {
        this.canvas = createCanvas(640, 480);
        this.ctx = this.canvas.getContext('2d');
    }

    async loadImage(path) {
        this.logger.info(`Loading image at ${path}`);
        const file = await fs.promises.readFile(path);
        const image = tfjs.node.decodeImage(file, 3);
        return image;
    }

    async segmentImage(buffer) {
        const image = new Image();
        image.onload = () => this.ctx.drawImage(image, 0, 0, 640, 480);
        image.src = buffer;

        const tensor = tfjs.browser.fromPixels(this.canvas);

        const personSegmentation = await this.net.segmentPerson(tensor, {
            flipHorizontal: false,
            internalResolution: 'low',
            segmentationThreshold: 0.5,
            maxDetections: 2
        });
        return personSegmentation;
    }

    async getSegmentationMask(segmentation) {
        return bodyPix.toMask(segmentation);
    }
}

module.exports = Segmentor;
