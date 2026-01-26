import os
import json
import logging
from datetime import datetime
import requests
from bs4 import BeautifulSoup
import google.generativeai as genai
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

KNOWLEDGE_FILE = "knowledge_sivia.json"

# Identidad de SIVIA con conocimiento de Manos Unidas
SIVIA_IDENTITY = """
Soy SIVIA (Sistema de Innovación Virtual con Inteligencia Aplicada), la asistente virtual oficial de Manos Unidas.

SOBRE MANOS UNIDAS:
Manos Unidas es una lista del Centro de Estudiantes comprometida con mejorar la experiencia educativa y crear una comunidad estudiantil activa y participativa. Nuestros valores son: Participación, Innovación, Comunidad y Transparencia.

MI PERSONALIDAD:
- Amigable, empática y cercana
- Profesional pero no formal en exceso
- Comprometida con ayudar a todos los estudiantes
- Conocedora de todas las propuestas y proyectos de Manos Unidas
- Experta en temas educativos y tecnológicos

MI CONOCIMIENTO:
Conozco en detalle todas las propuestas del Centro de Estudiantes Manos Unidas:
- Torneos y Concursos (Truco, Valorant, Minecraft, Fútbol, Ajedrez, UNO)
- Correcaminatas en las sierras
- Podcast Manos Unidas
- Proyecto Materiales
- Pared Creativa
- E.S.E.N.C.I.A (reforma educativa)
- Beta Lab y sistema de formularios
- Fechas de eventos y votaciones

MI PROPÓSITO:
Asistir a la comunidad estudiantil con información precisa, responder dudas y ayudar a que todos aprovechen las propuestas de Manos Unidas.

INSTRUCCIONES:
- Cuando me pregunten sobre propuestas, eventos o torneos, uso la información de mi base de conocimientos
- Si no tengo información específica, lo digo claramente
- Puedo buscar en la web si me lo piden explícitamente
- Respondo de forma clara, concisa y útil
- Uso un tono amigable pero informativo
- Si mencionan "Manos Unidas", refuerzo que es nuestra lista del Centro de Estudiantes
"""

# Configuración de Gemini
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") 
if not GOOGLE_API_KEY:
    raise ValueError("❌ No se encontró la GOOGLE_API_KEY en las variables de entorno.")

genai.configure(api_key=GOOGLE_API_KEY)
GENAI_MODEL = os.getenv("GENAI_MODEL", "models/gemini-2.0-flash-exp")

def load_knowledge():
    """Carga la base de conocimientos de SIVIA"""
    if os.path.exists(KNOWLEDGE_FILE):
        try:
            with open(KNOWLEDGE_FILE, "r", encoding="utf-8") as f:
                knowledge = json.load(f)
                logging.info(f"✅ Base de conocimientos cargada: {len(knowledge)} categorías")
                return knowledge
        except Exception as e:
            logging.error(f"❌ Error al cargar knowledge_sivia.json: {e}")
    
    # Fallback: conocimiento básico
    logging.warning("⚠️ Usando conocimiento básico (fallback)")
    return {
        "identidad_ce": "Soy SIVIA, asistente de Manos Unidas",
        "manos_unidas": {
            "nombre": "Manos Unidas",
            "tipo": "Centro de Estudiantes"
        }
    }

class CognitiveEngine:
    def __init__(self, knowledge):
        self.knowledge = knowledge
        self.genai_model = genai.GenerativeModel(GENAI_MODEL)
        
        # Crear contexto inicial con la base de conocimientos
        knowledge_context = self._build_knowledge_context()
        
        self.chat_session = self.genai_model.start_chat(history=[
            {"role": "user", "parts": [SIVIA_IDENTITY]},
            {"role": "model", "parts": ["Entendido. Soy SIVIA, asistente de Manos Unidas. Conozco todas las propuestas y estoy lista para ayudar."]},
            {"role": "user", "parts": [f"Esta es mi base de conocimientos completa:\n\n{knowledge_context}"]},
            {"role": "model", "parts": ["Perfecto. Tengo toda la información sobre Manos Unidas en mi memoria. Puedo responder preguntas sobre torneos, eventos, propuestas y más."]}
        ])
        
        logging.info(f"✅ Modelo {GENAI_MODEL} cargado con base de conocimientos")

    def _build_knowledge_context(self):
        """Construye un contexto legible de la base de conocimientos para Gemini"""
        context_parts = []
        
        # Información de Manos Unidas
        if "manos_unidas" in self.knowledge:
            mu = self.knowledge["manos_unidas"]
            context_parts.append(f"MANOS UNIDAS: {mu.get('nombre')} - {mu.get('eslogan', '')}")
            context_parts.append(f"Valores: {', '.join(mu.get('valores', []))}")
        
        # Votaciones
        if "votaciones" in self.knowledge:
            vot = self.knowledge["votaciones"]
            context_parts.append(f"\nVOTACIONES: {vot.get('fecha')}")
            context_parts.append(f"Mensaje: {vot.get('mensaje')}")
        
        # Torneos
        if "torneos_concursos" in self.knowledge:
            context_parts.append("\nTORNEOS DISPONIBLES:")
            torneos = self.knowledge["torneos_concursos"].get("torneos_disponibles", {})
            for nombre, info in torneos.items():
                context_parts.append(f"- {info.get('nombre')}: {info.get('descripcion')}")
        
        # Otras propuestas
        for key in ["correcaminatas", "podcast", "proyecto_materiales", "pared_creativa", "esencia"]:
            if key in self.knowledge:
                prop = self.knowledge[key]
                context_parts.append(f"\n{prop.get('nombre', key.upper())}: {prop.get('descripcion', '')}")
        
        return "\n".join(context_parts)

    def _safe_web_search(self, query):
        """Búsqueda web con Google"""
        logging.info(f"🔎 Búsqueda web: {query}")
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(
                f"https://www.google.com/search?q={query}", 
                headers=headers,
                timeout=5
            )
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            snippets = []
            
            for g in soup.find_all('div', class_='BNeawe vvjwJb AP7Wnd'):
                snippet_text = g.get_text()
                if snippet_text and len(snippet_text) > 30:
                    snippets.append(snippet_text)
                    if len(snippets) >= 3:
                        break
            
            if snippets:
                return " ".join(snippets)
            return "No encontré resultados específicos."
            
        except Exception as e:
            logging.error(f"Error en búsqueda web: {e}")
            return "Error al conectar con el motor de búsqueda."

    def respond(self, text):
        """Procesa la pregunta del usuario y genera respuesta"""
        text_lower = text.lower()
        
        # Si pide búsqueda web explícitamente
        if "buscar web" in text_lower or "busca web" in text_lower or "search web" in text_lower:
            query = text.replace("buscar web sobre", "").replace("busca web sobre", "").strip()
            if not query:
                return "QUERY", "¿Qué tema quieres que busque en la web?", ""
            
            search_result = self._safe_web_search(query)
            context = f"Resultados de búsqueda web sobre '{query}':\n{search_result}"
            response = self._generate_response(
                f"Basándote en estos resultados de búsqueda, responde sobre: {query}", 
                context
            )
            return "WEB", response, query
        
        # Respuesta normal usando conocimientos
        relevant_context = self._get_relevant_context(text_lower)
        response = self._generate_response(text, relevant_context)
        return "KNOWLEDGE", response, ""

    def _get_relevant_context(self, query):
        """Obtiene contexto relevante de la base de conocimientos según la query"""
        context_parts = []
        
        # Detectar temas relevantes
        query_lower = query.lower()
        
        # Torneos y concursos
        torneos_keywords = ["torneo", "concurso", "truco", "valorant", "minecraft", "futbol", "football", "ajedrez", "uno"]
        if any(kw in query_lower for kw in torneos_keywords):
            if "torneos_concursos" in self.knowledge:
                context_parts.append(json.dumps(self.knowledge["torneos_concursos"], ensure_ascii=False, indent=2))
        
        # Votaciones
        if any(kw in query_lower for kw in ["votacion", "votar", "eleccion", "lista", "noviembre"]):
            if "votaciones" in self.knowledge:
                context_parts.append(json.dumps(self.knowledge["votaciones"], ensure_ascii=False, indent=2))
        
        # Correcaminatas
        if any(kw in query_lower for kw in ["correcaminata", "sierra", "deporte", "caminar", "correr"]):
            if "correcaminatas" in self.knowledge:
                context_parts.append(json.dumps(self.knowledge["correcaminatas"], ensure_ascii=False, indent=2))
        
        # Podcast
        if "podcast" in query_lower:
            if "podcast" in self.knowledge:
                context_parts.append(json.dumps(self.knowledge["podcast"], ensure_ascii=False, indent=2))
        
        # Materiales
        if any(kw in query_lower for kw in ["material", "utiles", "compra", "inversion"]):
            if "proyecto_materiales" in self.knowledge:
                context_parts.append(json.dumps(self.knowledge["proyecto_materiales"], ensure_ascii=False, indent=2))
        
        # Pared creativa
        if any(kw in query_lower for kw in ["pared", "creativ", "dibujar", "escribir"]):
            if "pared_creativa" in self.knowledge:
                context_parts.append(json.dumps(self.knowledge["pared_creativa"], ensure_ascii=False, indent=2))
        
        # E.S.E.N.C.I.A
        if any(kw in query_lower for kw in ["esencia", "reforma", "educativ", "sistema"]):
            if "esencia" in self.knowledge:
                context_parts.append(json.dumps(self.knowledge["esencia"], ensure_ascii=False, indent=2))
        
        # SIVIA
        if any(kw in query_lower for kw in ["sivia", "quien eres", "que eres", "como funciona"]):
            if "sobre_sivia" in self.knowledge:
                context_parts.append(json.dumps(self.knowledge["sobre_sivia"], ensure_ascii=False, indent=2))
        
        # Beta Lab
        if any(kw in query_lower for kw in ["beta", "experimento", "votar", "funcionalidad"]):
            if "beta_lab" in self.knowledge:
                context_parts.append(json.dumps(self.knowledge["beta_lab"], ensure_ascii=False, indent=2))
        
        # Formularios
        if any(kw in query_lower for kw in ["formulario", "form", "contacto", "propuesta", "sugerencia"]):
            if "formularios_disponibles" in self.knowledge:
                context_parts.append(json.dumps(self.knowledge["formularios_disponibles"], ensure_ascii=False, indent=2))
        
        # Manos Unidas general
        if any(kw in query_lower for kw in ["manos unidas", "centro de estudiantes", "que es", "quienes son"]):
            if "manos_unidas" in self.knowledge:
                context_parts.append(json.dumps(self.knowledge["manos_unidas"], ensure_ascii=False, indent=2))
        
        # Si no hay contexto específico, dar información general
        if not context_parts:
            context_parts.append("Usa tu conocimiento general de Manos Unidas para responder.")
        
        return "\n\n".join(context_parts)

    def _generate_response(self, prompt, context):
        """Genera respuesta usando Gemini con el contexto proporcionado"""
        full_prompt = f"""Contexto relevante:
{context}

Pregunta del usuario: {prompt}

Instrucciones:
- Responde de forma clara, amigable y concisa
- Usa la información del contexto cuando sea relevante
- Si la pregunta es sobre Manos Unidas, enfatiza nuestras propuestas
- Si no tienes información específica, dilo honestamente
- Mantén un tono profesional pero cercano
- No inventes información

Respuesta:"""

        try:
            response = self.chat_session.send_message(full_prompt)
            return response.text
        except Exception as e:
            logging.error(f"Error en Gemini: {e}")
            return "Lo siento, tuve un problema al procesar tu pregunta. ¿Podrías reformularla?"

# Flask App
app = Flask(__name__)
CORS(app)

# Cargar SIVIA al iniciar
try:
    kb = load_knowledge()
    engine = CognitiveEngine(kb)
    logging.info("✅ SIVIA iniciada correctamente")
except Exception as e:
    logging.error(f"❌ Error crítico al iniciar SIVIA: {e}")
    engine = None

@app.route("/", methods=['GET'])
def index():
    return jsonify({
        "status": "online",
        "service": "SIVIA Backend",
        "version": "2.0",
        "centro_estudiantes": "Manos Unidas"
    })

@app.route("/chat", methods=['POST'])
def handle_chat():
    global engine
    
    if not engine:
        return jsonify({
            "answer": "Lo siento, SIVIA no está disponible en este momento. Por favor, intenta más tarde."
        }), 500

    try:
        user_question = request.json.get("question")
        if not user_question:
            return jsonify({"error": "No se recibió ninguna pregunta."}), 400

        logging.info(f"📥 Pregunta: {user_question}")
        
        intent, response, query = engine.respond(user_question)
        
        logging.info(f"📤 Respuesta ({intent}): {response[:100]}...")
        
        return jsonify({"answer": response})
        
    except Exception as e:
        logging.error(f"❌ Error procesando chat: {e}")
        return jsonify({
            "answer": "Tuve un problema al procesar tu pregunta. ¿Podrías intentar de nuevo?"
        }), 500

@app.route("/health", methods=['GET'])
def health():
    """Endpoint para verificar el estado del servicio"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "knowledge_loaded": engine is not None
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)