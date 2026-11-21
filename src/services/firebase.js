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

// True Cycle Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAocurggvjaLGTJOJ0fh7a_1DE1Pb_yG3A",
  authDomain: "truecycle-c351a.firebaseapp.com",
  projectId: "truecycle-c351a",
  storageBucket: "truecycle-c351a.firebasestorage.app",
  messagingSenderId: "774871608141",
  appId: "1:774871608141:web:44558922681054a05fe504",
  measurementId: "G-X8DQFLXRHT"
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
 * Downscale image if needed to ensure it fits safely inside Firestore document limits (< 1MB).
 */
function createCompressedThumbnail(dataUrl, maxDimension = 360, quality = 0.75) {
  return new Promise((resolve) => {
    if (!dataUrl || typeof window === 'undefined' || !dataUrl.startsWith('data:image')) {
      return resolve(dataUrl);
    }
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
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
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
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
      analysisData: analysisData || null,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    };

    await setDoc(specimenRef, payload, { merge: true });
    return docId;
  } catch (error) {
    console.error("[Firestore] Error saving specimen to cloud:", error);
    return null;
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
        analysisData: data.analysisData || null
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
