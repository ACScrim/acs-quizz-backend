import os
import json
import time
import requests
from glob import glob

# Liste des serveurs LibreTranslate disponibles
TRANSLATE_SERVERS = [
    "http://127.0.0.1:5000/translate"
]

CACHE_FILE = "translation_cache.json"

# Charger le cache si disponible
if os.path.exists(CACHE_FILE):
    with open(CACHE_FILE, "r", encoding="utf-8") as f:
        cache = json.load(f)
else:
    cache = {}

def translate_text(text, source="en", target="fr", retries=2, timeout=10):
    if text in cache:
        return cache[text]

    for server in TRANSLATE_SERVERS:
        for attempt in range(retries):
            try:
                response = requests.post(server, data={
                    "q": text,
                    "source": source,
                    "target": target,
                    "format": "text"
                }, timeout=timeout)
                response.raise_for_status()
                translated = response.json()["translatedText"]
                cache[text] = translated
                return translated
            except requests.exceptions.RequestException as e:
                print(f"[WARN] {server} - tentative {attempt + 1}/{retries} échouée pour : {text[:50]}... ({e})")
                time.sleep(2)
        print(f"[INFO] Serveur {server} semble injoignable, essai du suivant...")

    print(f"[ERROR] Traduction échouée pour : {text[:50]} après {len(TRANSLATE_SERVERS)} serveurs.")
    return text

def translate_file(file_path):
    print(f"[INFO] Traduction de {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    for item in data:
        item["question"] = translate_text(item["question"])
        item["correct_answer"] = translate_text(item["correct_answer"])
        item["incorrect_answers"] = [translate_text(ans) for ans in item["incorrect_answers"]]
        time.sleep(1.2)  # Respect du taux de requêtes

    output_path = os.path.join("categories/fr", os.path.basename(file_path).replace(".json", "_fr.json"))
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"[SUCCESS] Fichier traduit sauvegardé dans : {output_path}")

def main():
    for filepath in glob("categories/en/opentdb_*.json"):
        filename = os.path.basename(filepath)
        translated_path = os.path.join("categories/fr", filename.replace(".json", "_fr.json"))

        # Vérification si déjà traduit avec le bon nombre de questions
        if os.path.exists(translated_path):
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    original = json.load(f)
                with open(translated_path, "r", encoding="utf-8") as f:
                    translated = json.load(f)
                if len(original) == len(translated):
                    print(f"[INFO] {translated_path} contient déjà {len(translated)} questions, on saute.")
                    continue
            except Exception as e:
                print(f"[WARN] Erreur lecture pour vérification: {filename} ({e})")

        # Traduction
        translate_file(filepath)

    # Sauvegarde du cache
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2, ensure_ascii=False)
    print(f"[INFO] Cache sauvegardé dans {CACHE_FILE}")

if __name__ == "__main__":
    main()
