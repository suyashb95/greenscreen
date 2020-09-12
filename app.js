const WebCam = require('./lib/webcam.js');

const outputLocation = 'data/webcam/shot.jpg';
const webcam = new WebCam(1280, 780, 30);
webcam.capture(outputLocation);
