const UPLOAD_API_URL = 'http://localhost:3000/api/upload';

var btn = document.getElementById('btn');
var bell = new WaveBell();
var data = [];
var file = null;

const samplingRate = 0.01;
const HEIGHT = 2;
const RADIUS = 0.3;

const SPARKLES_COUNT = 20;

btn.addEventListener('click', function (e) {
  if (bell.state === 'inactive') {
    bell.start(1000 / 25);
  } else {
    bell.stop();
  }
});

bell.on('wave', function (e) {});

bell.on('start', function () {
  btn.innerText = 'Stop';
});

bell.on('stop', async function () {
  btn.innerText = 'Start';
  file = new File([bell.result], "upload.mp3")
  var url = URL.createObjectURL(bell.result);
  data = await getAmplitudeData(url, samplingRate);
  updateLathe(data, document.getElementById('select-color').value, HEIGHT, RADIUS);
  generateSparkles(data, HEIGHT, RADIUS);
});

document.getElementById('file-input').addEventListener('change', async function (event) {
  if (event.target.files.length > 0) {
    file = event.target.files[0];
    let url = URL.createObjectURL(event.target.files[0]);
    data = await getAmplitudeData(url, samplingRate);
    updateLathe(data, document.getElementById('select-color').value, HEIGHT, RADIUS);
    generateSparkles(data, HEIGHT, RADIUS);
  }
})

document.getElementById('select-color').addEventListener('change', function (event) {
  console.log('color', event.target.value);
  updateLathe(data, event.target.value, HEIGHT, RADIUS);
})

document.getElementById('chk-follow-progress').addEventListener('click', function () {
  var checked = document.getElementById('chk-follow-progress').checked;
  console.log(checked);
  if (checked) {
    document.getElementById('canvas-container').classList.add('show-line-indicator');
  } else {
    document.getElementById('canvas-container').classList.remove('show-line-indicator');
  }
})

document.getElementById('btn-upload').addEventListener('click', function () {
  if (!file) {
    console.log('no file prepared');
    return;
  }

  let formData = new FormData();
  formData.append("audio_file", file);
  fetch(
      UPLOAD_API_URL, {
        method: "POST",
        body: formData
      }
    )
    .then(res => res.json())
    .then(res => {
      console.log(`${UPLOAD_API_URL}/${res.name}`)
    });
})
/////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Get Series of Amplitude from audio file url
 * @param {String} url the url of audio file
 * @param {Number} samplingDuration sampling duration (second)
 */
async function getAmplitudeData(url, samplingDuration = 0.01) {
  return new Promise((resolve, reject) => {
    var aud = document.getElementById('aud-playback');
    aud.src = url
    var context = new AudioContext();
    fetch(url)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => context.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        var sampleRate = audioBuffer.sampleRate;
        const rawData = audioBuffer.getChannelData(0);
        let filteredData = [];
        for (var i = 0; i < rawData.length; i += (sampleRate * samplingDuration)) {
          filteredData.push(Math.abs(rawData[i]));
        }
        resolve(filteredData);
      })
  })
}

/**
 * Generate sparkles from amplitudes
 * @param {Array} data the series of amplitudes
 * @param {Number} height
 * @param {Number} radius
 */
function generateSparkles(data, height, radius) {
  if (!Array.isArray(data) || data.length == 0) return;
  var maxAmplitude = Math.max.apply(Math, data);
  var div = document.getElementById('sparkles-container')
  if (!div) {
    div = document.createElement('div');
    div.id = 'sparkles-container';
    document.getElementById('canvas-container').appendChild(div);
  }

  for (var i = 0; i < SPARKLES_COUNT; i++) {
    var index = parseInt(Math.random() * data.length);
    var star = document.createElement('div');
    star.classList.add('star');
    star.classList.add(`glow${parseInt(Math.random() * 100) % 3}`)
    var left = div.clientWidth / 2 + (data[index] * div.clientWidth * radius * 0.5 * (parseInt(Math.random() * 100) % 2 * 2 - 1));
    var top = div.clientHeight / 2 - (index - data.length / 2) * 1;
    star.style.top = `${top}px`;
    star.style.left = `${left}px`;
    div.appendChild(star);
  }
}