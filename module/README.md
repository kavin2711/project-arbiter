# ⚡ EcoLens: Forensic Product Material & Lifecycle API Module

A high-performance multimodal AI microservice and embeddable module that analyzes physical product images and returns:
1. **Recyclability Rating (1.0 to 5.0 stars)** centered on material recovery viability.
2. **Reusability Rating (1.0 to 5.0 stars)** centered on durability, lifecycle cycles, and washability.
3. **Reducibility Rating (1.0 to 5.0 stars)** centered on packaging necessity and zero-waste alternatives.
4. **Forensic Compositions Table**: itemized breakdown of components, exact polymer/alloy specifications (e.g. PET #1, HDPE #2, ABS, Cotton, Aluminum), mass share percentages, recyclability tiers, and disposal streams.
5. **Two Dedicated Boolean Values**:
   - `is_donation_worthy`: **true** for unspoiled food, clean wearable clothing, belts, accessories, or working goods accepted by charities and food banks.
   - `is_diy_worthy`: **true** for items or components that can safely and practically be upcycled into DIY or maker projects.
6. **Multi-Provider Engine**:
   - ⚡ **Groq LPU Vision (Default & Recommended)**: Powered by `llama-3.2-11b-vision-preview` on Groq's LPUs. Blazing-fast sub-second token generation, high rate limits, and prevents Gemini 429 `RESOURCE_EXHAUSTED` quota errors.
   - 🌐 **Google Gemini (Alternative)**: Powered by `gemini-3.8-flash` with Google Search Grounding SDK.
7. **Strict Multi-Stage Guardrails**: image format validation, non-object rejection, numeric 1.0–5.0 clamping, and schema verification.
8. **Zero Mock or Sample Values**: 100% live inference grounded in real scientific and municipal data.

---

## 🚀 Quick Start

### 1. Requirements & Setup
The required SDKs are pre-installed in your environment:
```bash
python -m pip install -r requirements.txt
```

### 2. Configure Your Groq API Key
1. Get a free Groq API key instantly at **[https://console.groq.com/keys](https://console.groq.com/keys)** (starts with `gsk_`).
2. You can set it in any of three ways:
   - In `module/.env`:
     ```bash
     GROQ_API_KEY=gsk_your_key_here
     ACTIVE_PROVIDER=groq
     ```
   - In the web interface at `http://localhost:8000`: Click **"Configure Key"**, paste your `gsk_...` key, and click Save.
   - Or pass it in the request header (`x-groq-api-key: gsk_...`) or JSON body (`"apiKey": "gsk_..."`).

### 3. Launch the Server & Testing UI
```bash
python run.py
```
Or double-click `start.bat`.

- **Web Camera & Test Interface**: [http://localhost:8000](http://localhost:8000)
- **API Endpoint**: [http://localhost:8000/api/analyze](http://localhost:8000/api/analyze)
- **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 📡 API Specification (`POST /api/analyze`)

#### Request:
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "provider": "groq",
  "apiKey": "gsk_..."
}
```

#### Response (`200 OK`):
```json
{
  "product_name": "PET Plastic Soft Drink Bottle with Cap",
  "product_category": "Rigid Beverage Packaging",
  "summary": "Forensic breakdown indicates a virgin PET body with HDPE closure and BOPP label.",
  "recyclability_stars": 4.5,
  "recyclability_reasoning": "Body is made of clean, unpigmented PET (#1) which has widespread municipal curb collection and high mechanical remelt value.",
  "reusability_stars": 2.0,
  "reusability_reasoning": "Thin bottle walls are prone to micro-creasing and bacterial harboring under repetitive washing, though suitable for limited water refills.",
  "reducibility_stars": 4.8,
  "reducibility_reasoning": "High environmental reduction priority. Single-use beverage bottles are readily substitutable with reusable stainless steel tumblers or fountain refills.",
  "compositions_table": [
    {
      "component": "Bottle Body",
      "material": "Polyethylene Terephthalate (PET #1)",
      "estimated_percentage": 86.0,
      "recyclable": "Widely Recyclable",
      "stream": "Curbside Blue Bin (keep cap screwed on)",
      "notes": "Food contact grade resin. Empty and rinse before disposal."
    },
    {
      "component": "Closure Cap & Ring",
      "material": "High-Density Polyethylene (HDPE #2)",
      "estimated_percentage": 10.0,
      "recyclable": "Widely Recyclable",
      "stream": "Curbside Blue Bin",
      "notes": "Floats during MRF sink-float separation; easily isolated from PET."
    }
  ],
  "is_donation_worthy": false,
  "donation_rationale": "Empty disposable beverage container; food banks and shelters only accept sealed, unexpired contents rather than empty packaging.",
  "is_diy_worthy": true,
  "diy_rationale": "Non-toxic, transparent, and water-tight polymer. Ideal for indoor botanical rooting or seed-starter sub-irrigation.",
  "suggested_diy_ideas": [
    "Sub-irrigated self-watering herb planter",
    "Bird feeder with wooden perches inserted through punctures"
  ],
  "guardrail": {
    "is_valid_physical_object": true,
    "guardrail_status": "PASSED",
    "confidence_score": 0.98,
    "guardrail_notes": null
  },
  "grounding": {
    "search_queries": [
      "PET bottle recycling curbside acceptance standards 2026",
      "HDPE cap on bottle recycling guidelines Association of Plastic Recyclers"
    ],
    "sources": [
      {
        "title": "Association of Plastic Recyclers (APR) Design Guide",
        "url": "https://plasticsrecycling.org/"
      },
      {
        "title": "EPA National Recycling Strategy Guidelines",
        "url": "https://www.epa.gov/recyclingstrategy"
      }
    ],
    "verified_facts": [
      "Keep caps attached to PET bottles to ensure caps are captured during recycling."
    ]
  },
  "provider": "groq",
  "model": "llama-3.2-11b-vision-preview"
}
```
