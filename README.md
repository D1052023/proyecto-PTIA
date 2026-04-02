# 🍳 Proyecto PTIA – Sistema Inteligente de Recomendación de Recetas

---

## 👥 Integrantes del Proyecto

| Nombre                                     | Rol        |
| ------------------------------------------ | ---------- |
| 👨‍💻 **Oscar Andrés Sánchez Porras**      | Desarrollo |
| 👨‍💻 **Diego Fernando Chavarro Castillo** | Desarrollo |

---

## 📌 Descripción

Este proyecto implementa un Sistema Inteligente de Recomendación de Recetas que utiliza técnicas avanzadas de Inteligencia Artificial, combinando Visión por Computador y Modelos de Lenguaje.

El sistema permite:

📸 Subir una imagen de ingredientes
🧠 Detectar automáticamente los ingredientes presentes mediante un modelo de Transfer Learning basado en MobileNetV2
🍲 Recomendar recetas utilizando un motor inteligente que compara ingredientes detectados con la base de datos de recetas

El enfoque principal está basado en Aprendizaje Supervisado para la detección de ingredientes y un Sistema de Recomendación Basado en Contenido (Content-Based Filtering) para la selección inteligente de recetas relevantes.

---
## 🧠 Metodología de Inteligencia Artificial
El sistema incorpora tres componentes fundamentales:

1️⃣ Visión por Computador – MobileNetV2 (Transfer Learning)
Tipo de IA: 
- Red Neuronal Convolucional (CNN)
- Tipo de Aprendizaje: Supervisado
- Uso: Clasificación de imágenes de ingredientes
- Método: Transfer Learning sobre MobileNetV2 para reducir costo de entrenamiento

2️⃣ Procesamiento de Lenguaje – Sentence Transformers
- Tipo de IA: Modelo Embedding No Supervisado
- Uso: Convertir texto e ingredientes en vectores semánticos
- Permite medir similitud entre recetas

3️⃣ Motor de Recomendación – Content-Based Filtering
- Tipo de aprendizaje: No supervisado
- Uso: Recomendación de recetas mediante similitud de embeddings
- Métrica: Similitud del coseno

---

## 🏗️ Arquitectura del Sistema

El sistema sigue una arquitectura modular:

```
Usuario (Frontend)
        ↓
Formulario en Flask
        ↓
Procesador de imágenes (MobileNetV2)
        ↓
Extracción de Ingredientes
        ↓
Motor de Embeddings (Sentence Transformers)
        ↓
Motor de Recomendación (Similitud)
        ↓
Recetas recomendadas
```

---

## ⚙️ Requisitos

* Python 3.10 o superior
* pip (gestor de paquetes)

### 📦 Instalación de dependencias principales

```bash
pip install flask flask-sqlalchemy werkzeug
```

---

## 🧪 Estructura del Proyecto

```
📂 proyecto_PTIA
┣ 📂 proyecto_recetas/
┃ ┣ 📂 static/
┃ ┃ ┣ 📂 css/
┃ ┃ ┃ ┗ 🎨 style.css
┃ ┃ ┣ 📂 locales/
┃ ┃ ┃ ┗ 🟨 en.json
┃ ┃ ┣ 📂 js/
┃ ┃ ┃ ┗ ⚡ archive.js
┃ ┃ ┣ 📂 public/
┃ ┃ ┃ ┣ 🤖 robots.txt
┃ ┃ ┃ ┗ 🖼️ image.svg
┃ ┃ ┣ 📂 uploads/               # Fotos de usuarios
┃ ┃ ┗ 📂 img/                   # Imágenes internas
┃ ┣ 📂 templates/
┃ ┃ ┣ 🌐 archivo.html
┃ ┃ ┣ 🌐 recomendar.html         # Formulario de recomendaciones
┃ ┃ ┗ 🌐 resultados.html         # Recetas resultantes
┃ ┣ 📂 models/
┃ ┃ ┣ 🧠 embeddings_nlp.npy
┃ ┃ ┣ 🧠 embeddings_clip.npy (opcional)
┃ ┃ ┣ 🧩 modelo_nlp.py           # Embeddings de texto
┃ ┃ ┣ 🧩 modelo_clip.py          # Clasificación de imágenes
┃ ┃ ┗ 🧩 recomendador.py         # Motor de similitud
┃ ┣ 📂 data/
┃ ┃ ┣ 📜 recetas.json
┃ ┃ ┣ 📜 recetas_embeddings.json
┃ ┃ ┗ 📜 etiquetas_ingredientes.json
┃ ┣ 📂 utils/
┃ ┃ ┣ 🔧 similarity.py
┃ ┃ ┗ 🔧 preprocess.py
┃ ┣ 🐍 app.py                    # Aplicación Flask
┃ ┣ 🗄️ database.py               # Conexión a MongoDB
┃ ┗ 📄 requirements.txt
┣ 📂 venv/
┣ 🚫 .gitignore
┣ 📄 LICENSE
┗ 📄 README.md
```

---

## 🚀 Ejecución del Sistema

### 1️⃣ Entrenar el modelo

```bash
py -m pip install tensorflow pillow numpy scikit-learn
py train_model.py
```

### 2️⃣ Ejecutar la aplicación

```bash
py app.py
```

### 3️⃣ Abrir en el navegador

```
http://127.0.0.1:5000
```

---

## 🍃 Configuración de Base de Datos (MongoDB)

### 📦 Instalación de dependencias

```bash
pip install pymongo flask-bcrypt python-dotenv
python -m pip install "pymongo[srv]"
pip install authlib requests secure-smtplib
py -m pip install anthropic
py -m pip install google-generativeai
py -m pip install sentence-transformers
py -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
py -m pip install tensorflow  
```

### 🔐 Dependencias adicionales (autenticación y seguridad)

```bash
py -m pip install flask-bcrypt
py -m pip install Authlib
py -m pip install requests
py -m pip install python-dotenv
```

---

## 🔐 Características adicionales

* 🔑 Autenticación de usuarios
* 🔒 Encriptación de contraseñas con **Flask-Bcrypt**
* 🌐 Integración con servicios externos mediante **Authlib**
* 📧 Posibilidad de envío de correos (SMTP)

---

## 📌 Mejoras futuras

* 📱 Interfaz web más moderna y responsiva
* 🤖 Mejora del modelo de detección de ingredientes
* 📊 Sistema de recomendaciones más preciso (IA híbrida)
* ☁️ Despliegue en la nube

---

## 📄 Licencia

Este proyecto está bajo la licencia especificada en el archivo `LICENSE`.

---

## 💡 Notas

* Se recomienda usar un entorno virtual (`venv`) para evitar conflictos de dependencias
* Verificar que MongoDB esté correctamente configurado si se usa en lugar de SQLite

---

✨ *Proyecto académico enfocado en la aplicación de Inteligencia Artificial en la vida cotidiana.*

1. Crear entorno con Python 3.10

En tu carpeta del proyecto:

py -3.10 -m venv tf_env
2. Activar entorno
tf_env\Scripts\activate

🚀 Sigue estos pasos para instalar TensorFlow y tensorflow-io sin problemas:
Actualiza pip:

pip install --upgrade pip
Instala TensorFlow:
pip install tensorflow
Instala tensorflow-io:
pip install tensorflow-io