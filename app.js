const WebCam = require('./lib/webcam.js');
const Segmentor = require('./lib/segmentor.js');
const logger = require('./utils/logger.js');

const location = './data/webcam/shot.jpg';

const webcam = new WebCam(640, 480, 30, logger);
const segmentor = new Segmentor(logger);

segmentor.initializeNet();
segmentor.initializeCanvas();

async function main(outputLocation) {
    webcam.capture(outputLocation)
    .then(image => {
        console.time('segment-blur-time');
        segmentor.segmentImage(image)
        .then(segmentation => {
            segmentor.blurBackground(image, segmentation);
            console.timeEnd('segment-blur-time');
        })
    })
    // eslint-disable-next-line no-console
}

main(location);
