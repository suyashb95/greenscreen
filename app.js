const WebCam = require('./lib/webcam.js');
const Segmentor = require('./lib/segmentor.js');
const logger = require('./utils/logger.js');

const location = './data/webcam/shot.jpg';
const webcam = new WebCam(1280, 780, 30, logger);
const segmentor = new Segmentor(logger);
segmentor.initializeNet();

async function main(outputLocation) {
    webcam.capture(outputLocation)
    .then(image => {
        segmentor.segmentImage(image);
    })
    // eslint-disable-next-line no-console
}

main(location);
