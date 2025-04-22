/**
 * BraveBunny Usage Limiter
 * Tracks and enforces story generation limits for anonymous users
 */

import { 
  getFirestore, 
  doc, 
  getDoc, 
  increment, 
  updateDoc 
} from 'firebase/firestore';

// Constants for usage limits
const BASE_MONTHLY_LIMIT = 3;
const SHARE_BONUS_LIMIT = 3;
const SHARE_REQUIREMENT = 3;

/**
 * Checks if user can generate a new story based on their usage
 * @param {string} uid - The user's UID
 * @returns {Promise<boolean>} Whether the user can generate a story
 */
export async function canGenerate(uid) {
  try {
    const stats = await getUsageStats(uid);
    
    // Allow if within base limit
    if (stats.monthlyGenerations < BASE_MONTHLY_LIMIT) {
      return true;
    }
    
    // Allow if within bonus limit and has enough shares
    if (stats.monthlyGenerations < (BASE_MONTHLY_LIMIT + SHARE_BONUS_LIMIT) && 
        stats.shareCount >= SHARE_REQUIREMENT) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking generation limit:', error);
    return false; // Fail safe: deny generation on error
  }
}

/**
 * Records a story generation in Firestore
 * @param {string} uid - The user's UID
 * @returns {Promise<void>}
 */
export async function recordGeneration(uid) {
  try {
    const db = getFirestore();
    const userRef = doc(db, 'users', uid);
    
    await updateDoc(userRef, {
      monthlyGenerations: increment(1)
    });
  } catch (error) {
    console.error('Error recording generation:', error);
    throw new Error('Failed to record story generation');
  }
}

/**
 * Records a social media share in Firestore
 * @param {string} uid - The user's UID
 * @returns {Promise<void>}
 */
export async function recordShare(uid) {
  try {
    const db = getFirestore();
    const userRef = doc(db, 'users', uid);
    
    await updateDoc(userRef, {
      shareCount: increment(1)
    });
  } catch (error) {
    console.error('Error recording share:', error);
    throw new Error('Failed to record social share');
  }
}

/**
 * Retrieves user's current usage statistics
 * @param {string} uid - The user's UID
 * @returns {Promise<Object>} Object containing usage stats
 */
export async function getUsageStats(uid) {
  try {
    const db = getFirestore();
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);
    
    if (!snapshot.exists()) {
      throw new Error('User document not found');
    }
    
    const data = snapshot.data();
    return {
      monthlyGenerations: data.monthlyGenerations || 0,
      shareCount: data.shareCount || 0
    };
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    throw new Error('Failed to fetch usage statistics');
  }
}