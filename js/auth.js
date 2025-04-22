/**
 * BraveBunny Authentication Module
 * Handles Firebase anonymous authentication and user activity tracking
 */

import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';

import { 
  getFirestore, 
  doc, 
  setDoc, 
  updateDoc, 
  increment, 
  serverTimestamp 
} from 'firebase/firestore';

/**
 * Initializes Firebase authentication and returns the current user's UID
 * @returns {Promise<string>} The user's UID
 */
export async function initializeAuth() {
  const auth = getAuth();
  
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // User is already signed in
          await ensureUserDocument(user.uid);
          resolve(user.uid);
        } else {
          // Sign in anonymously
          const credential = await signInAnonymously(auth);
          await ensureUserDocument(credential.user.uid);
          resolve(credential.user.uid);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        reject(error);
      }
    });
  });
}

/**
 * Ensures user document exists in Firestore
 * @private
 * @param {string} uid - The user's UID
 */
async function ensureUserDocument(uid) {
  const db = getFirestore();
  const userRef = doc(db, 'users', uid);
  
  await setDoc(userRef, {
    createdAt: serverTimestamp(),
    monthlyGenerations: 0,
    shareCount: 0
  }, { merge: true });
}

/**
 * Increments the user's monthly story generation count
 * @param {string} uid - The user's UID
 * @returns {Promise<void>}
 */
export async function incrementStoryCount(uid) {
  try {
    const db = getFirestore();
    const userRef = doc(db, 'users', uid);
    
    await updateDoc(userRef, {
      monthlyGenerations: increment(1)
    });
  } catch (error) {
    console.error('Error updating story count:', error);
    throw new Error('Failed to update story count');
  }
}

/**
 * Increments the user's social sharing count
 * @param {string} uid - The user's UID
 * @returns {Promise<void>}
 */
export async function incrementShareCount(uid) {
  try {
    const db = getFirestore();
    const userRef = doc(db, 'users', uid);
    
    await updateDoc(userRef, {
      shareCount: increment(1)
    });
  } catch (error) {
    console.error('Error updating share count:', error);
    throw new Error('Failed to update share count');
  }
}

/**
 * Resets monthly story generation count
 * Should be called by a scheduled function on the first day of each month
 * @param {string} uid - The user's UID
 * @returns {Promise<void>}
 */
export async function resetMonthlyGenerations(uid) {
  try {
    const db = getFirestore();
    const userRef = doc(db, 'users', uid);
    
    await updateDoc(userRef, {
      monthlyGenerations: 0
    });
  } catch (error) {
    console.error('Error resetting generation count:', error);
    throw new Error('Failed to reset generation count');
  }
}