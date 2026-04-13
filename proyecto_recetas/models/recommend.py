import joblib
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import ast
import os

# 📌 Base del proyecto
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 📌 Rutas correctas
ruta_csv = os.path.join(BASE_DIR, "..", "data", "recipes_processed.csv.gz")
ruta_tfidf = os.path.join(BASE_DIR, "..", "models", "tfidf_vectorizer.pkl")
ruta_matrix = os.path.join(BASE_DIR, "..", "models", "tfidf_matrix.pkl")

# 📌 Cargar modelos y datos
tfidf = joblib.load(ruta_tfidf)
tfidf_matrix = joblib.load(ruta_matrix)
recipes = pd.read_csv(ruta_csv)

# 📌 Convertir strings a listas
def to_list(x):
    try:
        return ast.literal_eval(x)
    except:
        return x

recipes["ingredients_list"] = recipes["ingredients_list"].apply(to_list)
recipes["steps_list"] = recipes["steps_list"].apply(to_list)
recipes["tags_list"] = recipes["tags_list"].apply(to_list)

# 📌 Columnas a mostrar
COLUMNAS = [
    "name",
    "ingredients_list",
    "steps_list",
    "tags_list",
    "calories",
    "minutes",
    "num_reviews",
    "avg_rating",
    "popularity_score",
]

# 📌 Función principal
def recomendar_por_ingredientes(ingredientes, n=12, alpha=0.7):
    query = " ".join(ingredientes)
    query_vec = tfidf.transform([query])

    # 🔹 similitud
    sim_scores = cosine_similarity(query_vec, tfidf_matrix).flatten()

    # 🔹 popularidad normalizada
    pop = recipes["popularity_score"].fillna(0).values
    pop_min, pop_max = pop.min(), pop.max()

    if pop_max > pop_min:
        pop_norm = (pop - pop_min) / (pop_max - pop_min)
    else:
        pop_norm = pop * 0

    # 🔹 score final
    final_scores = alpha * sim_scores + (1 - alpha) * pop_norm

    # 🔹 top resultados
    indices = final_scores.argsort()[::-1][:n]

    resultados = recipes.iloc[indices][COLUMNAS].to_dict(orient="records")

    # 🔹 agregar métricas
    for i, idx in enumerate(indices):
        resultados[i]["match_score"] = round(float(sim_scores[idx]), 4)
        resultados[i]["popularity_score"] = round(float(pop_norm[idx]), 4)
        resultados[i]["final_score"] = round(float(final_scores[idx]), 4)

    return resultados