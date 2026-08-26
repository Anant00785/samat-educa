import cv2
import numpy as np
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from fer import define_model
from tensorflow.keras.preprocessing import image
import os

# Create Flask Application
app = Flask(__name__)
CORS(app)

print("Loading Keras Emotion Model...")
# Load model using the define_model function from fer.py to bypass Keras 3 JSON issues
model = define_model()
model.load_weights('top_models\\fer.h5')
print("Keras Emotion Model Loaded Successfully.")

classifier = cv2.CascadeClassifier('haarcascade_frontalface_default.xml')
emotions = ['neutral', 'happiness', 'surprise', 'sadness', 'anger', 'disgust', 'fear']

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if not data or 'imageBase64' not in data or not data['imageBase64']:
        return jsonify({'emotion': 'Neutral', 'confidence': 100, 'message': 'No image provided'}), 200

    try:
        # Remove the base64 metadata preamble if present
        base64_data = data['imageBase64'].split(",")[1] if "," in data['imageBase64'] else data['imageBase64']
        img_bytes = base64.b64decode(base64_data)
        
        # Convert decoded bytes to OpenCV image format
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if img is None:
            return jsonify({'emotion': 'Neutral', 'confidence': 100, 'message': 'Could not decode image'}), 200

        gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Detect faces in the image
        faces_detected = classifier.detectMultiScale(gray_img, 1.18, 5, minSize=(50, 50))
        
        if len(faces_detected) == 0:
            return jsonify({'emotion': 'Neutral', 'confidence': 100, 'message': 'No face detected'}), 200

        # Focus on the largest face discovered to eliminate background faces
        largest_face = max(faces_detected, key=lambda rect: rect[2] * rect[3])
        x, y, w, h = largest_face

        roi_gray = gray_img[y:y+h, x:x+w]
        roi_gray = cv2.resize(roi_gray, (48, 48))
        img_pixels = image.img_to_array(roi_gray)
        img_pixels = np.expand_dims(img_pixels, axis=0)
        img_pixels /= 255.0

        # Run Prediction
        predictions = model.predict(img_pixels)
        max_index = int(np.argmax(predictions[0]))
        confidence = float(np.max(predictions[0])) * 100
        
        predicted_emotion = emotions[max_index]
        
        # Map the 7 detailed emotions into the broader 4 required by the ERP backend
        mood_map = {
            'neutral': 'Neutral',
            'happiness': 'Happy',
            'surprise': 'Happy', 
            'sadness': 'Sad',
            'anger': 'Stressed',
            'disgust': 'Stressed',
            'fear': 'Stressed'
        }
        
        final_mood = mood_map.get(predicted_emotion, 'Neutral')

        return jsonify({'emotion': final_mood, 'confidence': round(confidence, 2)})
        
    except Exception as e:
        print("Error during predict:", e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
