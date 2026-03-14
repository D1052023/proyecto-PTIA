from pymongo import MongoClient

# conexión a MongoDB Atlas
MONGO_URI = "mongodb+srv://pacoandres03_db_user:admin@blueteam.biz5ysx.mongodb.net/?appName=BlueTeam"

client = MongoClient(MONGO_URI)

# base de datos
db = client["recetafacil"]

# colección
users_collection = db["users"]

print("✅ Conectado a MongoDB")