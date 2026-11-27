import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc,
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";

// True Cycle Firebase Configuration (Loaded securely from build or runtime environment variables)
const runtimeConfig = typeof window !== 'undefined' ? (window.__FIREBASE_CONFIG__ || {}) : {};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || runtimeConfig.apiKey || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || runtimeConfig.authDomain || "truecycle-c351a.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || runtimeConfig.projectId || "truecycle-c351a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || runtimeConfig.storageBucket || "truecycle-c351a.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || runtimeConfig.messagingSenderId || "774871608141",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || runtimeConfig.appId || "1:774871608141:web:44558922681054a05fe504",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || runtimeConfig.measurementId || "G-X8DQFLXRHT"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Initialize Cloud Firestore Database
export const db = getFirestore(app);

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error) {
    console.error("[Firebase Auth] Google Sign-In error:", error);
    return { user: null, error: error.message };
  }
}

/**
 * Sign out current user
 */
export async function logOut() {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    console.error("[Firebase Auth] Sign-Out error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Subscribe to Authentication State Changes
 */
export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Sanitize complex objects so Firestore will never reject undefined fields.
 */
export function sanitizeForFirestore(val) {
  if (val === undefined) return null;
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) {
    return val.map(item => sanitizeForFirestore(item));
  }
  const clean = {};
  for (const [k, v] of Object.entries(val)) {
    if (v !== undefined) {
      clean[k] = sanitizeForFirestore(v);
    }
  }
  return clean;
}

/**
 * Downscale image if needed to ensure it fits safely inside Firestore document limits (< 1MB).
 * Converts blob: URLs and high-res data URLs into persistent, lightweight base64 JPEG thumbnails.
 */
export function createCompressedThumbnail(sourceUrl, maxDimension = 360, quality = 0.75) {
  return new Promise((resolve) => {
    if (!sourceUrl || typeof window === 'undefined') {
      return resolve(sourceUrl);
    }
    // Remote URLs (e.g. https://) don't need local canvas recompression
    if (sourceUrl.startsWith('http://') || sourceUrl.startsWith('https://')) {
      return resolve(sourceUrl);
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width || 360;
      let height = img.height || 360;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      try {
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (e) {
        resolve(sourceUrl);
      }
    };
    img.onerror = () => resolve(sourceUrl);
    img.src = sourceUrl;
  });
}

/**
 * Auto-save a scanned or uploaded specimen to the user's Firestore cloud database.
 * Path: users/{userId}/specimens/{specimenId}
 */
export async function saveSpecimenToCloud(userId, specimen, analysisData) {
  if (!userId || !specimen) return null;

  try {
    // Compress thumbnail if needed to keep document lightweight and fast
    const safeThumbnail = await createCompressedThumbnail(specimen.url);

    const docId = String(specimen.id || Date.now());
    const specimenRef = doc(db, "users", userId, "specimens", docId);

    const payload = {
      id: docId,
      name: specimen.name || "Untitled Specimen",
      url: safeThumbnail,
      timestamp: specimen.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      updatedAt: serverTimestamp()
    };

    if (analysisData !== undefined && analysisData !== null) {
      payload.analysisData = sanitizeForFirestore(analysisData);
    }

    if (!specimen.hasCloudDoc) {
      payload.createdAt = serverTimestamp();
    }

    await setDoc(specimenRef, payload, { merge: true });
    return docId;
  } catch (error) {
    console.error("[Firestore] Error saving specimen to cloud:", error);
    return null;
  }
}

/**
 * Update just the analysisData of an existing specimen in Firestore.
 */
export async function saveSpecimenAnalysisToCloud(userId, specimenId, analysisData) {
  if (!userId || !specimenId || !analysisData) return;
  try {
    const docId = String(specimenId);
    const specimenRef = doc(db, "users", userId, "specimens", docId);
    const sanitized = sanitizeForFirestore(analysisData);
    await setDoc(specimenRef, {
      analysisData: sanitized,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("[Firestore] Error updating specimen analysis in cloud:", error);
  }
}

/**
 * Load all saved specimens for the current user from Firestore.
 * Path: users/{userId}/specimens
 */
export async function loadUserSpecimensFromCloud(userId) {
  if (!userId) return [];

  try {
    const specimensCol = collection(db, "users", userId, "specimens");
    const q = query(specimensCol, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    const items = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      items.push({
        id: data.id || docSnap.id,
        name: data.name,
        url: data.url,
        timestamp: data.timestamp || "Synced",
        analysisData: data.analysisData || null,
        hasCloudDoc: true
      });
    });

    return items;
  } catch (error) {
    console.error("[Firestore] Error loading user specimens:", error);
    return [];
  }
}

/**
 * Delete a specimen from the user's Firestore cloud storage.
 */
export async function deleteSpecimenFromCloud(userId, specimenId) {
  if (!userId || !specimenId) return;

  try {
    const docRef = doc(db, "users", userId, "specimens", String(specimenId));
    await deleteDoc(docRef);
  } catch (error) {
    console.error("[Firestore] Error deleting specimen from cloud:", error);
  }
}

/**
 * Update a specimen's name in the user's Firestore cloud storage.
 */
export async function updateSpecimenNameInCloud(userId, specimenId, newName) {
  if (!userId || !specimenId || !newName) return;

  try {
    const docRef = doc(db, "users", userId, "specimens", String(specimenId));
    await updateDoc(docRef, {
      name: newName.trim(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("[Firestore] Error updating specimen name in cloud:", error);
  }
}
