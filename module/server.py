"""
FastAPI Server for Forensic Product Lifecycle & Material Analysis Module.
Exposes REST endpoints for external websites and serves the interactive testing UI.
Supports both Groq LPU Vision (default, high quota) and Google Gemini.
"""

import os
import sys
import io
import json
import base64
import logging
from typing import Optional
from pydantic import BaseModel
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse

MODULE_DIR = os.path.dirname(os.path.abspath(__file__))
if MODULE_DIR not in sys.path:
    sys.path.insert(0, MODULE_DIR)

from schemas import AnalyzeRequest, SetKeyRequest, AnalysisResult
from engine import (
    analyze_product_image,
    generate_donation_destinations,
    generate_external_portal_guide,
    load_env_file,
    detect_provider,
    ENV_FILE_PATH,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("eco_lens_server")

app = FastAPI(
    title="EcoLens: Forensic Product Material & Lifecycle API",
    description="Multimodal Search Grounded analysis returning 1-5 star Recyclability/Reusability/Reducibility, Compositions Table, Donation & DIY booleans. Powered by Groq LPU Vision & Gemini.",
    version="1.1.0",
)

# Enable CORS for seamless integration in any website (localhost:3000, 5173, production domains)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = os.path.join(MODULE_DIR, "static")
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR, exist_ok=True)


def resolve_credentials(
    header_key: Optional[str] = None,
    body_key: Optional[str] = None,
    explicit_provider: Optional[str] = None
):
    """Resolves active provider and API key with high-priority precedence."""
    load_env_file()
    key = body_key.strip() if body_key and body_key.strip() else None

    if not key and header_key and header_key.strip():
        clean_header = header_key.replace("Bearer", "").strip()
        if clean_header:
            key = clean_header

    provider = detect_provider(api_key=key, explicit_provider=explicit_provider)

    if not key:
        if provider == "groq":
            key = os.environ.get("GROQ_API_KEY")
        elif provider == "gemini":
            key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

        # Fallback cross-check
        if not key:
            key = os.environ.get("GROQ_API_KEY") or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
            if key:
                provider = detect_provider(api_key=key)

    return provider, key


@app.get("/api/health")
def health_check():
    """Checks service health, active provider (Groq / Gemini), and configured keys."""
    load_env_file()
    groq_configured = bool(os.environ.get("GROQ_API_KEY"))
    gemini_configured = bool(os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY"))
    active_prov = detect_provider()

    return {
        "status": "healthy",
        "service": "EcoLens Forensic Analyzer",
        "active_provider": active_prov,
        "active_model": "qwen/qwen3.8-27b" if active_prov == "groq" else "gemini-3.8-flash",
        "groq_api_key_configured": groq_configured,
        "gemini_api_key_configured": gemini_configured,
        "api_key_configured": groq_configured or gemini_configured,
        "features": [
            "Groq LPU Vision (Ultra-fast, high quota, prevents 429 errors)",
            "1-5 Star Recyclability",
            "1-5 Star Reusability",
            "1-5 Star Reducibility",
            "Detailed Compositions Table with % shares",
            "Donation Worthy Boolean (Food, Clothes, Accessories)",
            "DIY Project Worthy Boolean & Upcycling Ideas",
            "Image & Object Validation Guardrails",
            "Verified Search Grounding Citations & Queries",
            "Zero mock or sample data - live processing"
        ]
    }


@app.get("/api/schema")
def get_schema():
    """Returns the JSON schema of the analysis result for client integrations."""
    return AnalysisResult.model_json_schema()


@app.post("/api/set-key")
def set_api_key(payload: SetKeyRequest):
    """Allows setting and persisting the Groq or Gemini API key in the server's .env file."""
    key = payload.apiKey.strip()
    if not key or len(key) < 8:
        raise HTTPException(status_code=400, detail="Invalid API key format.")

    provider = (payload.provider or "groq").lower().strip()
    if key.startswith("gsk_"):
        provider = "groq"
    elif key.startswith("AIza"):
        provider = "gemini"

    env_var_name = "GROQ_API_KEY" if provider == "groq" else "GEMINI_API_KEY"
    env_path = ENV_FILE_PATH
    lines = []
    found_key = False
    found_provider = False

    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith(f"{env_var_name}="):
                    lines.append(f"{env_var_name}={key}\n")
                    found_key = True
                elif line.startswith("ACTIVE_PROVIDER="):
                    lines.append(f"ACTIVE_PROVIDER={provider}\n")
                    found_provider = True
                else:
                    lines.append(line)

    if not found_key:
        lines.append(f"{env_var_name}={key}\n")
    if not found_provider:
        lines.append(f"ACTIVE_PROVIDER={provider}\n")

    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(lines)

    os.environ[env_var_name] = key
    os.environ["ACTIVE_PROVIDER"] = provider

    return {
        "status": "success",
        "provider": provider,
        "message": f"{provider.capitalize()} API key saved successfully."
    }


class ConfigUpdateRequest(BaseModel):
    active_provider: Optional[str] = None
    groq_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None


@app.get("/api/config")
def get_engine_config():
    """Returns current active provider and masked keys for the secret configuration UI."""
    load_env_file()
    groq_key = os.environ.get("GROQ_API_KEY", "")
    gemini_key = os.environ.get("GEMINI_API_KEY", "") or os.environ.get("GOOGLE_API_KEY", "")
    active_prov = os.environ.get("ACTIVE_PROVIDER", "groq")

    def mask(k: str) -> str:
        if not k:
            return ""
        if len(k) <= 8:
            return "••••••••"
        return f"{k[:4]}••••••••{k[-4:]}"

    return {
        "active_provider": active_prov,
        "groq_configured": bool(groq_key),
        "gemini_configured": bool(gemini_key),
        "groq_masked": mask(groq_key),
        "gemini_masked": mask(gemini_key),
        "model": "qwen/qwen3.8-27b" if active_prov == "groq" else "gemini-1.5-flash"
    }


@app.post("/api/config")
def update_engine_config(payload: ConfigUpdateRequest):
    """Updates active provider and API keys, persisting to .env file and process environment."""
    load_env_file()
    env_path = ENV_FILE_PATH

    updates = {}
    if payload.active_provider:
        updates["ACTIVE_PROVIDER"] = payload.active_provider.lower().strip()
    if payload.groq_api_key and payload.groq_api_key.strip():
        updates["GROQ_API_KEY"] = payload.groq_api_key.strip()
    if payload.gemini_api_key and payload.gemini_api_key.strip():
        updates["GEMINI_API_KEY"] = payload.gemini_api_key.strip()

    lines = []
    found_vars = set()
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                matched = False
                for var, val in updates.items():
                    if line.startswith(f"{var}="):
                        lines.append(f"{var}={val}\n")
                        found_vars.add(var)
                        matched = True
                        break
                if not matched:
                    lines.append(line)

    for var, val in updates.items():
        if var not in found_vars:
            lines.append(f"{var}={val}\n")

    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(lines)

    for var, val in updates.items():
        os.environ[var] = val

    return {
        "status": "success",
        "active_provider": os.environ.get("ACTIVE_PROVIDER", "groq"),
        "message": "Engine configuration saved successfully."
    }


@app.post("/api/analyze")
async def analyze_image_endpoint(raw_request: Request):
    """
    Main analysis endpoint.
    Accepts:
    1. JSON payload: { "image": "base64...", "apiKey": "...", "provider": "groq" }
    2. Multipart Form: file upload + optional apiKey & provider fields
    """
    content_type = raw_request.headers.get("content-type", "").lower()
    header_groq_key = raw_request.headers.get("x-groq-api-key")
    header_gemini_key = raw_request.headers.get("x-gemini-api-key")
    header_auth = raw_request.headers.get("authorization")

    header_key = header_groq_key or header_gemini_key or header_auth
    image_base64_or_data = None
    body_key = None
    body_provider = None
    body_model = None

    if "multipart/form-data" in content_type:
        form = await raw_request.form()
        uploaded_file = form.get("file")
        body_key = form.get("apiKey")
        body_provider = form.get("provider")
        body_model = form.get("model")
        
        if uploaded_file and hasattr(uploaded_file, "read"):
            file_bytes = await uploaded_file.read()
            mime = getattr(uploaded_file, "content_type", "image/jpeg") or "image/jpeg"
            b64_str = base64.b64encode(file_bytes).decode("utf-8")
            image_base64_or_data = f"data:{mime};base64,{b64_str}"
        elif "image" in form:
            image_base64_or_data = form.get("image")
    else:
        # JSON body
        try:
            body = await raw_request.json()
        except Exception:
            raise HTTPException(status_code=400, detail="Malformed JSON body.")

        image_base64_or_data = body.get("image")
        body_key = body.get("apiKey")
        body_provider = body.get("provider")
        body_model = body.get("model")

        if not image_base64_or_data and body.get("image_url"):
            import httpx
            async with httpx.AsyncClient() as client:
                res = await client.get(body["image_url"])
                if res.status_code != 200:
                    raise HTTPException(status_code=400, detail="Could not download image from provided URL.")
                mime = res.headers.get("content-type", "image/jpeg")
                b64_str = base64.b64encode(res.content).decode("utf-8")
                image_base64_or_data = f"data:{mime};base64,{b64_str}"

    if not image_base64_or_data:
        raise HTTPException(
            status_code=400,
            detail="No image provided. Please supply base64 'image' or multipart 'file'."
        )

    provider, resolved_key = resolve_credentials(
        header_key=header_key,
        body_key=body_key,
        explicit_provider=body_provider
    )

    if not resolved_key:
        raise HTTPException(
            status_code=401,
            detail=(
                "Missing API Key. Please provide a Groq API Key (starts with 'gsk_') from https://console.groq.com/keys "
                f"or a Gemini API Key. You can set it in the web UI, {ENV_FILE_PATH}, or pass it via 'apiKey' / headers."
            )
        )

    try:
        result = analyze_product_image(
            image_data=image_base64_or_data,
            api_key=resolved_key,
            provider=provider,
            model=body_model
        )
        return JSONResponse(content=result)
    except ValueError as ve:
        logger.warning(f"Validation Guardrail triggered: {ve}")
        raise HTTPException(status_code=422, detail=str(ve))
    except RuntimeError as re:
        logger.error(f"Inference error: {re}")
        raise HTTPException(status_code=502, detail=str(re))
    except Exception as e:
        logger.exception("Unexpected error during analysis")
        raise HTTPException(status_code=500, detail=f"Analysis pipeline error: {str(e)}")


@app.post("/api/donations")
async def donation_destinations_endpoint(raw_request: Request):
    """Secondary endpoint: fetches targeted orphanages, old-age homes, and shelters."""
    try:
        body = await raw_request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed JSON body.")

    header_key = raw_request.headers.get("x-groq-api-key") or raw_request.headers.get("authorization")
    _, resolved_key = resolve_credentials(header_key=header_key, body_key=body.get("apiKey"), explicit_provider="groq")

    if not resolved_key:
        raise HTTPException(status_code=401, detail="Missing API Key for donation routing.")

    try:
        result = generate_donation_destinations(
            product_name=body.get("productName", "Reusable Item"),
            category=body.get("category", ""),
            donate_reason=body.get("donateReason", ""),
            api_key=resolved_key,
        )
        return JSONResponse(content=result)
    except Exception as e:
        logger.exception("Secondary donation routing error")
        raise HTTPException(status_code=502, detail=f"Donation routing error: {str(e)}")


@app.post("/api/external-guide")
async def external_portal_endpoint(raw_request: Request):
    """Secondary endpoint: fetches certified external takeback and recycling portal guide."""
    try:
        body = await raw_request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed JSON body.")

    header_key = raw_request.headers.get("x-groq-api-key") or raw_request.headers.get("authorization")
    _, resolved_key = resolve_credentials(header_key=header_key, body_key=body.get("apiKey"), explicit_provider="groq")

    if not resolved_key:
        raise HTTPException(status_code=401, detail="Missing API Key for external guide routing.")

    try:
        result = generate_external_portal_guide(
            product_name=body.get("productName", "Material Specimen"),
            category=body.get("category", ""),
            external_title=body.get("externalTitle", ""),
            api_key=resolved_key,
        )
        return JSONResponse(content=result)
    except Exception as e:
        logger.exception("Secondary external guide error")
        raise HTTPException(status_code=502, detail=f"External guide error: {str(e)}")


# Serve static web interface: Prioritize React production build (dist/) if present
ROOT_DIR = os.path.dirname(MODULE_DIR)
DIST_DIR = os.path.join(ROOT_DIR, "dist")

if os.path.exists(DIST_DIR) and os.path.exists(os.path.join(DIST_DIR, "index.html")):
    app.mount("/", StaticFiles(directory=DIST_DIR, html=True), name="frontend")
else:
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")


@app.exception_handler(404)
async def custom_404_handler(request: Request, exc):
    if request.url.path.startswith("/api/"):
        return JSONResponse(status_code=404, content={"detail": f"API endpoint '{request.url.path}' not found"})
    dist_index = os.path.join(DIST_DIR, "index.html")
    if os.path.exists(dist_index):
        return FileResponse(dist_index)
    return JSONResponse(status_code=404, content={"detail": "Not found"})


if __name__ == "__main__":
    import uvicorn
    load_env_file()
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"Starting EcoLens API on http://localhost:{port}")
    uvicorn.run(app, host=host, port=port, reload=False)
