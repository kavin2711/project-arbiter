/**
 * =========================================================================
 * TRUE CYCLE FORENSIC MATERIAL ANALYZER ADAPTER
 * Connects TrueCycle to the EcoLens Groq LPU Vision API Module.
 * =========================================================================
 * 
 * Replaces hardcoded mock branching with real-time multimodal Groq Vision
 * analysis, avoiding Gemini 429 resource exhausted limits with sub-second speeds.
 */

const ECOLENS_API_URL =
  typeof window !== 'undefined' && window.location && window.location.port === '3000'
    ? '/api/analyze'
    : 'http://localhost:8000/api/analyze';

// Helper to convert blob: URLs, data: URLs, or remote images to base64
export async function getBase64FromSource(imageSource) {
  if (!imageSource) return { base64: '', mimeType: 'image/jpeg' };

  if (imageSource.startsWith('data:')) {
    const parts = imageSource.split(',');
    const mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    return { base64: parts[1] || '', mimeType, dataUrl: imageSource };
  }

  if (imageSource.startsWith('blob:') || imageSource.startsWith('http')) {
    try {
      const res = await fetch(imageSource);
      const blob = await res.blob();
      const mimeType = blob.type || 'image/jpeg';
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const resStr = reader.result;
          const base64 = typeof resStr === 'string' ? (resStr.split(',')[1] || '') : '';
          resolve({ base64, mimeType, dataUrl: resStr });
        };
        reader.onerror = () => resolve({ base64: '', mimeType: 'image/jpeg', dataUrl: '' });
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn('Could not read blob as base64:', e);
      return { base64: '', mimeType: 'image/jpeg', dataUrl: '' };
    }
  }

  return { base64: '', mimeType: 'image/jpeg', dataUrl: '' };
}

/**
 * Primary Analysis Function
 * Called when an image is captured or selected in the Input Station.
 * Sends image to the EcoLens Module API and returns genuine forensic data.
 */
export async function analyzeProductImage(imageSource, itemName) {
  const { dataUrl } = await getBase64FromSource(imageSource);

  if (!dataUrl) {
    throw new Error("No image data available for analysis.");
  }

  // Retrieve Groq or Gemini key from localStorage if explicitly saved by user;
  // otherwise omit provider so the backend uses its configured .env ACTIVE_PROVIDER (groq).
  const groqKey = typeof localStorage !== 'undefined' ? localStorage.getItem('GROQ_API_KEY') || '' : '';
  const geminiKey = typeof localStorage !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') || '' : '';
  const userApiKey = groqKey || geminiKey;
  const provider = groqKey ? 'groq' : (geminiKey ? 'gemini' : undefined);

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (groqKey) headers['x-groq-api-key'] = groqKey;
    else if (geminiKey) headers['x-gemini-api-key'] = geminiKey;

    const response = await fetch(ECOLENS_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        image: dataUrl,
        apiKey: userApiKey || undefined,
        provider: provider
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || `Server returned HTTP ${response.status}`);
    }

    const ai = await response.json();

    // Map the EcoLens forensic results into the exact schema TrueCycle components consume
    return {
      productName: ai.product_name || itemName || "Identified Product",
      category: ai.product_category || "Material Goods",
      summary: ai.summary,

      // Concise macro string for header cards
      composition: (ai.compositions_table || [])
        .map(c => `${c.component}: ${c.material} (${c.estimated_percentage}%)`)
        .join(', ') || "Forensic composition analyzed via Groq LPU Vision",

      // Itemized layer table matching TrueCycle UI
      layers: (ai.compositions_table || []).map(c => ({
        name: c.component,
        material: `${c.material} (${c.estimated_percentage}%)`,
        recyclability: `${c.recyclable} • ${c.stream}`
      })),

      // 1. Recyclability Star Rating (1-5 stars)
      recycle: {
        score: Math.round(ai.recyclability_stars || 3),
        exactStars: ai.recyclability_stars,
        label: "Recycle",
        details: ai.recyclability_reasoning
      },

      // 2. Reducibility Star Rating (1-5 stars)
      reduce: {
        score: Math.round(ai.reducibility_stars || 3),
        exactStars: ai.reducibility_stars,
        label: "Reduce",
        details: ai.reducibility_reasoning
      },

      // 3. Reusability Star Rating (1-5 stars)
      reuse: {
        score: Math.round(ai.reusability_stars || 3),
        exactStars: ai.reusability_stars,
        label: "Reuse",
        details: ai.reusability_reasoning
      },

      // Dedicated Boolean: Donation Worthy (Food, Clothing, Belts, Shoes, Usable Goods)
      donate: Boolean(ai.is_donation_worthy),
      donateReason: ai.donation_rationale,

      // Dedicated Boolean: DIY Project Worthy (Upcycling & Maker crafts)
      isDiyWorthy: Boolean(ai.is_diy_worthy),
      diyReason: ai.diy_rationale,
      suggestedDiyIdeas: ai.suggested_diy_ideas || [],

      // External certified directory flag
      external: (ai.recyclability_stars || 0) < 3.5,
      externalTitle: "Certified Materials & Stewardship Locator",

      // Live Grounding Verification Badges
      isLiveAi: true,
      isGrounded: true,
      activeModel: `${ai.provider ? ai.provider.toUpperCase() : 'GROQ'}: ${ai.model || 'qwen/qwen3.8-27b'}`,
      groundingQueries: ai.grounding?.search_queries || ["product material recycling verification"],
      groundingSources: (ai.grounding?.sources || []).map(s => ({
        title: s.title,
        uri: s.url
      })),
      guardrail: ai.guardrail
    };
  } catch (err) {
    console.error("[TrueCycle Adapter] Failed to call live EcoLens API:", err);
    throw err;
  }
}
