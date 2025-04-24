import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import * as faceapi from 'face-api.js';

// Load face-api.js models asynchronously
const loadModels = async () => {
  try {
    // Using CDN paths for the models
    const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
    
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);
    
    console.log('Face API models loaded successfully');
  } catch (error) {
    console.error('Error loading Face API models:', error);
  }
};

// Load models before rendering the app
loadModels().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
