from flask import Flask, render_template, request, redirect, flash, url_for, session, jsonify
from flask_bcrypt import Bcrypt
from database import users_collection
from authlib.integrations.flask_client import OAuth
import secrets
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
import locale
from dotenv import load_dotenv
import os
import json
import google.generativeai as genai
from recomendador import recomendar_por_texto
import json
import os
from models.modelo_clip import predecir_plato
from werkzeug.utils import secure_filename

load_dotenv()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# ── Configurar Gemini ─────────────────────────────────────
genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))

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

# ── Detección de ingredientes con Gemini ──────────────────
@app.route('/detect-ingredients', methods=['POST'])
def detect_ingredients():
    if 'file' not in request.files:
        return jsonify({'error': 'No se envió ningún archivo'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Archivo vacío'}), 400

    try:
        img_bytes = file.read()
        mime_type = file.mimetype or 'image/jpeg'

        image_part = {
            'mime_type': mime_type,
            'data': img_bytes
        }

        prompt = """Analiza esta imagen e identifica todos los alimentos e ingredientes visibles.
Devuelve ÚNICAMENTE un JSON válido, sin texto adicional, sin backticks, sin markdown.
El JSON debe tener esta estructura exacta:
{
  "ingredientes": ["ingrediente1", "ingrediente2", "ingrediente3"]
}
Cada ingrediente debe estar en español, en singular y en minúsculas.
Si no puedes identificar ningún ingrediente, devuelve: {"ingredientes": []}
Sé específico (ej: "tomate cherry" en vez de solo "tomate" si es evidente)."""

        model = genai.GenerativeModel('gemini-1.5-flash-8b')
        response = model.generate_content([prompt, image_part])

        raw   = response.text.strip()
        clean = raw.replace('```json', '').replace('```', '').strip()
        data  = json.loads(clean)

        return jsonify(data)

    except json.JSONDecodeError:
        return jsonify({'error': 'La IA no devolvió un JSON válido'}), 500
    except Exception as e:
        print(f'Error en detect_ingredients: {e}')
        return jsonify({'error': str(e)}), 500
@app.route("/recomendar", methods=["GET", "POST"])
def recomendar():
    if request.method == "POST":

        if "foto" in request.files:
            foto = request.files["foto"]

            # 🔥 1. Guardar imagen correctamente
            upload_folder = os.path.join(BASE_DIR, "static", "uploads")
            os.makedirs(upload_folder, exist_ok=True)

            filename = secure_filename(foto.filename)
            ruta = os.path.join(upload_folder, filename)
            foto.save(ruta)

            # 🔥 2. Detectar plato con IA
            plato = predecir_plato(ruta)
            plato = plato.lower().strip()

            # 🔥 3. Cargar ingredientes por plato
            mapa_path = os.path.join(BASE_DIR, "data", "map_plato_ingredientes.json")

            with open(mapa_path, "r", encoding="utf-8") as f:
                mapa = json.load(f)

            ingredientes_detectados = mapa.get(plato, [])

            # 🔥 4. Convertir ingredientes a texto (para IA NLP)
            texto_usuario = " ".join(ingredientes_detectados)

            # 🔥 5. Obtener recomendaciones (IA)
            recomendaciones = recomendar_por_texto(texto_usuario)

            # 🔥 6. Cargar calorías POR PLATO
            calorias_path = os.path.join(BASE_DIR, "data", "calorias_platos.json")

            if os.path.exists(calorias_path):
                with open(calorias_path, "r", encoding="utf-8") as f:
                    calorias_data = json.load(f)
            else:
                calorias_data = {}

            total_calorias = calorias_data.get(plato, "No disponible")

            # 🔥 7. Clasificación nutricional
            if isinstance(total_calorias, int):
                if total_calorias < 200:
                    nivel = "🟢 Bajo en calorías"
                elif total_calorias < 400:
                    nivel = "🟡 Moderado"
                else:
                    nivel = "🔴 Alto en calorías"
            else:
                nivel = "No disponible"

            # 🔥 8. Cargar categorías
            categorias_path = os.path.join(BASE_DIR, "data", "categorias_platos.json")

            if os.path.exists(categorias_path):
                with open(categorias_path, "r", encoding="utf-8") as f:
                    categorias_data = json.load(f)
            else:
                categorias_data = {}

            categorias = categorias_data.get(plato, ["Sin categoría"])

            # 🔥 9. Cargar RECETAS 🔥 (NUEVO)
            recetas_path = os.path.join(BASE_DIR, "data", "recetas_platos.json")

            if os.path.exists(recetas_path):
                with open(recetas_path, "r", encoding="utf-8") as f:
                    recetas_data = json.load(f)
            else:
                recetas_data = {}

            receta = recetas_data.get(plato, {"pasos": ["Receta no disponible"]})
            pasos = receta.get("pasos", ["Receta no disponible"])

            # 🔥 10. Render FINAL
            return render_template(
                "resultados.html",
                plato_detectado=plato,
                ingredientes=ingredientes_detectados,
                recomendaciones=recomendaciones,
                total_calorias=total_calorias,
                nivel=nivel,
                categorias=categorias,
                pasos=pasos,  # 👈 NUEVO
                imagen=filename
            )

    return render_template("recomendar.html")
# ── Agregar esta ruta a tu app.py ────────────────────────
# Va junto al resto de tus rutas, después de /detect-ingredients

@app.route('/detect-dish', methods=['POST'])
def detect_dish():
    if 'file' not in request.files:
        return jsonify({'error': 'No se envió ningún archivo'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Archivo vacío'}), 400

    try:
        # Guardar imagen temporalmente
        upload_folder = os.path.join(BASE_DIR, 'static', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)

        filename = secure_filename(file.filename)
        ruta     = os.path.join(upload_folder, filename)
        file.save(ruta)

        # Detectar platillo con tu modelo Food-101
        plato = predecir_plato(ruta)
        plato = plato.lower().strip()

        # Cargar mapa platillo → ingredientes
        mapa_path = os.path.join(BASE_DIR, 'data', 'map_plato_ingredientes.json')
        with open(mapa_path, 'r', encoding='utf-8') as f:
            mapa = json.load(f)

        ingredientes = mapa.get(plato, [])

        if not ingredientes:
            return jsonify({
                'error': f'Platillo "{plato}" detectado pero sin ingredientes registrados'
            }), 404

        return jsonify({
            'plato': plato,
            'ingredientes': ingredientes
        })

    except Exception as e:
        print(f'Error en detect_dish: {e}')
        return jsonify({'error': str(e)}), 500
if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)