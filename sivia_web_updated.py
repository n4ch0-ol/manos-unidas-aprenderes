import os
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
CORS(app)

# --- PROVEEDORES GRATIS ---
# Z.AI es prioridad 1 (gratis para siempre, sin tarjeta, probado que anda)
ZAI_API_KEY = os.getenv("ZAI_API_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
CF_API_TOKEN = os.getenv("CF_API_TOKEN")
CF_ACCOUNT_ID = os.getenv("CF_ACCOUNT_ID")

# Modelo de Z.ai ya verificado que funciona con tu API key
ZAI_MODEL = os.getenv("ZAI_MODEL", "glm-4.6v-flash")

MODELS_TO_TRY = []

# 1) Z.AI / Zhipu — gratis para siempre
if ZAI_API_KEY:
    MODELS_TO_TRY.append((
        "https://api.z.ai/api/paas/v4/chat/completions",
        ZAI_API_KEY,
        ZAI_MODEL
    ))

# 2) GitHub Models (fallback)
if GITHUB_TOKEN:
    MODELS_TO_TRY.append((
        "https://models.github.ai/inference/chat/completions",
        GITHUB_TOKEN,
        "openai/gpt-4o-mini"
    ))
    MODELS_TO_TRY.append((
        "https://models.github.ai/inference/chat/completions",
        GITHUB_TOKEN,
        "meta/Llama-3.3-70B-Instruct"
    ))

# 3) Cloudflare Workers AI (fallback)
if CF_API_TOKEN and CF_ACCOUNT_ID:
    MODELS_TO_TRY.append((
        f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/ai/v1/chat/completions",
        CF_API_TOKEN,
        "@cf/meta/llama-3.1-8b-instruct"
    ))

# BASE DE DATOS LOCAL
try:
    with open('knowledge_base.json', 'r', encoding='utf-8') as file:
        data = json.load(file)
    database_content = json.dumps(data, indent=2, ensure_ascii=False)
except Exception as e:
    print(f"⚠️ No se pudo cargar knowledge_base.json: {e}")
    database_content = "No hay datos específicos."

SYSTEM_INSTRUCTION = f"""
Eres SIVIA, la IA del Centro de Estudiantes.
--- DATOS LOCALES (tu base de conocimientos, PRIORIDAD sobre cualquier dato externo) ---
{database_content}
--- REGLAS ---
1. Si te preguntan sobre el "Centro de Estudiantes", usa PRIMERO los DATOS LOCALES.
2. Cuando recibas resultados de búsqueda web en el mensaje, basá tu respuesta en ellos
   y avisá si algo parece poco confiable.
3. Si no tenés información específica, dilo claramente. No inventes.
4. Respondé de forma concisa, amigable y clara.
"""


def web_search(query):
    print(f"🔎 Búsqueda web: {query}")
    try:
        r = requests.get(
            f"https://html.duckduckgo.com/html/?q={query}",
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'},
            timeout=8
        )
        r.raise_for_status()
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(r.text, "html.parser")
        snippets = []
        for s in soup.select('.result__snippet'):
            t = s.get_text().strip()
            if t and len(t) > 30:
                snippets.append(t)
            if len(snippets) >= 3:
                break
        return " ".join(snippets) if snippets else "No encontré resultados específicos."
    except Exception as e:
        print(f"Error en búsqueda web: {e}")
        return "Error al conectar con el motor de búsqueda."


def call_model(endpoint, api_key, model, messages):
    if not api_key:
        return None, "API key no configurada"
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": 1024,
        "temperature": 0.7,
        # Desactivar razonamiento interno de GLM (responde más rápido y gasta menos tokens)
        "thinking": {"type": "disabled"}
    }
    try:
        r = requests.post(
            endpoint,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
                "Accept-Language": "es-AR,es"
            },
            json=payload,
            timeout=45
        )
        if r.status_code == 429:
            return None, f"{model}: rate limit (429)"
        if r.status_code != 200:
            return None, f"{model}: HTTP {r.status_code} - {r.text[:200]}"
        answer = r.json()["choices"][0]["message"]["content"]
        return (answer if answer else None), (None if answer else f"{model}: respuesta vacía")
    except Exception as e:
        return None, f"{model}: {e}"


@app.route('/', methods=['GET'])
def home():
    return "SIVIA ONLINE - Z.AI (gratis) + GitHub Models + Cloudflare"


@app.route('/chat', methods=['POST'])
def chat():
    if not MODELS_TO_TRY:
        return jsonify({"answer": "Error: configurá al menos ZAI_API_KEY en las variables de entorno de Render."}), 500

    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"answer": "Petición no válida (no se recibió JSON)."}), 400
        user_msg = data.get("question")
        if not user_msg:
            return jsonify({"answer": "Por favor, escribe una pregunta."}), 400

        # Estos modelos de texto no procesan imágenes
        if data.get("image"):
            return jsonify({
                "answer": "Por ahora solo puedo leer texto. La función de imágenes está en mantenimiento."
            }), 400

        msg_content = user_msg
        lowered = user_msg.lower()
        triggers = ["busca web", "buscar web", "search web", "buscame", "buscá", "busca sobre"]
        if any(t in lowered for t in triggers):
            query = user_msg
            for t in triggers:
                query = query.replace(t, "")
            result = web_search(query.strip())
            msg_content = (f"El usuario pidió buscar en la web sobre: '{query.strip()}'. "
                           f"Resultados obtenidos:\n{result}\n\n"
                           f"Responde al usuario basándote en estos resultados. Si no encontraste nada útil, dilo.")

        messages = [
            {"role": "system", "content": SYSTEM_INSTRUCTION},
            {"role": "user", "content": msg_content}
        ]

        last_error = ""
        for endpoint, key, model in MODELS_TO_TRY:
            print(f"📡 Probando modelo {model}...")
            answer, error = call_model(endpoint, key, model, messages)
            if answer:
                return jsonify({"answer": answer, "model": model})
            print(f"❌ {error}")
            last_error = error or last_error

        return jsonify({
            "answer": "Lo siento, estoy sin cupo disponible por ahora. Probá de nuevo en unos minutos.",
            "details": last_error
        })
    except Exception as e:
        print(f"❌ ERROR SERVIDOR: {e}")
        return jsonify({"answer": "Error interno del servidor."}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
