# proyecto-PTIA
---
## 👥 Integrantes del Proyecto

| Nombre                                     | Rol        |
| ------------------------------------------ | ---------- |
| 👨‍💻 **Oscar Andrés Sánchez Porras**      | Desarrollo |
| 👨‍💻 **Diego Fernando Chavarro Castillo** | Desarrollo |

---



## Descripción

Sistema basado en Aprendizaje Supervisado que:

1. Recibe una imagen con ingredientes
2. Detecta los ingredientes usando un modelo CNN con Transfer Learning
3. Recomienda recetas que contengan esos ingredientes

## Arquitectura

Arquitectura:

Frontend (HTML) -> Flask API (Python) -> Modelo CNN (MobileNetV2) -> Motor de recomendación

## Requisitos

Python 3.10+

Instalar dependencias:

```
pip install flask flask-sqlalchemy werkzeug
```

---

## Estructura del Proyecto

## 📂 Flat Project Structure

```
📂 proyecto_PTIA
┣ 📂 proyecto_resetas/
┃ ┣ 📂 static/                  # Archivos estáticos
┃ ┃ ┣ 📂 css/                   # Hojas de estilo
┃ ┃ ┃ ┗ 🎨 style.css    
┃ ┃ ┣ 📂 locales/               # Archivos de idioma
┃ ┃ ┃ ┗ 🟨 en.json
┃ ┃ ┣ 📂 public/                # Archivos públicos del sitio
┃ ┃ ┃ ┣ 🤖 robots.txt
┃ ┃ ┃ ┗ 🖼️ image.svg
┃ ┃ ┗ 📂 templates/             # Plantillas HTML
┃ ┃   ┗ 🌐 archivo.html
┃ ┣ 🐍 app.py                   # Aplicación principal
┃ ┣ 🗄️ database.db              # Base de datos SQLite
┣ 📂 venv/                      # Entorno virtual de Python
┃ ┣ 📂 Include/
┃ ┣ 📂 Lib/
┃ ┣ 📂 Scripts/
┃ ┗ ⚙️ pyvenv.cfg
┣ 🚫 .gitignore
┣ 📄 LICENSE
┗ 📄 README.md
```
---

## Ejecutar el Sistema

1. Entrenar el modelo:

```
py train_model.py
```

2. Ejecutar la aplicación:

```
py app.py
```

3. Abrir en navegador:

```
http://127.0.0.1:5000
```
