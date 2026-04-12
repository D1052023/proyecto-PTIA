from deep_translator import GoogleTranslator

def traducir_lista(items: list[str], src="en", dest="es") -> list[str]:
    """Traduce una lista de strings. Retorna la lista original si falla."""
    if not items:
        return items
    translator = GoogleTranslator(source=src, target=dest)
    try:
        # Unir con separador raro para traducir en una sola petición
        joined = " ||| ".join(items)
        translated = translator.translate(joined)
        parts = [p.strip() for p in translated.split("|||")]
        # Si el split falla, caer de a uno
        if len(parts) != len(items):
            return [translator.translate(i) for i in items]
        return parts
    except Exception as e:
        print(f"Error traduciendo lista: {e}")
        return items

def traducir_texto(texto: str, src="en", dest="es") -> str:
    """Traduce un string individual."""
    if not texto:
        return texto
    try:
        return GoogleTranslator(source=src, target=dest).translate(texto)
    except Exception as e:
        print(f"Error traduciendo texto: {e}")
        return texto

def traducir_receta(receta: dict) -> dict:
    """
    Traduce todos los campos de texto de una receta al español.
    Recibe el dict normalizado que devuelve recomendar_por_ingredientes.
    """
    receta["name"]             = traducir_texto(receta.get("name", ""))
    receta["ingredients_list"] = traducir_lista(receta.get("ingredients_list", []))
    receta["steps_list"]       = traducir_lista(receta.get("steps_list", []))
    receta["tags_list"]        = traducir_lista(receta.get("tags_list", []))
    return receta