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
        segmentor.segmentImage(image);
    })
    // eslint-disable-next-line no-console
}

main(location);
