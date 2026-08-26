import cv2
import argparse
import numpy as np
from fer import define_model
from tensorflow.keras.preprocessing import image

# Parse the arguments
ap = argparse.ArgumentParser()
ap.add_argument('image', help='path to input image file')
args = vars(ap.parse_args())

# Load model using define_model function from fer.py to bypass Keras 3 JSON compatibility issues
model = define_model()

# Load weights and them to model
model.load_weights('top_models\\fer.h5')

classifier = cv2.CascadeClassifier('haarcascade_frontalface_default.xml')

img = cv2.imread(args['image'])
gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
faces_detected = classifier.detectMultiScale(gray_img, 1.18, 5)

for (x, y, w, h) in faces_detected:
    cv2.rectangle(img, (x, y), (x + w, y + h), (0, 255, 0), 2)
    roi_gray = gray_img[y:y + w, x:x + h]
    roi_gray = cv2.resize(roi_gray, (48, 48))
    img_pixels = image.img_to_array(roi_gray)
    img_pixels = np.expand_dims(img_pixels, axis=0)
    img_pixels /= 255.0

    predictions = model.predict(img_pixels)
    max_index = int(np.argmax(predictions))

    emotions = ['neutral', 'happiness', 'surprise', 'sadness', 'anger', 'disgust', 'fear']
    predicted_emotion = emotions[max_index]

    cv2.putText(img, predicted_emotion, (int(x), int(y)), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2)

resized_img = cv2.resize(img, (1024, 768))
cv2.imshow('Facial Emotion Recognition', resized_img)

if cv2.waitKey(0) & 0xFF == ord('q'):
    cv2.destroyAllWindows()
