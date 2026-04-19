from flask import Flask, render_template, request, redirect, flash, url_for, session, jsonify
from flask_bcrypt import Bcrypt
from proyecto_recetas.database import users_collection
from authlib.integrations.flask_client import OAuth
import requests

import secrets
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
import locale
from dotenv import load_dotenv
import os
import json

from werkzeug.utils import secure_filename

load_dotenv()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
HF_API_URL = os.getenv("HF_API_URL")
HF_RECOMENDER_URL = os.getenv("HF_RECOMENDER_URL")


try:
    locale.setlocale(locale.LC_TIME, "es_ES.UTF-8")
except:
    try:
        locale.setlocale(locale.LC_TIME, "Spanish_Spain")
    except:
        locale.setlocale(locale.LC_TIME, "es_ES")

def enviar_correo(token):
    try:
        remitente = os.getenv("EMAIL_USER")
        contraseña = os.getenv("EMAIL_PASS")
        destinatario = "paco.andres03@gmail.com"

        link = f"http://localhost:5000/reset-password/{token}"

        mensaje = MIMEText(f"""
Hola,

Este es tu link para cambiar la contraseña:

{link}

Si no solicitaste este cambio ignora este correo.
""")

        mensaje["Subject"] = "Recuperar contraseña"
        mensaje["From"] = remitente
        mensaje["To"] = destinatario

        servidor = smtplib.SMTP("smtp.gmail.com", 587)
        servidor.starttls()
        servidor.login(remitente, contraseña)
        servidor.send_message(mensaje)
        servidor.quit()

        print("Correo enviado correctamente")

    except Exception as e:
        print("Error enviando correo:", e)


app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY")

bcrypt = Bcrypt(app)
oauth = OAuth(app)

google = oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={
        "scope": "openid email profile"
    }
)

@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]
        user = users_collection.find_one({"email": email})
        if user and bcrypt.check_password_hash(user["password"], password):
            session["user"] = email
            return redirect("/dashboard")
        flash("Correo o contraseña incorrectos")
        return redirect("/")
    return render_template("login.html")

@app.route("/register/google")
def register_google():
    redirect_uri = url_for("register_google_callback", _external=True)
    return google.authorize_redirect(redirect_uri)

@app.route("/login/google")
def login_google():
    redirect_uri = url_for("login_google_callback", _external=True)
    return google.authorize_redirect(redirect_uri)

@app.route("/register/google/callback")
def register_google_callback():
    token = google.authorize_access_token()
    user_info = google.get(
        "https://www.googleapis.com/oauth2/v2/userinfo"
    ).json()

    email = user_info["email"]
    name = user_info["name"]

    user = users_collection.find_one({"email": email})

    if user:
        flash("Esta cuenta ya está registrada. Inicia sesión.")
        return redirect("/login")

    users_collection.insert_one({
        "email": email,
        "name": name,
        "google": True,
        "created_at": datetime.utcnow()
    })

    session["user"] = email
    return redirect("/dashboard")

@app.route("/login/google/callback")
def login_google_callback():
    token = google.authorize_access_token()
    user_info = google.get(
        "https://www.googleapis.com/oauth2/v2/userinfo"
    ).json()

    email = user_info["email"]
    user = users_collection.find_one({"email": email})

    if not user:
        flash("Esta cuenta no está registrada. Debes registrarte primero.")
        return redirect("/login")

    session["user"] = email
    return redirect("/dashboard")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form["name"]
        email = request.form["email"]
        password = request.form["password"]
        confirm_password = request.form["confirm_password"]
        terms = request.form.get("terms")

        if not terms:
            flash("Debes aceptar los términos y condiciones")
            return redirect("/register")

        if password != confirm_password:
            flash("Las contraseñas no coinciden")
            return redirect("/register")

        existing_user = users_collection.find_one({"email": email})
        if existing_user:
            flash("El usuario ya existe")
            return redirect("/register")

        hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

        users_collection.insert_one({
            "name": name,
            "email": email,
            "password": hashed_password,
            "created_at": datetime.utcnow()
        })

        flash("Usuario creado correctamente")
        return redirect("/")

    return render_template("register.html")

@app.route("/forgotPassword", methods=["GET", "POST"])
def forgot_password():
    if request.method == "POST":
        email = request.form["email"]
        user = users_collection.find_one({"email": email})

        if not user:
            flash("Este correo no está registrado")
            return redirect("/forgotPassword")

        token = secrets.token_urlsafe(32)

        users_collection.update_one(
            {"email": email},
            {
                "$set": {
                    "reset_token": token,
                    "token_expire": datetime.utcnow() + timedelta(minutes=15)
                }
            }
        )

        enviar_correo(token)
        session["reset_email"] = email
        return redirect("/resetPassword")

    return render_template("forgotPassword.html")

@app.route("/resetPassword")
def reset_password():
    email = session.get("reset_email")
    if not email:
        return redirect("/")
    return render_template("resetPassword.html", email=email)

@app.route("/reset-password/<token>", methods=["GET", "POST"])
def reset_password_token(token):
    user = users_collection.find_one({"reset_token": token})

    if not user:
        return "Token inválido"

    if user["token_expire"] < datetime.utcnow():
        return "Token expirado"

    if request.method == "POST":
        password = request.form["password"]
        confirm = request.form["confirm"]

        if password != confirm:
            return "Las contraseñas no coinciden"

        hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

        users_collection.update_one(
            {"reset_token": token},
            {
                "$set": {"password": hashed_password},
                "$unset": {"reset_token": "", "token_expire": ""}
            }
        )

        return redirect("/")

    return render_template("newPassword.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/profile")
def profile():
    if "user" not in session:
        return redirect("/")

    email = session["user"]
    user = users_collection.find_one({"email": email})

    created = user.get("created_at")
    if created:
        fecha_registro = created.strftime("%B %Y")
    else:
        fecha_registro = "Fecha no disponible"

    user_data = {
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "phone": user.get("phone", ""),
        "location": user.get("location", ""),
        "photo": user.get("photo", ""),
        "fecha_registro": fecha_registro,
        "language": user.get("language", "es"),
        "timezone": user.get("timezone", "America/Bogota")
    }

    return render_template("profile.html", user=user_data)

@app.route("/logout", methods=["GET", "POST"])
def logout():
    session.clear()
    return redirect("/")

@app.route("/profile/update", methods=["POST"])
def update_profile():
    if "user" not in session:
        return {"success": False, "message": "No autorizado"}, 401

    email = session["user"]
    data = request.get_json()

    update_fields = {}

    if "name" in data:
        update_fields["name"] = data["name"]
    if "phone" in data:
        update_fields["phone"] = data["phone"]
    if "location" in data:
        update_fields["location"] = data["location"]
    if "language" in data:
        update_fields["language"] = data["language"]
    if "timezone" in data:
        update_fields["timezone"] = data["timezone"]
    if "photo" in data:
        update_fields["photo"] = data["photo"]

    users_collection.update_one(
        {"email": email},
        {"$set": update_fields}
    )

    return {"success": True}

@app.route("/recipe")
def recipe():
    return render_template("recipe.html")

@app.route('/favorites')
def favorites():
    return render_template('favorites.html')

@app.route('/detect-dish', methods=['POST'])
def detect_dish():
    if 'file' not in request.files:
        return jsonify({'error': 'No se envió ningún archivo'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Archivo vacío'}), 400

    try:
        # 1. Preparar la imagen para enviarla
        # Leemos los bytes del archivo directamente de la memoria
        files = {'foto': (file.filename, file.read(), file.content_type)}

        # 2. Llamada al microservicio en Hugging Face
        # Enviamos un POST a la URL de producción
        response = requests.post(HF_API_URL, files=files, timeout=20)
        
        # 3. Validar respuesta del microservicio
        if response.status_code != 200:
            return jsonify({
                'error': 'El servicio de IA no respondió correctamente',
                'detalle': response.json().get('error', 'Error desconocido')
            }), response.status_code

        # 4. Obtener datos de la IA (plato e ingredientes)
        data_ia = response.json()
        
        # Estructura que devuelve tu Hugging Face: {"plato": "...", "ingredientes": [...]}
        plato = data_ia.get('plato')
        ingredientes = data_ia.get('ingredientes', [])

        # 5. Respuesta para tu Frontend
        return jsonify({
            'plato': plato,
            'ingredientes': ingredientes,
            'source': 'huggingface_api'
        })

    except requests.exceptions.Timeout:
        return jsonify({'error': 'La IA tardó demasiado en responder (Timeout)'}), 504
    except Exception as e:
        print(f'Error en detect_dish principal: {e}')
        return jsonify({'error': str(e)}), 500
@app.route('/api/recetas', methods=['POST'])
def api_recetas():
    try:
        data = request.get_json()
        ingredientes = data.get('ingredientes', [])
        offset = int(data.get('offset', 0))
        page_size = 40
        
        # Si no hay ingredientes, podríamos manejar una lógica local simple o 
        # pedirle al microservicio una búsqueda general.
        if len(ingredientes) == 0:
            # Opción: Mandar una búsqueda vacía o por defecto al microservicio
            ingredientes = ["popular"] 

        # 1. Llamada al microservicio de RECOMENDACIÓN en Hugging Face
        # Enviamos los ingredientes en ESPAÑOL (el microservicio se encarga de traducir)
        payload = {
            "ingredientes": ingredientes,
            "n": offset + page_size,
            "alpha": 0.7
        }

        response = requests.post(HF_RECOMENDER_URL, json=payload, timeout=60)

        if response.status_code != 200:
            return jsonify({
                'error': 'El recomendador no respondió correctamente',
                'detalle': response.json().get('error', 'Error desconocido')
            }), response.status_code

        # 2. El microservicio ya devuelve las recetas TRADUCIDAS y NORMALIZADAS
        data_ia = response.json()
        recetas_todas = data_ia.get('recetas', [])
        
        # Aplicamos el offset para la paginación
        recetas_pagina = recetas_todas[offset:]

        return jsonify({
            'recetas': recetas_pagina,
            'total': len(recetas_pagina),
            'offset': offset + page_size,
            'modo': 'ingredientes_ia'
        })

    except requests.exceptions.Timeout:
        return jsonify({'error': 'El recomendador tardó demasiado (Timeout)'}), 504
    except Exception as e:
        print(f'Error en api_recetas principal: {e}')
        return jsonify({'error': str(e)}), 500
if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)