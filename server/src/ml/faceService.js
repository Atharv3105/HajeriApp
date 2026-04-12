const faceapi = require('@vladmandic/face-api/dist/face-api.node-wasm.js');
const path = require('path');
const jpeg = require('jpeg-js');

let modelsLoaded = false;

async function loadModels() {
  if (modelsLoaded) return;
  const weightsPath = path.join(__dirname, '../../weights');
  
  // Await tf engine readiness
  await faceapi.tf.ready();
  
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromDisk(weightsPath),
    faceapi.nets.faceLandmark68Net.loadFromDisk(weightsPath),
    faceapi.nets.faceRecognitionNet.loadFromDisk(weightsPath)
  ]);
  
  modelsLoaded = true;
  console.log('FaceAPI Models loaded successfully.');
}

async function getEmbeddingFromBase64(base64Image) {
  await loadModels();
  
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const imgBuffer = Buffer.from(base64Data, 'base64');
  
  // Decode JPEG pure-JS (Returns RGBA pixel array)
  const rawImageData = jpeg.decode(imgBuffer, { useTArray: true });
  const numPixels = rawImageData.width * rawImageData.height;
  
  // Convert RGBA to RGB (3 channels) for tensorflow
  const rgbData = new Uint8Array(numPixels * 3);
  for (let i = 0; i < numPixels; i++) {
    rgbData[i * 3] = rawImageData.data[i * 4];       // R
    rgbData[i * 3 + 1] = rawImageData.data[i * 4 + 1]; // G
    rgbData[i * 3 + 2] = rawImageData.data[i * 4 + 2]; // B
  }
  
  // Wrap in a Tensor3D manually
  const tensor = faceapi.tf.tensor3d(rgbData, [rawImageData.height, rawImageData.width, 3]);
  
  // Detect a single face and get 128-d descriptor
  const detection = await faceapi.detectSingleFace(tensor)
    .withFaceLandmarks()
    .withFaceDescriptor();
    
  tensor.dispose(); // Prevent memory leaks
    
  if (!detection) {
    throw new Error('No face detected in the provided image');
  }
  
  // Return the descriptor as an array
  return Array.from(detection.descriptor);
}

async function getAllEmbeddingsFromBase64(base64Image) {
  await loadModels();
  
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const imgBuffer = Buffer.from(base64Data, 'base64');
  const rawImageData = jpeg.decode(imgBuffer, { useTArray: true });
  const numPixels = rawImageData.width * rawImageData.height;
  
  const rgbData = new Uint8Array(numPixels * 3);
  for (let i = 0; i < numPixels; i++) {
    rgbData[i * 3] = rawImageData.data[i * 4];
    rgbData[i * 3 + 1] = rawImageData.data[i * 4 + 1];
    rgbData[i * 3 + 2] = rawImageData.data[i * 4 + 2];
  }
  
  const tensor = faceapi.tf.tensor3d(rgbData, [rawImageData.height, rawImageData.width, 3]);
  
  console.log(`[FaceAPI] Analyzing image for bulk faces using SsdMobilenetV1...`);
  
  // Reverted to SsdMobilenetv1 since TinyFace weights are missing. 
  // Increased minConfidence to reduce false positives in classroom shots.
  const detections = await faceapi.detectAllFaces(tensor, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }))
    .withFaceLandmarks()
    .withFaceDescriptors();
    
  console.log(`[FaceAPI] Found ${detections.length} total faces in snapshot.`);
  
  tensor.dispose();
    
  if (!detections || detections.length === 0) {
    return [];
  }
  
  return detections.map(d => Array.from(d.descriptor));
}

function calculateSimilarity(embedding1, embedding2) {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

module.exports = {
  loadModels,
  getEmbeddingFromBase64,
  getAllEmbeddingsFromBase64,
  calculateSimilarity
};
