"""
Launcher script for EcoLens Forensic API Server & Test Interface.
"""

import os
import sys
import uvicorn

MODULE_DIR = os.path.dirname(os.path.abspath(__file__))
if MODULE_DIR not in sys.path:
    sys.path.insert(0, MODULE_DIR)

from engine import load_env_file
from server import app

if __name__ == "__main__":
    load_env_file()
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")

    print("\n" + "=" * 65)
    print("  ECOLENS: FORENSIC MATERIAL & LIFECYCLE API SERVER")
    print("  Powered by Groq LPU Vision & Google Gemini")
    print("=" * 65)
    print(f"  • Web UI & Camera Station: http://localhost:{port}")
    print(f"  • API Endpoint:            http://localhost:{port}/api/analyze")
    print(f"  • OpenAPI Documentation:   http://localhost:{port}/docs")
    print(f"  • Health Check:            http://localhost:{port}/api/health")
    print("=" * 65 + "\n")

    uvicorn.run(app, host=host, port=port, reload=False)
