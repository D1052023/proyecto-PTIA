from database import users_collection

# insertar usuario de prueba
user = {
    "name": "test",
    "email": "test@test.com",
    "password": "123456"
}

users_collection.insert_one(user)

print("✅ Usuario insertado")

# leer usuarios
users = users_collection.find()

for u in users:
    print(u)
