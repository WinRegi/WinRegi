import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import CommandIntent, CommandResult, UserSettings, SummaryRequest
from security import SecurityEngine
from ai_engine import AIEngine
import json
import os

app = FastAPI(title="WinRegi Backend")

# CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, lock this down
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Engines
security = SecurityEngine()
ai = AIEngine()

# Determine App Data Path
if os.name == 'nt':
    APP_DATA = os.path.join(os.environ['APPDATA'], 'winregii')
else:
    APP_DATA = os.path.join(os.path.expanduser('~'), '.winregii')

if not os.path.exists(APP_DATA):
    os.makedirs(APP_DATA)

USER_SETTINGS_PATH = os.path.join(APP_DATA, "user_settings.json")
LOG_PATH = os.path.join(APP_DATA, "backend.log")

# Setup Logging
import logging
logging.basicConfig(filename=LOG_PATH, level=logging.INFO, format='%(asctime)s %(message)s')
logging.info("Backend starting...")

# Load initial settings to configure AI
def load_settings():
    if os.path.exists(USER_SETTINGS_PATH):
        try:
            with open(USER_SETTINGS_PATH, "r") as f:
                data = json.load(f)
                if data.get("gemini_api_key"):
                    ai.set_gemini_key(data["gemini_api_key"])
                return data
        except Exception as e:
            logging.error(f"Failed to load settings: {e}")
            pass
    return {}

current_settings = load_settings()

@app.get("/health")
def health_check():
    return {"status": "ok", "mode": "production" if os.environ.get("IS_PROD") else "development"}

@app.post("/process-intent", response_model=CommandResult)
def process_intent(req: CommandIntent):
    # 1. Trusted List Check
    trusted = security.check_trusted_intent(req.intent)
    if trusted:
        return trusted
    
    # 2. AI Generation
    # Use provider from request or default from settings
    provider = req.provider
    if req.api_key:
         ai.set_gemini_key(req.api_key) # Update key if provided in request
    
    result = ai.generate(req.intent, provider)
    
    # 3. Admin Check Logic (Basic Heuristic)
    # A real implementation might use another AI pass or keyword matching
    admin_keywords = ["hklm", "system32", "service", "admin", "start-service", "stop-service", "set-service"]
    if any(keyword in result.command.lower() for keyword in admin_keywords):
        result.requires_admin = True
    
    return result

@app.post("/summarize")
def summarize(req: SummaryRequest):
    provider = req.provider
    if req.api_key:
        ai.set_gemini_key(req.api_key)
        
    return ai.summarize(req.intent, req.output, provider)

@app.get("/settings")
def get_settings():
    if os.path.exists(USER_SETTINGS_PATH):
        with open(USER_SETTINGS_PATH, "r") as f:
            return json.load(f)
    return {}

@app.post("/settings")
def update_settings(settings: UserSettings):
    with open(USER_SETTINGS_PATH, "w") as f:
        f.write(settings.model_dump_json(indent=2))
    
    # Update runtime config
    if settings.gemini_api_key:
        ai.set_gemini_key(settings.gemini_api_key)
        
    return {"status": "updated"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5000)
