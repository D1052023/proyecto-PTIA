from pymongo import MongoClient
from dotenv import load_dotenv
import os

import certifi

# cargar variables
load_dotenv()

# conexión segura (tlsCAFile ayuda en Windows con Atlas cuando falla el handshake TLS)
MONGO_URI = os.getenv("MONGO_URI")

client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())

# base de datos (opcional si ya viene en la URI)
db = client.get_database()

# colección
users_collection = db["users"]

print("✅ Conectado a MongoDB Atlas")