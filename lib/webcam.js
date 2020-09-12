const cam = require('node-webcam');
const logger = require('../utils/logger.js');

class WebCam {
    constructor(width, height, frames) {
        const opts = {
            width,
            height,
            frames,
            device: false,
            verbose: false,
            output: 'jpeg',
            callbackReturn: 'base64',
        };
        this.webCam = cam.create(opts);
        this.logger = logger;
        this.capture.bind(this);
    }

    capture(inputLocation) {
        this.logger.info(`Starting capture from ${inputLocation}`);
        this.webCam.capture(inputLocation, (err, data) => {
            if (err) {
                this.logger.error(`Error occurred ${err}`);
            } else {
                this.logger.info(data);
            }
        });
    }
}

module.exports = WebCam;
