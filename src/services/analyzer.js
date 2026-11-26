/**
 * =========================================================================
 * TRUE CYCLE <-> ECOLENS FORENSIC MATERIAL ANALYZER INTEGRATION
 * =========================================================================
 * Connects the True Cycle frontend to the local EcoLens FastAPI Module
 * (module/server.py) powered by Groq LPU Vision & Gemini.
 *
 * Uses relative `/api/*` paths when served via Vite dev proxy (port 3000 -> 8000)
 * and falls back cleanly to `http://localhost:8000/api/*` in standalone builds.
 */

function getApiBaseUrl() {
  if (import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location) {
    // When running via Vite dev server (or reverse proxy), use relative /api
    if (window.location.port === '3000' || window.location.port === '5173') {
      return '/api';
    }
    // When served via backend on port 8000
    if (window.location.port === '8000') {
      return '/api';
    }
    // When running on any deployed production domain (Render, Railway, Fly, etc.), use relative /api
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return '/api';
    }
  }
  return 'http://localhost:8000/api';
}

function getAuthHeadersAndCredentials() {
  const groqKey = typeof localStorage !== 'undefined' ? (localStorage.getItem('GROQ_API_KEY') || '').trim() : '';
  const geminiKey = typeof localStorage !== 'undefined' ? (localStorage.getItem('GEMINI_API_KEY') || '').trim() : '';
  const activeProvider = typeof localStorage !== 'undefined' ? (localStorage.getItem('ACTIVE_PROVIDER') || '').trim() : '';

  const provider = activeProvider || (groqKey ? 'groq' : (geminiKey ? 'gemini' : undefined));
  const userApiKey = provider === 'gemini' ? (geminiKey || undefined) : (groqKey || undefined);

  const headers = { 'Content-Type': 'application/json' };
  if (groqKey) headers['x-groq-api-key'] = groqKey;
  if (geminiKey) headers['x-gemini-api-key'] = geminiKey;
  if (provider) headers['x-provider'] = provider;

  return { headers, userApiKey, provider };
}

async function fetchEcoLens(endpointPath, options = {}) {
  const primaryUrl = `${getApiBaseUrl()}${endpointPath}`;
  try {
    const res = await fetch(primaryUrl, options);
    return res;
  } catch (err) {
    // Fallback to direct localhost:8000 if relative proxy wasn't mounted
    if (primaryUrl.startsWith('/api')) {
      return await fetch(`http://localhost:8000/api${endpointPath}`, options);
    }
    throw err;
  }
}

/**
 * Helper to convert blob: URLs, data: URLs, or remote images to base64 data URI
 */
export async function getBase64FromSource(imageSource) {
  if (!imageSource) return { base64: '', mimeType: 'image/jpeg', dataUrl: '' };

  if (imageSource.startsWith('data:')) {
    const parts = imageSource.split(',');
    const mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    return { base64: parts[1] || '', mimeType, dataUrl: imageSource };
  }

  if (imageSource.startsWith('blob:') || imageSource.startsWith('http') || imageSource.startsWith('/')) {
    try {
      const res = await fetch(imageSource);
      const blob = await res.blob();
      const mimeType = blob.type || 'image/jpeg';
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const resStr = reader.result;
          const base64 = typeof resStr === 'string' ? (resStr.split(',')[1] || '') : '';
          resolve({ base64, mimeType, dataUrl: typeof resStr === 'string' ? resStr : '' });
        };
        reader.onerror = () => resolve({ base64: '', mimeType: 'image/jpeg', dataUrl: '' });
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn('[EcoLens Adapter] Could not read image source as base64:', e);
      return { base64: '', mimeType: 'image/jpeg', dataUrl: '' };
    }
  }

  return { base64: '', mimeType: 'image/jpeg', dataUrl: '' };
}

/**
 * Checks whether the EcoLens backend server is online.
 */
export async function checkModuleHealth() {
  const res = await fetchEcoLens('/health', { method: 'GET' });
  if (!res.ok) throw new Error(`EcoLens health check failed (HTTP ${res.status})`);
  return await res.json();
}

/**
 * Primary Analysis Function
 * Sends the captured/uploaded specimen image directly to EcoLens (`POST /api/analyze`)
 * and maps the genuine forensic output into the True Cycle interface schema.
 */
export async function analyzeProductImage(imageSource, itemName) {
  const { dataUrl } = await getBase64FromSource(imageSource);

  if (!dataUrl) {
    throw new Error('No readable image data available for forensic analysis.');
  }

  const { headers, userApiKey, provider } = getAuthHeadersAndCredentials();

  const payload = {
    image: dataUrl,
    ...(userApiKey ? { apiKey: userApiKey } : {}),
    ...(provider ? { provider } : {})
  };

  let response;
  try {
    response = await fetchEcoLens('/analyze', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
  } catch (networkErr) {
    throw new Error(
      'Could not connect to the EcoLens API server on port 8000. Make sure `python module/run.py` is running.'
    );
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || `EcoLens API returned HTTP ${response.status}`);
  }

  const ai = await response.json();

  // Map EcoLens compositions_table into True Cycle macro string & forensic layer tags
  const compositions = Array.isArray(ai.compositions_table) ? ai.compositions_table : [];
  const compositionSummary =
    compositions
      .map((c) => `${c.component}: ${c.material} (${c.estimated_percentage}%)`)
      .join(', ') ||
    ai.summary ||
    'Forensic composition analyzed via EcoLens Vision';

  const layers = compositions.map((c) => ({
    name: c.component,
    material: `${c.material}${c.estimated_percentage != null ? ` (${c.estimated_percentage}%)` : ''}`,
    recyclability: [c.recyclable, c.stream].filter(Boolean).join(' • '),
    notes: c.notes || ''
  }));

  // Determine whether specialized external drop-off / stewardship routing is needed
  const hasSpecializedStream = compositions.some((c) => {
    const status = `${c.recyclable || ''} ${c.stream || ''}`.toLowerCase();
    return (
      status.includes('specialized') ||
      status.includes('e-waste') ||
      status.includes('hazardous') ||
      status.includes('non-recyclable') ||
      status.includes('limited')
    );
  });

  const isExternalRequired =
    (ai.guardrail?.is_valid_physical_object !== false) &&
    ((Number(ai.recyclability_stars) || 0) < 3.5 || hasSpecializedStream);

  const recycleStars = Number(ai.recyclability_stars) || 3.0;
  const reduceStars = Number(ai.reducibility_stars) || 3.0;
  const reuseStars = Number(ai.reusability_stars) || 3.0;

  return {
    productName: ai.product_name || itemName || 'Identified Specimen',
    category: ai.product_category || 'Material Goods',
    summary: ai.summary || '',
    composition: compositionSummary,
    layers,

    // 1. Recyclability Star Rating (1.0 - 5.0)
    recycle: {
      score: Math.round(recycleStars),
      exactStars: recycleStars,
      label: 'Recycle',
      details: ai.recyclability_reasoning || ''
    },

    // 2. Reducibility Star Rating (1.0 - 5.0)
    reduce: {
      score: Math.round(reduceStars),
      exactStars: reduceStars,
      label: 'Reduce',
      details: ai.reducibility_reasoning || ''
    },

    // 3. Reusability Star Rating (1.0 - 5.0)
    reuse: {
      score: Math.round(reuseStars),
      exactStars: reuseStars,
      label: 'Reuse',
      details: ai.reusability_reasoning || ''
    },

    // Dedicated Boolean 1: Donation Worthy
    donate: Boolean(ai.is_donation_worthy),
    donateReason: ai.donation_rationale || '',

    // Dedicated Boolean 2: DIY Project Worthy
    isDiyWorthy: Boolean(ai.is_diy_worthy),
    diyReason: ai.diy_rationale || '',
    suggestedDiyIdeas: Array.isArray(ai.suggested_diy_ideas) ? ai.suggested_diy_ideas : [],

    // Conditional External Stewardship Portal Flag
    external: Boolean(isExternalRequired),
    externalTitle: 'Certified Recycling Locator',

    // Grounding & Model Metadata
    isLiveAi: true,
    isGrounded: true,
    activeModel: `${ai.provider ? ai.provider.toUpperCase() : 'GROQ'} • ${ai.model || 'qwen/qwen3.8-27b'}`,
    groundingQueries: ai.grounding?.search_queries || [],
    groundingSources: (ai.grounding?.sources || [])
      .map((s) => ({
        title: s.title || s.url,
        uri: s.url || s.uri || ''
      }))
      .filter((s) => s.uri),
    verifiedFacts: ai.grounding?.verified_facts || [],
    guardrail: ai.guardrail || {
      is_valid_physical_object: true,
      guardrail_status: 'PASSED',
      confidence_score: 0.95,
      guardrail_notes: null
    }
  };
}

/**
 * Secondary API Call: Donation Destinations
 * Called asynchronously in the background ONLY when `donate: true`.
 */
export async function fetchDonationDestinations(productName, category, donateReason) {
  const { headers, userApiKey } = getAuthHeadersAndCredentials();

  const res = await fetchEcoLens('/donations', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      productName,
      category,
      donateReason,
      ...(userApiKey ? { apiKey: userApiKey } : {})
    })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Donation routing failed (HTTP ${res.status})`);
  }

  return await res.json();
}

/**
 * Secondary API Call: External Certified Recycling Guide
 * Called asynchronously in the background ONLY when `external: true`.
 */
export async function fetchExternalPortalGuide(productName, category, externalTitle) {
  const { headers, userApiKey } = getAuthHeadersAndCredentials();

  const res = await fetchEcoLens('/external-guide', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      productName,
      category,
      externalTitle,
      ...(userApiKey ? { apiKey: userApiKey } : {})
    })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `External portal lookup failed (HTTP ${res.status})`);
  }

  return await res.json();
}

/**
 * Get current active engine configuration (Groq vs Gemini & masked keys)
 */
export async function getEngineConfig() {
  const res = await fetchEcoLens('/config', { method: 'GET' });
  if (!res.ok) throw new Error('Failed to fetch engine configuration.');
  return await res.json();
}

/**
 * Save & update active engine configuration and keys
 */
export async function updateEngineConfig(config) {
  const res = await fetchEcoLens('/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error('Failed to update engine configuration.');
  return await res.json();
}
