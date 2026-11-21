/**
 * EcoLens Client SDK
 * Embeddable module for connecting any web application to the EcoLens Forensic AI API.
 * Supports both Groq LPU Vision (Default - no 429 quota exhaustion) and Google Gemini.
 */

export class EcoLensClient {
  /**
   * @param {Object} config
   * @param {string} [config.apiUrl="http://localhost:8000"] - Base URL of the EcoLens server
   * @param {string} [config.apiKey] - Optional Groq or Gemini API key
   * @param {string} [config.provider="groq"] - 'groq' (default) or 'gemini'
   */
  constructor(config = {}) {
    this.apiUrl = (config.apiUrl || "http://localhost:8000").replace(/\/$/, "");
    this.apiKey = config.apiKey || "";
    this.provider = config.provider || "groq";
  }

  setApiKey(key) {
    this.apiKey = key;
    if (key.startsWith("gsk_")) this.provider = "groq";
    else if (key.startsWith("AIza")) this.provider = "gemini";
  }

  setProvider(provider) {
    this.provider = provider;
  }

  async checkHealth() {
    try {
      const res = await fetch(`${this.apiUrl}/api/health`);
      if (!res.ok) throw new Error(`Health check failed with status ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error("[EcoLens] Health check failed:", err);
      throw err;
    }
  }

  async toBase64(source) {
    if (!source) throw new Error("No image source provided.");

    if (typeof source === "string") {
      if (source.startsWith("data:")) {
        const parts = source.split(",");
        const mimeType = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
        return { base64: parts[1] || "", mimeType, dataUrl: source };
      }
      return { base64: source, mimeType: "image/jpeg", dataUrl: `data:image/jpeg;base64,${source}` };
    }

    if (source instanceof HTMLCanvasElement) {
      const dataUrl = source.toDataURL("image/jpeg", 0.92);
      const base64 = dataUrl.split(",")[1];
      return { base64, mimeType: "image/jpeg", dataUrl };
    }

    if (source instanceof Blob || source instanceof File) {
      const mimeType = source.type || "image/jpeg";
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result;
          const base64 = typeof res === "string" ? res.split(",")[1] : "";
          resolve({ base64, mimeType, dataUrl: res });
        };
        reader.onerror = reject;
        reader.readAsDataURL(source);
      });
    }

    throw new Error("Unsupported image source type.");
  }

  async analyze(imageSource, options = {}) {
    const { dataUrl } = await this.toBase64(imageSource);
    const key = options.apiKey || this.apiKey;
    const provider = options.provider || this.provider || "groq";

    const payload = {
      image: dataUrl,
      apiKey: key || undefined,
      provider: provider
    };

    const headers = { "Content-Type": "application/json" };
    if (key) {
      if (key.startsWith("gsk_") || provider === "groq") headers["x-groq-api-key"] = key;
      else headers["x-gemini-api-key"] = key;
    }

    const response = await fetch(`${this.apiUrl}/api/analyze`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorDetails = `HTTP ${response.status}`;
      try {
        const errorJson = await response.json();
        errorDetails = errorJson.detail || JSON.stringify(errorJson);
      } catch (e) {
        errorDetails = await response.text();
      }
      throw new Error(`EcoLens API Error: ${errorDetails}`);
    }

    return await response.json();
  }

  static renderStarsHTML(score) {
    const clamped = Math.max(1, Math.min(5, Number(score) || 1));
    let html = `<div class="ecolens-stars" style="display:inline-flex;align-items:center;gap:3px;color:#f59e0b;font-size:1.1rem;">`;
    for (let i = 1; i <= 5; i++) {
      if (clamped >= i) {
        html += `<span title="${clamped} stars">★</span>`;
      } else if (clamped >= i - 0.5) {
        html += `<span title="${clamped} stars">⯨</span>`;
      } else {
        html += `<span style="color:#d1d5db;" title="${clamped} stars">☆</span>`;
      }
    }
    html += ` <strong style="color:#111827;margin-left:4px;font-size:0.95rem;">${clamped.toFixed(1)}/5.0</strong></div>`;
    return html;
  }
}

if (typeof window !== "undefined") {
  window.EcoLensClient = EcoLensClient;
}
