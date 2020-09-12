const WebCam = require('./lib/webcam.js');
const Segmentor = require('./lib/segmentor.js');
const logger = require('./utils/logger.js');

const outputLocation = 'data/webcam/shot.jpg';
const webcam = new WebCam(1280, 780, 30, logger);
const segmentor = new Segmentor(logger);

webcam.capture(outputLocation);
const segmentation = segmentor.segmentImage(outputLocation);
// eslint-disable-next-line no-console
console.log(segmentation);
