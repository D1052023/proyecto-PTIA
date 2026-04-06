import joblib
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import ast

tfidf = joblib.load("models/tfidf_vectorizer.pkl")
tfidf_matrix = joblib.load("models/tfidf_matrix.pkl")

recipes = pd.read_csv("data/recipes_processed.csv")

# Convertir columnas que vienen como string a lista real
def to_list(x):
    try:
        return ast.literal_eval(x)
    except:
        return x

recipes["ingredients_list"] = recipes["ingredients_list"].apply(to_list)
recipes["steps_list"] = recipes["steps_list"].apply(to_list)
recipes["tags_list"] = recipes["tags_list"].apply(to_list)

COLUMNAS = [
    "name",
    "ingredients_list",
    "steps_list",
    "tags_list",
    "calories",
    "minutes"
]

def recomendar_por_ingredientes(ingredientes, n=5):
    query = " ".join(ingredientes)

    query_vec = tfidf.transform([query])
    similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()

    indices = similarities.argsort()[::-1][:n]

    # Convertir los resultados a diccionario limpio
    resultados = recipes.iloc[indices][COLUMNAS].to_dict(orient="records")

    return resultados