const tf = require('@tensorflow/tfjs');
const bodyPix = require('@tensorflow-models/body-pix');

function drawBlurredOutput(net, canvas, video) {
  console.time('segment')
  net.segmentPerson(video, {
    flipHorizontal: false,
    internalResolution: 'low',
    segmentationThreshold: 0.5,
    maxDetections: 2
  }).then(segmentations => {
    bodyPix.drawBokehEffect(
      canvas,
      video,
      segmentations
    );
    console.timeEnd('segment')
    requestAnimationFrame(() => drawBlurredOutput(net, canvas, video));
  });
}

async function loadApp() {
  let video = document.querySelector('video');
  let outputCanvas = document.getElementById('output');

  let videoStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: {deviceId: 'c45ab612fef8aecb28e27b21418f11f635372661772205800f6bb1fc6f8ff655'} });
  const net = await bodyPix.load({
    architecture: 'MobileNetV1',
    outputStride: 16,
    internalResolution: 'low',
    multiplier: 0.50,
    quantBytes: 2,
  });

  if ("srcObject" in video) {
    video.srcObject = videoStream;
  } else {
    video.src = window.URL.createObjectURL(videoStream);
  }

  video.onloadedmetadata = function(e) {
    video.play();
  };

  video.onloadeddata = (e) => {
    drawBlurredOutput(net, outputCanvas, video);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadApp().then(console.log);
})
