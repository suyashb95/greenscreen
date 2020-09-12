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
            callbackReturn: 'buffer',
        };
        this.webCam = cam.create(opts);
        this.logger = logger;
    }

    capture(inputLocation) {
        this.logger.info(`Starting capture from ${inputLocation}`);
        return new Promise((resolve, reject) => {
            this.webCam.capture(inputLocation, (err, data) => {
                if (err) {
                    this.logger.error(`Error occurred ${err}`);
                    reject(err);
                }
                resolve(data);
            });
        });
    }
}

module.exports = WebCam;
