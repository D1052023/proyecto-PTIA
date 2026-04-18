# 🍳 Proyecto PTIA – Sistema Inteligente de Recomendación de Recetas

---

## 👥 Integrantes del Proyecto

| Nombre                                     | Rol        |
| ------------------------------------------ | ---------- |
| 👨‍💻 **Oscar Andrés Sánchez Porras**      | Desarrollo |
| 👨‍💻 **Diego Fernando Chavarro Castillo** | Desarrollo |

---

## 📌 Descripción

Este proyecto implementa un sistema inteligente basado en **Aprendizaje Supervisado** que permite:

1. 📸 Recibir una imagen con ingredientes
2. 🧠 Detectar automáticamente los ingredientes mediante un modelo **CNN con Transfer Learning (MobileNetV2)**
3. 🍲 Recomendar recetas que coincidan con los ingredientes detectados

---

## 🏗️ Arquitectura del Sistema

El sistema sigue una arquitectura modular:

```
Frontend (HTML)
        ↓
Flask API (Python)
        ↓
Modelo CNN (MobileNetV2)
        ↓
Motor de Recomendación
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
┣ 📂 proyecto_resetas/
┃ ┣ 📂 static/
┃ ┃ ┣ 📂 css/
┃ ┃ ┃ ┗ 🎨 style.css    
┃ ┃ ┣ 📂 locales/
┃ ┃ ┃ ┗ 🟨 en.json
┃ ┃ ┣ 📂 public/
┃ ┃ ┃ ┣ 🤖 robots.txt
┃ ┃ ┃ ┗ 🖼️ image.svg
┃ ┣ 📂 templates/
┃ ┃ ┗ 🌐 archivo.html
┃ ┣ 🐍 app.py
┃ ┣ 🗄️ database.db
┣ 📂 venv/
┣ 🚫 .gitignore
┣ 📄 LICENSE
┗ 📄 README.md
```

---

## 🚀 Ejecución del Sistema

### 1️⃣ Entrenar el modelo

```bash
py train_model.py
```

### 2️⃣ Ejecutar la aplicación

```bash
py -m proyecto_recetas.app 
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