# proyecto-PTIA
---

## Descripción

Sistema basado en Aprendizaje Supervisado que:

1. Recibe una imagen con ingredientes
2. Detecta los ingredientes usando un modelo CNN con Transfer Learning
3. Recomienda recetas que contengan esos ingredientes

Arquitectura:

Frontend (HTML)
↓
Flask API (Python)
↓
Modelo CNN (MobileNetV2)
↓
Motor de recomendación

---

## Requisitos

Python 3.10+

Instalar dependencias:

'''
pip install flask tensorflow pillow numpy pandas scikit-learn
'''

---

## Estructura del Proyecto

'''
proyecto_recetas/
│
├── app.py
├── train_model.py
├── model/
│     └── vision_model.h5
├── data/
│     └── recetas.csv
├── static/
│     └── uploads/
├── templates/
│     └── index.html
'''

---

## Dataset de Recetas (data/recetas.csv)

Formato:

'''
nombre,ingredientes
Arroz con pollo,"arroz,pollo,cebolla"
Ensalada fresca,"tomate,lechuga,zanahoria"
Tortilla,"huevo,cebolla"
'''

---

## Entrenamiento del Modelo de Visión

Archivo: train_model.py

'''
import tensorflow as tf
from tensorflow.keras import layers, models
import os

IMG_SIZE = 224
BATCH_SIZE = 16
EPOCHS = 5

dataset = tf.keras.preprocessing.image_dataset_from_directory(
    "dataset/",
    image_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE
)

class_names = dataset.class_names
num_classes = len(class_names)

base_model = tf.keras.applications.MobileNetV2(
    input_shape=(IMG_SIZE, IMG_SIZE, 3),
    include_top=False,
    weights='imagenet'
)

base_model.trainable = False

model = models.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dense(128, activation='relu'),
    layers.Dense(num_classes, activation='softmax')
])

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

model.fit(dataset, epochs=EPOCHS)

model.save("model/vision_model.h5")
'''

Estructura del dataset:

'''
dataset/
├── tomate/
├── pollo/
├── huevo/
├── arroz/
'''

Cada carpeta contiene imágenes etiquetadas.

---

## Backend con Flask

Archivo: app.py

'''
from flask import Flask, render_template, request
import os
import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model
from PIL import Image

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'

model = load_model('model/vision_model.h5')
class_names = ["arroz","huevo","pollo","tomate"]

def preprocess_image(image_path):
    img = Image.open(image_path).resize((224,224))
    img = np.array(img) / 255.0
    img = np.expand_dims(img, axis=0)
    return img

def recomendar_recetas(ingrediente_detectado):
    recetas = pd.read_csv("data/recetas.csv")
    recomendaciones = []

    for _, row in recetas.iterrows():
        ingredientes = row["ingredientes"].split(",")
        if ingrediente_detectado in ingredientes:
            recomendaciones.append(row["nombre"])

    return recomendaciones

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        file = request.files['image']
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)

        img = preprocess_image(filepath)
        prediction = model.predict(img)
        predicted_class = class_names[np.argmax(prediction)]

        recetas = recomendar_recetas(predicted_class)

        return render_template('index.html',
                               ingrediente=predicted_class,
                               recetas=recetas)

    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
'''

---

## Frontend HTML

Archivo: templates/index.html

'''
<!DOCTYPE html>
<html>
<head>
    <title>Recomendador de Recetas</title>
</head>
<body>
    <h2>Sube una imagen de un ingrediente</h2>

    <form method="POST" enctype="multipart/form-data">
        <input type="file" name="image" required>
        <button type="submit">Analizar</button>
    </form>

    {% if ingrediente %}
        <h3>Ingrediente detectado: {{ ingrediente }}</h3>

        <h4>Recetas recomendadas:</h4>
        <ul>
        {% for receta in recetas %}
            <li>{{ receta }}</li>
        {% endfor %}
        </ul>
    {% endif %}

</body>
</html>
'''

---

## Ejecutar el Sistema

1. Entrenar el modelo:

'''
python train_model.py
'''

2. Ejecutar la aplicación:

'''
python app.py
'''

3. Abrir en navegador:

'''
http://127.0.0.1:5000
'''

---

## Mejora Futura (Multi-Label)

Actualmente el modelo detecta un solo ingrediente.

Para mejorar:
- Cambiar softmax por sigmoid
- Usar binary_crossentropy
- Permitir detección múltiple

---

## Tipo de Aprendizaje

Aprendizaje Supervisado

Entrada: Imagen etiquetada
Salida: Clase de ingrediente
Modelo: MobileNetV2 + Transfer Learning
Métrica: Accuracy

---
