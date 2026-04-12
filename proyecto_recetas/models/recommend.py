import joblib
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import ast

tfidf        = joblib.load("models/tfidf_vectorizer.pkl")
tfidf_matrix = joblib.load("models/tfidf_matrix.pkl")

recipes = pd.read_csv("data/recipes_processed.csv.gz")

def to_list(x):
    try:
        return ast.literal_eval(x)
    except:
        return x

recipes["ingredients_list"] = recipes["ingredients_list"].apply(to_list)
recipes["steps_list"]       = recipes["steps_list"].apply(to_list)
recipes["tags_list"]        = recipes["tags_list"].apply(to_list)

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

def recomendar_por_ingredientes(ingredientes, n=12, alpha=0.7):
    """
    Retorna recetas ordenadas por un score combinado:
      score_final = alpha * similitud_tfidf + (1 - alpha) * popularity_score_normalizado

    ingredientes : lista de strings en inglés
    n            : cantidad de resultados a devolver
    alpha        : peso de la similitud (0-1). 0.7 = 70% similitud, 30% popularidad
    """
    query     = " ".join(ingredientes)
    query_vec = tfidf.transform([query])

    # ── Similitud coseno ──────────────────────────────────
    sim_scores = cosine_similarity(query_vec, tfidf_matrix).flatten()

    # ── Normalizar popularity_score al rango [0, 1] ───────
    pop = recipes["popularity_score"].fillna(0).values
    pop_min, pop_max = pop.min(), pop.max()
    if pop_max > pop_min:
        pop_norm = (pop - pop_min) / (pop_max - pop_min)
    else:
        pop_norm = pop * 0

    # ── Score final combinado ─────────────────────────────
    final_scores = alpha * sim_scores + (1 - alpha) * pop_norm

    # ── Top-n índices por score final ─────────────────────
    indices = final_scores.argsort()[::-1][:n]

    resultados = recipes.iloc[indices][COLUMNAS].to_dict(orient="records")

    # Adjuntar scores para que el frontend pueda mostrarlos
    for i, idx in enumerate(indices):
        resultados[i]["match_score"]      = round(float(sim_scores[idx]), 4)
        resultados[i]["popularity_score"] = round(float(pop_norm[idx]), 4)
        resultados[i]["final_score"]      = round(float(final_scores[idx]), 4)

    return resultados