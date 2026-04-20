from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Cargar variables
load_dotenv()

# Conexión segura
MONGO_URI = os.getenv("MONGO_URI")

# Configuramos un timeout para que no se quede colgado si falla la red
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)

# Base de datos
db = client.get_database()

# Colección
users_collection = db["users"]

# ESTO ES LO IMPORTANTE:
# Solo imprimimos si la conexión es exitosa, pero no ejecutamos inserts aquí.
try:
    client.admin.command('ping')
    print("✅ Conectado exitosamente a MongoDB Atlas")
except Exception as e:
    print(f"❌ Error de conexión a MongoDB: {e}")

# BORRA O COMENTA TODO LO QUE SIGUE (El insert y el for de lectura)
# Esas pruebas debes hacerlas desde rutas en app.py, no aquí.