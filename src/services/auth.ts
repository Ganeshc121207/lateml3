import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '../types';

// Convert Firebase user to our User type
const convertFirebaseUser = async (firebaseUser: FirebaseUser): Promise<User | null> => {
  if (!firebaseUser) return null;

  try {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    const userData = userDoc.data();

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || userData?.displayName || '',
      role: userData?.role || 'student',
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: userData?.createdAt || new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      emailVerified: true, // Always true since we're removing verification
    };
  } catch (error) {
    console.warn('Error accessing Firestore user data, using Firebase Auth data only:', error);
    
    // Fallback: create user object from Firebase Auth data only
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || '',
      role: 'student', // Default role when Firestore is inaccessible
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      emailVerified: true,
    };
  }
};

export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    const user = await convertFirebaseUser(userCredential.user);
    
    if (!user) {
      throw new Error('Failed to get user data');
    }

    // Try to update last login, but don't fail if Firestore is inaccessible
    try {
      await setDoc(doc(db, 'users', user.uid), {
        lastLogin: new Date().toISOString()
      }, { merge: true });
    } catch (firestoreError) {
      console.warn('Could not update last login in Firestore:', firestoreError);
    }

    return user;
  } catch (error: any) {
    console.error('Sign in error:', error);
    if (error.code === 'permission-denied') {
      throw new Error('Database permissions not configured. Please check Firebase Security Rules.');
    }
    throw new Error(error.message || 'Failed to sign in');
  }
};

export const signUp = async (
  email: string, 
  password: string, 
  displayName: string, 
  role: 'admin' | 'student' = 'student'
): Promise<{ user: User; needsVerification: boolean }> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update the user's display name
    await updateProfile(userCredential.user, {
      displayName: displayName
    });

    const userData = {
      uid: userCredential.user.uid,
      email: userCredential.user.email || '',
      displayName,
      role,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      emailVerified: true, // Always true since we're removing verification
    };

    // Try to save user data to Firestore, but don't fail if permissions are missing
    try {
      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
    } catch (firestoreError) {
      console.warn('Could not save user data to Firestore:', firestoreError);
    }

    return { 
      user: userData, 
      needsVerification: false // No verification needed
    };
  } catch (error: any) {
    console.error('Sign up error:', error);
    if (error.code === 'permission-denied') {
      throw new Error('Database permissions not configured. Please check Firebase Security Rules.');
    }
    throw new Error(error.message || 'Failed to create account');
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribe();
      if (firebaseUser) {
        const user = await convertFirebaseUser(firebaseUser);
        resolve(user);
      } else {
        resolve(null);
      }
    });
  });
};

// Real-time auth state listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const user = await convertFirebaseUser(firebaseUser);
      callback(user);
    } else {
      callback(null);
    }
  });
};