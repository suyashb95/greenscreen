const bodyPix = require('@tensorflow-models/body-pix');
const tfjs = require('@tensorflow/tfjs-node');
const fs = require('fs');
const { Image, createCanvas } = require('canvas');

const { drawBokehEffect } = require('./image-utils.js');
tfjs.enableProdMode();

class Segmentor {
    constructor(logger, width=640, height=480) {
        this.logger = logger;
        this.width = width;
        this.height = height;
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
        this.canvas = createCanvas(this.width, this.height);
        this.ctx = this.canvas.getContext('2d');
        this.currentImage = new Image();
        this.currentImage.onload = () => this.ctx.drawImage(this.currentImage, 0, 0, this.width, this.height)
    }

    async loadImage(path) {
        this.logger.info(`Loading image at ${path}`);
        const file = await fs.promises.readFile(path);
        const image = tfjs.node.decodeImage(file, 3);
        return image;
    }

    async segmentImage(buffer) {
        this.currentImage.src = buffer;
        const tensor = tfjs.browser.fromPixels(this.canvas);

        const personSegmentation = await this.net.segmentPerson(tensor, {
            flipHorizontal: false,
            internalResolution: 'low',
            segmentationThreshold: 0.5,
            maxDetections: 2
        });
        return personSegmentation;
    }

    async blurBackground(buffer, segmentation) {
        const blurredImage = drawBokehEffect(
            this.canvas,
            this.currentImage,
            segmentation
        );
        return blurredImage.toBuffer();    
    } 
}

module.exports = Segmentor;
