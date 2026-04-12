const fs = require('fs');
const path = require('path');
const https = require('https');

const modelsUrl = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';
const weightsDir = path.join(__dirname, '../weights');

const filesToDownload = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model.bin',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model.bin',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model.bin'
];

if (!fs.existsSync(weightsDir)) {
  fs.mkdirSync(weightsDir, { recursive: true });
}

function downloadFile(fileName) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(weightsDir, fileName);
    if (fs.existsSync(filePath)) {
      console.log(`[SKIP] ${fileName} already exists.`);
      return resolve();
    }

    console.log(`[DOWNLOADING] ${fileName}...`);
    const file = fs.createWriteStream(filePath);
    
    https.get(modelsUrl + fileName, (response) => {
      if (response.statusCode !== 200) {
        fs.unlinkSync(filePath);
        return reject(new Error(`Failed to get '${fileName}' (${response.statusCode})`));
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`[SUCCESS] ${fileName} downloaded.`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlinkSync(filePath);
      reject(err);
    });
  });
}

async function run() {
  console.log('Downloading face-api models to /weights directory...');
  try {
    for (const file of filesToDownload) {
      await downloadFile(file);
    }
    console.log('All models downloaded successfully!');
  } catch (e) {
    console.error('Error downloading models:', e);
  }
}

run();
