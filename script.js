const UPLOAD_API_URL = 'http://localhost:3000/api/upload';

var btn = document.getElementById('btn');
var bell = new WaveBell();
var data = [];
var file = null;
const samplingRate = 0.01;

btn.addEventListener('click', function (e) {
  if (bell.state === 'inactive') {
    bell.start(1000 / 25);
  } else {
    bell.stop();
  }
});

bell.on('wave', function (e) {
});

bell.on('start', function () {
  btn.innerText = 'Stop';
});
bell.on('stop', async function () {
  btn.innerText = 'Start';
  file = new File([bell.result], "upload.mp3")
  var url = URL.createObjectURL(bell.result);
  data = await getAmplitudeData(url, samplingRate);
  updateLathe(data, document.getElementById('select-color').value, 2, 0.3);
});

document.getElementById('file-input').addEventListener('change', async function (event) {
  if (event.target.files.length > 0) {
    file = event.target.files[0];
    let url = URL.createObjectURL(event.target.files[0]);
    data = await getAmplitudeData(url, samplingRate);
    updateLathe(data, document.getElementById('select-color').value, 2, 0.3);
  }
})

document.getElementById('select-color').addEventListener('change', function (event) {
  console.log('color', event.target.value);
  updateLathe(data, event.target.value, 2, 0.3);
})

document.getElementById('btn-upload').addEventListener('click', function () {
  if (!file) {
    console.log('no file prepared');
    return;
  }

  let formData = new FormData();
  formData.append("audio_file", file);
  fetch(
    UPLOAD_API_URL,
    { method: "POST", body: formData }
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