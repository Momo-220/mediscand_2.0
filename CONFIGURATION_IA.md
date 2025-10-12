# 🔧 Configuration de l'IA pour MediScan

## Problème identifié

Votre IA ne donne plus les résultats d'analyse car **la clé API Gemini n'est pas configurée**.

## Solution

### 1. Créer le fichier de configuration

Créez un fichier `.env.local` dans le répertoire `mediscan/` avec le contenu suivant :

```env
# Configuration pour l'API Gemini
NEXT_PUBLIC_GEMINI_API_KEY=votre_cle_api_gemini_ici

# Configuration Firebase (si nécessaire)
NEXT_PUBLIC_FIREBASE_API_KEY=votre_cle_firebase
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre_projet.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre_projet_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre_projet.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 2. Obtenir une clé API Gemini

1. Rendez-vous sur [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Connectez-vous avec votre compte Google
3. Cliquez sur "Create API Key"
4. Copiez la clé générée
5. Remplacez `votre_cle_api_gemini_ici` dans le fichier `.env.local`

### 3. Redémarrer l'application

```bash
npm run dev
```

## Corrections apportées

✅ **Erreur de syntaxe corrigée** : Accolade manquante dans route.ts  
✅ **Modèle mis à jour** : Utilisation de "gemini-1.5-pro-latest" au lieu de "gemini-2.0-flash"  
✅ **Gestion d'erreur améliorée** : Messages d'erreur plus précis  
✅ **Vérification de la clé API** : Contrôle avant l'appel à l'API  
✅ **Suppression des doublons** : Fichier route.ts en double supprimé  

## Messages d'erreur possibles

- **"Clé API Gemini non trouvée"** → Configurez la variable NEXT_PUBLIC_GEMINI_API_KEY
- **"Quota d'API dépassé"** → Attendez ou passez à un plan payant
- **"Clé API invalide"** → Vérifiez que votre clé est correcte
- **"Contenu bloqué"** → L'image ne respecte pas les règles de sécurité

## Test

Une fois configuré, testez avec une image de médicament claire. L'IA devrait maintenant retourner une analyse détaillée au format JSON.
