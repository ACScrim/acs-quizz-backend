import requests
import time
import json
import os
import subprocess

BASE_URL = "https://opentdb.com"
ERRORS = []

os.makedirs("categories/en", exist_ok=True)
os.makedirs("categories/fr", exist_ok=True)

# === Étape 1 : Récupérer les catégories et leur nombre de questions vérifiées ===
def fetch_categories():
    url = f"{BASE_URL}/api_count_global.php"
    response = requests.get(url)
    response.raise_for_status()
    data = response.json()

    categories = {}
    for cat_id, cat_data in data["categories"].items():
        total_verified = cat_data["total_num_of_verified_questions"]
        if total_verified > 0:
            categories[cat_id] = total_verified

    with open("categories.json", "w", encoding="utf-8") as f:
        json.dump(categories, f, indent=2)

    print(f"[INFO] Fetched {len(categories)} categories.")
    time.sleep(5)
    return categories

# === Étape 2 : Télécharger les questions uniques par catégorie ===
def fetch_questions_for_category(cat_id, total_questions):
    questions = []
    fetched = 0
    attempt = 1
    seen_questions = set()  # Set pour suivre les questions déjà récupérées

    for filename in os.listdir("categories/en"):
        if filename.startswith("opentdb_") and filename.endswith(".json"):
            with open(os.path.join("categories/en", filename), "r", encoding="utf-8") as f:
                try:
                    existing_data = json.load(f)
                    if (
                        existing_data
                        and isinstance(existing_data, list)
                        and existing_data[0].get("category")
                    ):
                        if existing_data[0]["category"] == existing_data[0].get("category"):
                            if len(existing_data) == total_questions:
                                print(f"[INFO] {filename} contient déjà {total_questions} questions, on saute.")
                                return  # On passe cette catégorie
                except Exception:
                    pass  # Si problème de lecture/parsing, on continue quand même

    while fetched < total_questions:
        amount = min(50, total_questions - fetched)
        url = f"{BASE_URL}/api.php?amount={amount}&category={cat_id}"

        try:
            resp = requests.get(url)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            ERRORS.append({
                "category_id": cat_id,
                "code": "exception",
                "message": str(e),
                "attempt": attempt
            })
            break

        response_code = data.get("response_code")
        if response_code == 0:
            for q in data["results"]:
                # Créer une clé unique pour chaque question basée sur le texte de la question et la bonne réponse
                question_key = (q["question"], q["correct_answer"])

                # Vérifier si la question est déjà dans le set
                if question_key not in seen_questions:
                    seen_questions.add(question_key)
                    modified = q.copy()
                    modified["incorrect_answers"].append(q["correct_answer"])
                    questions.append(modified)
                    fetched += 1

            # Si on n'a pas assez de questions, on refait une autre requête
            if fetched < total_questions:
                print(f"[INFO] Pas assez de questions uniques récupérées, {fetched}/{total_questions}")
        elif response_code == 1:
            # Pas assez de questions : on tente avec un amount plus petit
            amount = max(1, amount // 2)
            if amount == 1:
                # Trop peu de questions, on abandonne
                ERRORS.append({
                    "category_id": cat_id,
                    "code": 1,
                    "message": "Pas assez de questions disponibles même pour amount=1",
                    "requested_amount": amount,
                    "attempt": attempt
                })
                break
        else:
            # Erreur connue (code 2 à 5)
            ERRORS.append({
                "category_id": cat_id,
                "code": response_code,
                "message": f"Erreur API code {response_code}",
                "requested_amount": amount,
                "attempt": attempt
            })
            break

        attempt += 1
        time.sleep(5)

    if questions:
        category_name = questions[0]["category"]
        filename = f"opentdb_{category_name}.json"
        # Nettoyer les caractères interdits dans les noms de fichiers
        filename = "".join(c for c in filename if c.isalnum() or c in " _-.").strip()
        filepath = os.path.join("categories/en", filename)

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(questions, f, indent=2)
        print(f"[INFO] Sauvegardé {len(questions)} questions dans '{filename}'.")

# === Main ===
def main():
    categories = fetch_categories()
    for cat_id, total in categories.items():
        print(f"[INFO] Téléchargement de {total} questions uniques pour la catégorie ID {cat_id}...")
        fetch_questions_for_category(cat_id, total)

    if ERRORS:
        with open("errors.json", "w", encoding="utf-8") as f:
            json.dump(ERRORS, f, indent=2)
        print(f"[WARN] {len(ERRORS)} erreurs enregistrées dans errors.json.")
        
    print("[INFO] Lancement du script de traduction...")
    subprocess.run(["python", "opentdb_translate.py"])

if __name__ == "__main__":
    main()
