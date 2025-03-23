import { 
  auth, 
  db 
} from './config';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  UserCredential,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';

interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  createdAt: Date | Timestamp;
  lastLogin: Date | Timestamp;
}

// Collection Firestore pour les profils utilisateurs
const USERS_COLLECTION = 'users';

/**
 * Crée un nouvel utilisateur avec email et mot de passe
 * @param email Email de l'utilisateur
 * @param password Mot de passe
 * @param displayName Nom d'affichage (optionnel)
 * @returns Les informations d'authentification de l'utilisateur
 */
export const registerUser = async (
  email: string, 
  password: string, 
  displayName?: string
): Promise<UserCredential> => {
  try {
    // Créer l'utilisateur dans Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Créer un profil utilisateur dans Firestore
    await setDoc(doc(db, USERS_COLLECTION, userCredential.user.uid), {
      id: userCredential.user.uid,
      email,
      displayName: displayName || '',
      photoURL: '',
      phoneNumber: '',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });
    
    return userCredential;
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    throw error;
  }
};

/**
 * Connecte un utilisateur avec email et mot de passe
 * @param email Email de l'utilisateur
 * @param password Mot de passe
 * @returns Les informations d'authentification de l'utilisateur
 */
export const loginUser = async (
  email: string, 
  password: string
): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Mettre à jour la date de dernière connexion
    if (userCredential.user) {
      await updateDoc(doc(db, USERS_COLLECTION, userCredential.user.uid), {
        lastLogin: serverTimestamp()
      });
    }
    
    return userCredential;
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    throw error;
  }
};

/**
 * Déconnecte l'utilisateur actuel
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    throw error;
  }
};

/**
 * Envoie un email de réinitialisation de mot de passe
 * @param email Email de l'utilisateur
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    throw error;
  }
};

/**
 * Récupère le profil d'un utilisateur
 * @param userId ID de l'utilisateur
 * @returns Profil de l'utilisateur ou null si non trouvé
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as UserProfile;
      // Convertir les timestamps Firestore en Date JavaScript
      return {
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        lastLogin: data.lastLogin instanceof Timestamp ? data.lastLogin.toDate() : data.lastLogin
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du profil utilisateur:', error);
    throw error;
  }
};

/**
 * Met à jour le profil d'un utilisateur
 * @param userId ID de l'utilisateur
 * @param profileData Données de profil à mettre à jour
 */
export const updateUserProfile = async (
  userId: string, 
  profileData: Partial<UserProfile>
): Promise<void> => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(docRef, profileData);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    throw error;
  }
};

/**
 * Écoute les changements d'état de l'authentification
 * @param callback Fonction à appeler lors d'un changement d'état
 * @returns Fonction pour annuler l'écoute
 */
export const onAuthChange = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Connexion avec Google
 * @returns Les informations d'authentification de l'utilisateur
 */
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    
    // Vérifier si l'utilisateur existe déjà dans Firestore
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userCredential.user.uid));
    
    if (!userDoc.exists()) {
      // Créer un profil utilisateur dans Firestore s'il n'existe pas
      await setDoc(doc(db, USERS_COLLECTION, userCredential.user.uid), {
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        displayName: userCredential.user.displayName || '',
        photoURL: userCredential.user.photoURL || '',
        phoneNumber: userCredential.user.phoneNumber || '',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });
    } else {
      // Mettre à jour la date de dernière connexion
      await updateDoc(doc(db, USERS_COLLECTION, userCredential.user.uid), {
        lastLogin: serverTimestamp()
      });
    }
    
    return userCredential;
  } catch (error) {
    console.error('Erreur lors de la connexion avec Google:', error);
    throw error;
  }
}; 