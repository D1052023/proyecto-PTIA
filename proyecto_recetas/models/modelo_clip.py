import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import tensorflow as tf
from tensorflow.keras.preprocessing.image import img_to_array, load_img
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras import layers, models
import numpy as np

# 📌 Rutas
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_H5 = os.path.join(BASE_DIR, "model_mobilenetv2.h5")

model = None

def cargar_modelo():
    global model

    try:
        print("⚠️ Reconstruyendo modelo correctamente...")

        base_model = MobileNetV2(
            input_shape=(224, 224, 3),
            include_top=False,
            weights="imagenet"
        )

        # 🔥 MISMA ARQUITECTURA EXACTA
        x = base_model.output
        x = layers.GlobalAveragePooling2D()(x)
        x = layers.Dropout(0.3)(x)   # 👈 ESTA ERA LA CLAVE
        predictions = layers.Dense(101, activation="softmax")(x)

        model = models.Model(inputs=base_model.input, outputs=predictions)

        # 🔥 CARGAR PESOS
        model.load_weights(MODEL_H5)

        print("✅ Modelo cargado correctamente desde .h5")

    except Exception as e:
        print("❌ ERROR CRÍTICO:", e)
        model = None


# 🔥 cargar al inicio
cargar_modelo()

# 📌 Clases
class_names = [
    'apple_pie','baby_back_ribs','baklava','beef_carpaccio','beef_tartare','beet_salad','beignets','bibimbap',
    'bread_pudding','breakfast_burrito','bruschetta','caesar_salad','cannoli','caprese_salad','carrot_cake',
    'ceviche','cheese_plate','cheesecake','chicken_curry','chicken_quesadilla','chicken_wings','chocolate_cake',
    'chocolate_mousse','churros','clam_chowder','club_sandwich','crab_cakes','creme_brulee','croque_madame',
    'cup_cakes','deviled_eggs','donuts','dumplings','edamame','eggs_benedict','escargots','falafel',
    'filet_mignon','fish_and_chips','foie_gras','french_fries','french_onion_soup','french_toast',
    'fried_calamari','fried_rice','frozen_yogurt','garlic_bread','gnocchi','greek_salad',
    'grilled_cheese_sandwich','grilled_salmon','guacamole','gyoza','hamburger','hot_and_sour_soup','hot_dog',
    'huevos_rancheros','hummus','ice_cream','lasagna','lobster_bisque','lobster_roll_sandwich',
    'macaroni_and_cheese','macarons','miso_soup','mussels','nachos','omelette','onion_rings','oysters',
    'pad_thai','paella','pancakes','panna_cotta','peking_duck','pho','pizza','pork_chop','poutine',
    'prime_rib','pulled_pork_sandwich','ramen','ravioli','red_velvet_cake','risotto','samosa','sashimi',
    'scallops','seaweed_salad','shrimp_and_grits','spaghetti_bolognese','spaghetti_carbonara',
    'spring_rolls','steak','strawberry_shortcake','sushi','tacos','takoyaki','tiramisu','tuna_tartare','waffles'
]

def predecir_plato(ruta_imagen):
    if model is None:
        return "modelo_no_disponible"

    img = load_img(ruta_imagen, target_size=(224, 224))
    img = img_to_array(img) / 255.0
    img = np.expand_dims(img, axis=0)

    pred = model.predict(img)
    idx = np.argmax(pred)

    return class_names[idx]