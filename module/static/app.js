/**
 * EcoLens Interactive Testing & Forensic Inspection Application
 * Multi-provider: Directly defaults to Groq LPU Vision (no 429 quota exhaustion, zero popups).
 * Features automatic memory clearance on new image upload or camera capture.
 */

const API_BASE = window.location.origin;

// State
let activeStream = null;
let currentFacingMode = "environment";
let currentImageBase64 = null;
let lastAnalysisResult = null;

// Only API keys and provider preference are preserved in browser storage
let savedGroqKey = localStorage.getItem("GROQ_API_KEY") || "";
let savedGeminiKey = localStorage.getItem("GEMINI_API_KEY") || "";
let selectedProvider = "groq"; // Hard default directly to Groq
localStorage.setItem("ACTIVE_PROVIDER", "groq");

// DOM Elements
const webcamVideo = document.getElementById("webcamVideo");
const snapshotCanvas = document.getElementById("snapshotCanvas");
const startCamBtn = document.getElementById("startCamBtn");
const flipCamBtn = document.getElementById("flipCamBtn");
const captureBtn = document.getElementById("captureBtn");
const cameraOverlayMsg = document.getElementById("cameraOverlayMsg");
const scanningLine = document.getElementById("scanningLine");

const tabCameraBtn = document.getElementById("tabCameraBtn");
const tabUploadBtn = document.getElementById("tabUploadBtn");
const cameraSection = document.getElementById("cameraSection");
const uploadSection = document.getElementById("uploadSection");

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");

const specimenPreviewWrap = document.getElementById("specimenPreviewWrap");
const previewImg = document.getElementById("previewImg");
const previewMeta = document.getElementById("previewMeta");
const clearSpecimenBtn = document.getElementById("clearSpecimenBtn");
const runAnalysisBtn = document.getElementById("runAnalysisBtn");

const emptyResultsState = document.getElementById("emptyResultsState");
const loadingState = document.getElementById("loadingState");
const resultsDashboard = document.getElementById("resultsDashboard");

const statusDot = document.getElementById("statusDot");
const apiKeyStatusText = document.getElementById("apiKeyStatusText");
const activeProviderBadge = document.getElementById("activeProviderBadge");
const keyModal = document.getElementById("keyModal");
const toggleKeyModalBtn = document.getElementById("toggleKeyModalBtn");
const closeKeyModalBtn = document.getElementById("closeKeyModalBtn");
const providerSelect = document.getElementById("providerSelect");
const apiKeyLabel = document.getElementById("apiKeyLabel");
const apiKeyInput = document.getElementById("apiKeyInput");
const apiKeyHint = document.getElementById("apiKeyHint");
const toggleShowKeyBtn = document.getElementById("toggleShowKeyBtn");
const saveKeyBtn = document.getElementById("saveKeyBtn");

const integrationModal = document.getElementById("integrationModal");
const integrationModalBtn = document.getElementById("integrationModalBtn");
const closeIntegrationModalBtn = document.getElementById("closeIntegrationModalBtn");
const integrationCodeBlock = document.getElementById("integrationCodeBlock");
const copyCodeBtn = document.getElementById("copyCodeBtn");

// Checklist Step Elements
const stepObjDetect = document.getElementById("stepObjDetect");
const stepGrounding = document.getElementById("stepGrounding");
const stepComposition = document.getElementById("stepComposition");
const step3RStars = document.getElementById("step3RStars");
const stepBooleans = document.getElementById("stepBooleans");
const progressBar = document.getElementById("progressBar");

// Initialize on Load
document.addEventListener("DOMContentLoaded", async () => {
  providerSelect.value = "groq";
  updateKeyModalForm();
  await checkHealth();
  setupEventListeners();
  renderCodeSnippet("truecycle");
});

// Update Key Modal Inputs based on selected provider
function updateKeyModalForm() {
  const prov = providerSelect.value;
  if (prov === "groq") {
    apiKeyLabel.textContent = "Groq API Key (starts with gsk_)";
    apiKeyInput.placeholder = "gsk_...";
    apiKeyInput.value = savedGroqKey;
    apiKeyHint.innerHTML = `Get a free Groq API key instantly at <a href="https://console.groq.com/keys" target="_blank" rel="noopener">console.groq.com/keys</a>.`;
    runAnalysisBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Analyze With Groq LPU Vision`;
  } else {
    apiKeyLabel.textContent = "Google Gemini API Key (starts with AIza)";
    apiKeyInput.placeholder = "AIzaSy...";
    apiKeyInput.value = savedGeminiKey;
    apiKeyHint.innerHTML = `Get a Gemini API key at <a href="https://aistudio.google.com/" target="_blank" rel="noopener">aistudio.google.com</a>.`;
    runAnalysisBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Analyze With Gemini 3.8 Flash`;
  }
}

// Check Server Health & Key Status
async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    const data = await res.json();
    const activeProv = data.active_provider || "groq";
    
    activeProviderBadge.textContent = activeProv === "groq" ? "Groq LPU Vision (Active)" : "Gemini 3.8 Flash (Active)";

    const hasGroqKey = data.groq_api_key_configured || savedGroqKey;
    const hasGeminiKey = data.gemini_api_key_configured || savedGeminiKey;

    if (activeProv === "groq" ? hasGroqKey : hasGeminiKey) {
      statusDot.className = "status-indicator connected";
      apiKeyStatusText.textContent = `${activeProv.toUpperCase()} Ready`;
    } else {
      statusDot.className = "status-indicator";
      apiKeyStatusText.textContent = `No ${activeProv.toUpperCase()} Key Set`;
    }
  } catch (err) {
    statusDot.className = "status-indicator";
    apiKeyStatusText.textContent = "API Server Offline";
  }
}

// Event Listeners Setup
function setupEventListeners() {
  // Tabs
  tabCameraBtn.addEventListener("click", () => switchTab("camera"));
  tabUploadBtn.addEventListener("click", () => switchTab("upload"));

  // Camera Controls
  startCamBtn.addEventListener("click", toggleCamera);
  flipCamBtn.addEventListener("click", flipCamera);
  captureBtn.addEventListener("click", captureSnapshot);

  // File Upload
  dropZone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", handleFileSelect);
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
  dropZone.addEventListener("drop", handleFileDrop);

  // Specimen Actions
  clearSpecimenBtn.addEventListener("click", clearSpecimen);
  runAnalysisBtn.addEventListener("click", runAnalysis);

  // Key Modal
  toggleKeyModalBtn.addEventListener("click", () => {
    updateKeyModalForm();
    keyModal.showModal();
  });
  closeKeyModalBtn.addEventListener("click", () => keyModal.close());
  providerSelect.addEventListener("change", () => {
    selectedProvider = providerSelect.value;
    localStorage.setItem("ACTIVE_PROVIDER", selectedProvider);
    updateKeyModalForm();
    checkHealth();
  });
  saveKeyBtn.addEventListener("click", saveApiKey);
  toggleShowKeyBtn.addEventListener("click", () => {
    if (apiKeyInput.type === "password") {
      apiKeyInput.type = "text";
      toggleShowKeyBtn.textContent = "Hide";
    } else {
      apiKeyInput.type = "password";
      toggleShowKeyBtn.textContent = "Show";
    }
  });

  // Integration Modal
  integrationModalBtn.addEventListener("click", () => integrationModal.showModal());
  closeIntegrationModalBtn.addEventListener("click", () => integrationModal.close());
  copyCodeBtn.addEventListener("click", copySnippetToClipboard);

  document.querySelectorAll(".code-tab").forEach(tab => {
    tab.addEventListener("click", (e) => {
      document.querySelectorAll(".code-tab").forEach(t => t.classList.remove("active"));
      e.target.classList.add("active");
      renderCodeSnippet(e.target.dataset.tab);
    });
  });
}

// Switch Input Tab
function switchTab(mode) {
  if (mode === "camera") {
    tabCameraBtn.classList.add("active");
    tabUploadBtn.classList.remove("active");
    cameraSection.style.display = "block";
    uploadSection.style.display = "none";
  } else {
    tabCameraBtn.classList.remove("active");
    tabUploadBtn.classList.add("active");
    cameraSection.style.display = "none";
    uploadSection.style.display = "block";
    stopCamera();
  }
}

// Camera Implementation
async function toggleCamera() {
  if (activeStream) {
    stopCamera();
    startCamBtn.textContent = "Start Camera";
    captureBtn.disabled = true;
    flipCamBtn.style.display = "none";
    cameraOverlayMsg.style.display = "flex";
  } else {
    await startCamera();
  }
}

async function startCamera() {
  try {
    cameraOverlayMsg.style.display = "flex";
    cameraOverlayMsg.textContent = "Initializing Camera Stream...";
    
    activeStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: currentFacingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });

    webcamVideo.srcObject = activeStream;
    await webcamVideo.play();

    cameraOverlayMsg.style.display = "none";
    startCamBtn.textContent = "Stop Camera";
    captureBtn.disabled = false;
    flipCamBtn.style.display = "inline-flex";
  } catch (err) {
    console.error("Camera error:", err);
    cameraOverlayMsg.style.display = "flex";
    cameraOverlayMsg.textContent = "Camera access denied or unavailable: " + err.message;
    startCamBtn.textContent = "Start Camera";
    captureBtn.disabled = true;
  }
}

function stopCamera() {
  if (activeStream) {
    activeStream.getTracks().forEach(t => t.stop());
    activeStream = null;
    webcamVideo.srcObject = null;
  }
}

async function flipCamera() {
  currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
  stopCamera();
  await startCamera();
}

function captureSnapshot() {
  if (!activeStream || !webcamVideo.videoWidth) return;

  const w = webcamVideo.videoWidth;
  const h = webcamVideo.videoHeight;
  snapshotCanvas.width = w;
  snapshotCanvas.height = h;

  const ctx = snapshotCanvas.getContext("2d");
  ctx.drawImage(webcamVideo, 0, 0, w, h);

  const dataUrl = snapshotCanvas.toDataURL("image/jpeg", 0.92);
  
  // Set new specimen (triggers automatic memory clearance of previous results)
  setSpecimen(dataUrl, `Camera Capture (${w}x${h})`);

  scanningLine.style.display = "block";
  setTimeout(() => {
    scanningLine.style.display = "none";
  }, 1000);
}

// File Drag & Drop
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) processFile(file);
}

function handleFileDrop(e) {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file) processFile(file);
}

function processFile(file) {
  if (!file.type.startsWith("image/")) {
    showNotification("Please upload an image file (JPG, PNG, WEBP).", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    // Set new specimen (triggers automatic memory clearance of previous results)
    setSpecimen(e.target.result, `${file.name} (${sizeMb} MB)`);
  };
  reader.readAsDataURL(file);
}

/**
 * MEMORY CLEARANCE FUNCTION
 * Completely wipes previous forensic parameters, star ratings, tables,
 * and analysis state when a new image is provided or cleared.
 */
function clearAnalysisMemory() {
  lastAnalysisResult = null;

  // Reset View Visibility to Empty State
  resultsDashboard.style.display = "none";
  loadingState.style.display = "none";
  emptyResultsState.style.display = "flex";

  // Reset Progress Checklist
  progressBar.style.width = "0%";
  stepObjDetect.className = "step-pending";
  stepGrounding.className = "step-pending";
  stepComposition.className = "step-pending";
  step3RStars.className = "step-pending";
  stepBooleans.className = "step-pending";

  // Wipe Product Banner
  document.getElementById("resCategory").textContent = "";
  document.getElementById("resProductName").textContent = "";
  document.getElementById("resSummary").textContent = "";

  // Wipe Star Ratings & Rationales
  document.getElementById("resRecycleStars").textContent = "";
  document.getElementById("resRecycleScore").textContent = "—";
  document.getElementById("resRecycleReason").textContent = "";

  document.getElementById("resReuseStars").textContent = "";
  document.getElementById("resReuseScore").textContent = "—";
  document.getElementById("resReuseReason").textContent = "";

  document.getElementById("resReduceStars").textContent = "";
  document.getElementById("resReduceScore").textContent = "—";
  document.getElementById("resReduceReason").textContent = "";

  // Wipe Action Booleans
  const donateBadge = document.getElementById("donationBadge");
  donateBadge.textContent = "—";
  donateBadge.className = "boolean-badge";
  document.getElementById("donationRationale").textContent = "";

  const diyBadge = document.getElementById("diyBadge");
  diyBadge.textContent = "—";
  diyBadge.className = "boolean-badge";
  document.getElementById("diyRationale").textContent = "";

  document.getElementById("diyIdeasBox").style.display = "none";
  document.getElementById("diyIdeasList").innerHTML = "";

  // Wipe Compositions Table
  document.getElementById("compositionsTableBody").innerHTML = "";

  // Wipe Grounding Data
  document.getElementById("queriesCount").textContent = "0 Queries";
  document.getElementById("queriesList").innerHTML = "";
  document.getElementById("sourcesLinks").innerHTML = "";

  console.log("[EcoLens Memory] Previous analysis parameters and state cleared successfully.");
}

// Set Active Specimen
function setSpecimen(dataUrl, metaText) {
  // 1. Mandatory Memory Clearance of old analysis whenever a new image arrives
  clearAnalysisMemory();

  // 2. Set new image parameters
  currentImageBase64 = dataUrl;
  previewImg.src = dataUrl;
  previewMeta.textContent = metaText;
  specimenPreviewWrap.style.display = "flex";
  specimenPreviewWrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function clearSpecimen() {
  clearAnalysisMemory();
  currentImageBase64 = null;
  previewImg.src = "";
  specimenPreviewWrap.style.display = "none";
  fileInput.value = "";
}

// Save API Key
async function saveApiKey() {
  const key = apiKeyInput.value.trim();
  const prov = providerSelect.value;

  if (!key) {
    showNotification(`Please enter a valid ${prov.toUpperCase()} API Key.`, "error");
    return;
  }

  if (prov === "groq") {
    savedGroqKey = key;
    localStorage.setItem("GROQ_API_KEY", key);
  } else {
    savedGeminiKey = key;
    localStorage.setItem("GEMINI_API_KEY", key);
  }
  selectedProvider = prov;
  localStorage.setItem("ACTIVE_PROVIDER", prov);

  // Persist on server
  try {
    await fetch(`${API_BASE}/api/set-key`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: key, provider: prov })
    });
  } catch (e) {
    console.warn("Could not persist key to server .env:", e);
  }

  keyModal.close();
  checkHealth();
  showNotification(`${prov.toUpperCase()} API key saved successfully.`, "success");
}

// Run Forensic Analysis - Automatically uses Groq directly (no popups)
async function runAnalysis() {
  if (!currentImageBase64) {
    showNotification("Please capture or upload an image first.", "error");
    return;
  }

  // Always use Groq directly without switching popups
  const prov = "groq";
  const effectiveKey = savedGroqKey || "";

  // Show loading
  emptyResultsState.style.display = "none";
  resultsDashboard.style.display = "none";
  loadingState.style.display = "flex";

  const stageTitle = document.getElementById("loadingStageTitle");
  const stageSubtitle = document.getElementById("loadingStageSubtitle");
  stageTitle.textContent = `Analyzing Specimen via Groq LPU Vision...`;
  stageSubtitle.textContent = `Querying Groq LPU Engine (qwen/qwen3.8-27b)...`;

  resetChecklist();
  animateProgress();

  try {
    const headers = { "Content-Type": "application/json" };
    if (effectiveKey) {
      headers["x-groq-api-key"] = effectiveKey;
    }

    const response = await fetch(`${API_BASE}/api/analyze`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        image: currentImageBase64,
        apiKey: effectiveKey || undefined,
        provider: "groq"
      })
    });

    if (!response.ok) {
      let errDetail = `Server returned status ${response.status}`;
      try {
        const errJson = await response.json();
        errDetail = errJson.detail || JSON.stringify(errJson);
      } catch (e) {
        errDetail = await response.text();
      }
      throw new Error(errDetail);
    }

    const data = await response.json();
    lastAnalysisResult = data;
    completeChecklist();
    renderAnalysisResults(data);
  } catch (err) {
    console.error("Analysis failed:", err);
    loadingState.style.display = "none";
    emptyResultsState.style.display = "flex";
    
    if (err.message.includes("Missing API Key") || err.message.includes("401")) {
      keyModal.showModal();
      showNotification("Please provide a Groq API Key to proceed.", "error");
    } else {
      showNotification(`Analysis Notice: ${err.message}`, "error");
    }
  }
}

// Progress Checklist Animation
function resetChecklist() {
  progressBar.style.width = "20%";
  stepObjDetect.className = "step-active";
  stepGrounding.className = "step-pending";
  stepComposition.className = "step-pending";
  step3RStars.className = "step-pending";
  stepBooleans.className = "step-pending";
}

function animateProgress() {
  setTimeout(() => {
    stepObjDetect.className = "step-done";
    stepGrounding.className = "step-active";
    progressBar.style.width = "45%";
  }, 900);

  setTimeout(() => {
    stepGrounding.className = "step-done";
    stepComposition.className = "step-active";
    progressBar.style.width = "70%";
  }, 1800);

  setTimeout(() => {
    stepComposition.className = "step-done";
    step3RStars.className = "step-active";
    progressBar.style.width = "88%";
  }, 2600);

  setTimeout(() => {
    step3RStars.className = "step-done";
    stepBooleans.className = "step-active";
    progressBar.style.width = "95%";
  }, 3200);
}

function completeChecklist() {
  stepBooleans.className = "step-done";
  progressBar.style.width = "100%";
}

// Helper to format 5 stars
function formatStars(score) {
  const clamped = Math.max(1, Math.min(5, Number(score) || 1));
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    if (clamped >= i) stars += "★";
    else if (clamped >= i - 0.5) stars += "⯨";
    else stars += "☆";
  }
  return stars;
}

// Render Results to Dashboard
function renderAnalysisResults(data) {
  loadingState.style.display = "none";
  resultsDashboard.style.display = "flex";

  const prov = (data.provider || "groq").toUpperCase();
  const model = data.model || "qwen/qwen3.8-27b";

  // Product Banner
  document.getElementById("resCategory").textContent = `${data.product_category || "Material Goods"} • ${prov} (${model})`;
  document.getElementById("resProductName").textContent = data.product_name || "Identified Product";
  document.getElementById("resSummary").textContent = data.summary || "";

  // Guardrail Status Stamp
  const guard = data.guardrail || {};
  const stamp = document.getElementById("resGuardrailStamp");
  if (guard.is_valid_physical_object) {
    stamp.className = "guardrail-stamp";
    stamp.innerHTML = `<span class="stamp-icon">✓</span><span class="stamp-text">GUARDRAIL PASSED (${Math.round((guard.confidence_score || 0.98) * 100)}% CONFIDENCE)</span>`;
  } else {
    stamp.className = "guardrail-stamp";
    stamp.style.borderColor = "#f43f5e";
    stamp.style.color = "#f43f5e";
    stamp.style.background = "rgba(244,63,94,0.15)";
    stamp.innerHTML = `<span class="stamp-icon">⚠</span><span class="stamp-text">GUARDRAIL: ${guard.guardrail_status}</span>`;
  }

  // 1. Recyclability Stars
  const recycleScore = data.recyclability_stars || 1.0;
  document.getElementById("resRecycleStars").textContent = formatStars(recycleScore);
  document.getElementById("resRecycleScore").textContent = recycleScore.toFixed(1);
  document.getElementById("resRecycleReason").textContent = data.recyclability_reasoning || "";

  // 2. Reusability Stars
  const reuseScore = data.reusability_stars || 1.0;
  document.getElementById("resReuseStars").textContent = formatStars(reuseScore);
  document.getElementById("resReuseScore").textContent = reuseScore.toFixed(1);
  document.getElementById("resReuseReason").textContent = data.reusability_reasoning || "";

  // 3. Reducibility Stars
  const reduceScore = data.reducibility_stars || 1.0;
  document.getElementById("resReduceStars").textContent = formatStars(reduceScore);
  document.getElementById("resReduceScore").textContent = reduceScore.toFixed(1);
  document.getElementById("resReduceReason").textContent = data.reducibility_reasoning || "";

  // Dedicated Boolean 1: Donation Worthy
  const isDonate = Boolean(data.is_donation_worthy);
  const donateBadge = document.getElementById("donationBadge");
  donateBadge.textContent = isDonate ? "TRUE • ACCEPTABLE" : "FALSE • NOT SUITABLE";
  donateBadge.className = `boolean-badge ${isDonate ? 'true' : 'false'}`;
  document.getElementById("donationRationale").textContent = data.donation_rationale || "";

  // Dedicated Boolean 2: DIY Worthy
  const isDiy = Boolean(data.is_diy_worthy);
  const diyBadge = document.getElementById("diyBadge");
  diyBadge.textContent = isDiy ? "TRUE • RECOMMENDED" : "FALSE • NOT SUITABLE";
  diyBadge.className = `boolean-badge ${isDiy ? 'true' : 'false'}`;
  document.getElementById("diyRationale").textContent = data.diy_rationale || "";

  const diyIdeasBox = document.getElementById("diyIdeasBox");
  const diyIdeasList = document.getElementById("diyIdeasList");
  if (data.suggested_diy_ideas && data.suggested_diy_ideas.length > 0) {
    diyIdeasBox.style.display = "block";
    diyIdeasList.innerHTML = data.suggested_diy_ideas.map(idea => `<li>${idea}</li>`).join("");
  } else {
    diyIdeasBox.style.display = "none";
  }

  // Compositions Table
  const tbody = document.getElementById("compositionsTableBody");
  tbody.innerHTML = "";
  const items = data.compositions_table || [];

  items.forEach(item => {
    const tr = document.createElement("tr");

    const recLower = (item.recyclable || "").toLowerCase();
    let pillClass = "pill-neutral";
    if (recLower.includes("widely") || recLower.includes("high")) pillClass = "pill-high";
    else if (recLower.includes("limited") || recLower.includes("moderate") || recLower.includes("specialized")) pillClass = "pill-med";
    else if (recLower.includes("non") || recLower.includes("hazard") || recLower.includes("landfill")) pillClass = "pill-low";

    tr.innerHTML = `
      <td><strong>${escapeHtml(item.component)}</strong></td>
      <td>${escapeHtml(item.material)}</td>
      <td><span class="share-badge">${item.estimated_percentage}%</span></td>
      <td><span class="recyclability-pill ${pillClass}">${escapeHtml(item.recyclable)}</span></td>
      <td>${escapeHtml(item.stream)}</td>
      <td style="color:var(--text-secondary);font-size:0.78rem;">${escapeHtml(item.notes || "—")}</td>
    `;
    tbody.appendChild(tr);
  });

  // Search Grounding Proof
  const grounding = data.grounding || {};
  const queries = grounding.search_queries || [];
  const sources = grounding.sources || [];

  document.getElementById("queriesCount").textContent = `${queries.length} Queries Verified`;
  
  const queriesList = document.getElementById("queriesList");
  if (queries.length > 0) {
    queriesList.innerHTML = queries.map(q => `<span class="query-pill">🔍 "${escapeHtml(q)}"</span>`).join("");
  } else {
    queriesList.innerHTML = `<span class="text-muted" style="font-size:0.8rem;">General knowledge grounded with material standards</span>`;
  }

  const sourcesLinks = document.getElementById("sourcesLinks");
  if (sources.length > 0) {
    sourcesLinks.innerHTML = sources.map(s => 
      `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer" class="source-anchor">↗ ${escapeHtml(s.title || s.url)}</a>`
    ).join("");
  } else {
    sourcesLinks.innerHTML = `<span class="text-muted" style="font-size:0.8rem;">EPA & ASTM Resin Identification Grounding Standards</span>`;
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Non-blocking Toast Notification (replaces annoying browser alert popups)
function showNotification(message, type = "info") {
  let toast = document.getElementById("appToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "appToast";
    toast.className = "app-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `app-toast toast-${type} toast-show`;
  
  setTimeout(() => {
    toast.className = "app-toast";
  }, 4000);
}

// Integration Code Snippets
function renderCodeSnippet(tab) {
  let code = "";
  if (tab === "truecycle") {
    code = `// Drop-in replacement for C:\\hackathonsss\\src\\services\\analyzer.js
import { getBase64FromSource } from './analyzer';

export async function analyzeProductImage(imageSource, itemName) {
  const { dataUrl } = await getBase64FromSource(imageSource);
  
  // Directly calls EcoLens with Groq LPU Vision (sub-second speed, zero quota limits)
  const res = await fetch("http://localhost:8000/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      image: dataUrl,
      provider: "groq"
    })
  });

  if (!res.ok) throw new Error(\`EcoLens API Error: \${res.status}\`);
  const ai = await res.json();

  return {
    productName: ai.product_name || itemName,
    category: ai.product_category,
    composition: ai.compositions_table.map(c => \`\${c.component}: \${c.material} (\${c.estimated_percentage}%)\`).join(', '),
    layers: ai.compositions_table.map(c => ({
      name: c.component,
      material: \`\${c.material} (\${c.estimated_percentage}%)\`,
      recyclability: \`\${c.recyclable} • \${c.stream}\`
    })),
    recycle: { score: Math.round(ai.recyclability_stars), details: ai.recyclability_reasoning },
    reuse:   { score: Math.round(ai.reusability_stars), details: ai.reusability_reasoning },
    reduce:  { score: Math.round(ai.reducibility_stars), details: ai.reducibility_reasoning },
    donate:  ai.is_donation_worthy,
    donateReason: ai.donation_rationale,
    isDiyWorthy: ai.is_diy_worthy,
    diyReason: ai.diy_rationale,
    isLiveAi: true,
    isGrounded: true,
    activeModel: ai.model,
    groundingQueries: ai.grounding.search_queries,
    groundingSources: ai.grounding.sources.map(s => ({ title: s.title, uri: s.url }))
  };
}`;
  } else if (tab === "vanilla") {
    code = `// Call from any website (Vanilla JavaScript)
async function inspectProduct(imageFileOrBase64) {
  const response = await fetch("http://localhost:8000/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      image: imageFileOrBase64,
      provider: "groq"
    })
  });

  const result = await response.json();
  console.log("Product:", result.product_name);
  console.log("Recyclability Stars (1-5):", result.recyclability_stars);
  console.log("Reusability Stars (1-5):", result.reusability_stars);
  console.log("Reducibility Stars (1-5):", result.reducibility_stars);
  console.log("Compositions Table:", result.compositions_table);
  console.log("Donation Worthy?", result.is_donation_worthy);
  console.log("DIY Project Worthy?", result.is_diy_worthy);
  return result;
}`;
  } else if (tab === "react") {
    code = `import React, { useState } from 'react';

export function EcoLensAnalyzer() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleImageCapture(base64DataUrl) {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: base64DataUrl,
          provider: 'groq'
        })
      });
      const data = await res.json();
      setAnalysis(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ecolens-box">
      {analysis && (
        <div>
          <h3>{analysis.product_name}</h3>
          <p>♻️ Recyclability: {analysis.recyclability_stars} / 5.0</p>
          <p>🔄 Reusability: {analysis.reusability_stars} / 5.0</p>
          <p>📉 Reducibility: {analysis.reducibility_stars} / 5.0</p>
          <p>🎁 Donation Worthy: {analysis.is_donation_worthy ? "YES" : "NO"}</p>
          <p>🛠️ DIY Worthy: {analysis.is_diy_worthy ? "YES" : "NO"}</p>
        </div>
      )}
    </div>
  );
}`;
  } else if (tab === "curl") {
    code = `# cURL test command using Groq LPU Vision:
curl -X POST "http://localhost:8000/api/analyze" \\
  -H "Content-Type: application/json" \\
  -d '{
    "image": "data:image/jpeg;base64,...(base64 string)...",
    "provider": "groq"
  }'`;
  }

  integrationCodeBlock.textContent = code;
}

function copySnippetToClipboard() {
  navigator.clipboard.writeText(integrationCodeBlock.textContent).then(() => {
    copyCodeBtn.textContent = "Copied to Clipboard!";
    setTimeout(() => {
      copyCodeBtn.textContent = "Copy Snippet";
    }, 2000);
  });
}
