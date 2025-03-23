import { db, storage, auth } from './config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  deleteDoc,
  getDoc,
  Timestamp,
  updateDoc,
  limit
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';

// Interface pour le type d'analyse
export interface AnalyseMedicament {
  id?: string;
  userId: string;
  date: Date | Timestamp;
  nom: string;
  description?: string;
  image?: string;
  detailsAnalyse?: any;
}

// Collection Firestore pour les analyses
const ANALYSES_COLLECTION = 'analyses';

/**
 * Sauvegarde une analyse de médicament dans Firestore
 * @param analyse Les données de l'analyse à sauvegarder
 * @returns L'ID du document créé ou null en cas d'erreur
 */
export const saveAnalyse = async (analyse: Omit<AnalyseMedicament, 'id' | 'userId' | 'date'>): Promise<string | null> => {
  try {
    // Vérifier que l'utilisateur est authentifié
    if (!auth.currentUser) {
      console.error("Impossible de sauvegarder l'analyse: utilisateur non authentifié");
      return null;
    }

    // Préparer les données pour Firestore
    const analyseData: Omit<AnalyseMedicament, 'id'> = {
      userId: auth.currentUser.uid,
      date: Timestamp.now(),
      nom: analyse.nom,
      description: analyse.description,
      image: analyse.image,
      detailsAnalyse: analyse.detailsAnalyse
    };

    // Ajouter le document à Firestore
    const docRef = await addDoc(collection(db, ANALYSES_COLLECTION), analyseData);
    console.log("Analyse sauvegardée avec succès, ID:", docRef.id);
    toast.success("Analyse sauvegardée dans votre historique");
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de l'analyse:", error);
    toast.error("Erreur lors de la sauvegarde de l'analyse");
    return null;
  }
};

/**
 * Récupère les analyses récentes d'un utilisateur
 * @param nbLimit Nombre maximum d'analyses à récupérer (défaut: 10)
 * @returns Liste des analyses
 */
export const getRecentAnalyses = async (nbLimit = 10): Promise<AnalyseMedicament[]> => {
  try {
    // Vérifier que l'utilisateur est authentifié
    if (!auth.currentUser) {
      console.error("Impossible de récupérer les analyses: utilisateur non authentifié");
      return [];
    }

    // VERSION TEMPORAIRE: N'utilise que le filtre userId pour éviter l'erreur d'index
    const q = query(
      collection(db, ANALYSES_COLLECTION),
      where('userId', '==', auth.currentUser.uid)
      // Temporairement commenté pour éviter l'erreur d'index
      // orderBy('date', 'desc'),
      // limit(nbLimit)
    );

    // Exécuter la requête
    const querySnapshot = await getDocs(q);
    
    // Transformer les résultats
    let analyses: AnalyseMedicament[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Omit<AnalyseMedicament, 'id'>;
      analyses.push({
        id: doc.id,
        ...data,
        date: data.date instanceof Timestamp ? data.date.toDate() : data.date
      });
    });

    // Trier manuellement par date (du plus récent au plus ancien)
    analyses.sort((a, b) => {
      const dateA = a.date instanceof Date 
        ? a.date.getTime() 
        : a.date instanceof Timestamp 
          ? a.date.toDate().getTime() 
          : new Date().getTime();
          
      const dateB = b.date instanceof Date 
        ? b.date.getTime() 
        : b.date instanceof Timestamp 
          ? b.date.toDate().getTime() 
          : new Date().getTime();
          
      return dateB - dateA;
    });

    // Limiter manuellement le nombre de résultats
    if (analyses.length > nbLimit) {
      analyses = analyses.slice(0, nbLimit);
    }

    console.log(`getRecentAnalyses: ${analyses.length} analyses récupérées avec succès`);
    return analyses;
  } catch (error) {
    console.error("Erreur lors de la récupération des analyses:", error);
    return [];
  }
};

/**
 * Récupère toutes les analyses d'un utilisateur
 * @param userId ID de l'utilisateur
 * @returns Liste des analyses de l'utilisateur
 */
export const getUserAnalyses = async (userId: string): Promise<AnalyseMedicament[]> => {
  try {
    const q = query(
      collection(db, ANALYSES_COLLECTION), 
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as AnalyseMedicament;
      // Convertir le timestamp Firestore en Date JavaScript
      const timestamp = data.date as Timestamp;
      return {
        ...data,
        id: doc.id,
        date: timestamp.toDate()
      };
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des analyses:', error);
    throw error;
  }
};

/**
 * Récupère une analyse spécifique par son ID
 * @param analyseId ID de l'analyse
 * @returns Données de l'analyse ou null si non trouvée
 */
export const getAnalyseById = async (analyseId: string): Promise<AnalyseMedicament | null> => {
  try {
    const docRef = doc(db, ANALYSES_COLLECTION, analyseId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as AnalyseMedicament;
      const timestamp = data.date as Timestamp;
      return {
        ...data,
        id: docSnap.id,
        date: timestamp.toDate()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'analyse:', error);
    throw error;
  }
};

/**
 * Supprime une analyse de médicament
 * @param analyseId ID de l'analyse à supprimer
 */
export const deleteAnalyse = async (analyseId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, ANALYSES_COLLECTION, analyseId));
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'analyse:', error);
    throw error;
  }
};

/**
 * Met à jour une analyse existante
 * @param analyseId ID de l'analyse
 * @param updateData Données à mettre à jour
 */
export const updateAnalyse = async (analyseId: string, updateData: Partial<AnalyseMedicament>): Promise<void> => {
  try {
    const docRef = doc(db, ANALYSES_COLLECTION, analyseId);
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'analyse:', error);
    throw error;
  }
}; 