# MediScan - Application d'Analyse de Médicaments

MediScan est une application web permettant d'analyser des médicaments à partir de photos et de fournir des informations détaillées sur ceux-ci. L'application utilise Firebase pour l'authentification des utilisateurs et le stockage des analyses effectuées.

## Fonctionnalités

- Analyse de médicaments par photo (via caméra ou upload)
- Affichage détaillé des informations sur les médicaments
- Authentification des utilisateurs (inscription, connexion, réinitialisation de mot de passe)
- Sauvegarde des analyses dans une base de données Firebase
- Historique des analyses pour chaque utilisateur
- Interface responsive et moderne

## Prérequis

- Node.js (v16 ou supérieur)
- Compte Firebase

## Installation

1. Clonez ce dépôt :
```bash
git clone <URL_DU_REPO>
cd mediscan
```

2. Installez les dépendances :
```bash
npm install
```

3. Configuration de Firebase :
   - Créez un nouveau projet sur la [Console Firebase](https://console.firebase.google.com/)
   - Activez l'authentification par email/mot de passe dans la section "Authentication"
   - Créez une base de données Firestore dans la section "Firestore Database"
   - Activez le stockage Firebase dans la section "Storage"
   - Dans les paramètres du projet, ajoutez une application web et copiez les informations de configuration

4. Créez un fichier `.env.local` à la racine du projet avec les informations suivantes :
```
NEXT_PUBLIC_FIREBASE_API_KEY=votre_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=votre_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=votre_app_id
```

5. Lancez l'application en mode développement :
```bash
npm run dev
```

L'application sera accessible à l'adresse [http://localhost:3000](http://localhost:3000).

## Déploiement

Pour déployer l'application, vous pouvez utiliser Vercel, Netlify ou tout autre service de déploiement compatible avec Next.js.

### Déploiement avec Vercel

1. Installez la CLI Vercel :
```bash
npm install -g vercel
```

2. Déployez l'application :
```bash
vercel
```

## Structure du projet

- `/public` - Ressources statiques
- `/src` - Code source de l'application
  - `/app` - Structure des pages (Next.js App Router)
  - `/components` - Composants React réutilisables
  - `/firebase` - Configuration et services Firebase
  - `/styles` - Feuilles de style globales

## Configuration des règles Firestore

Pour sécuriser votre base de données, voici les règles Firestore recommandées :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }
    match /analyses/{analyseId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
  }
}
```

## Configuration des règles Storage

Pour sécuriser votre stockage, voici les règles Storage recommandées :

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /images/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Technologies utilisées

- Next.js - Framework React
- Tailwind CSS - Framework CSS pour le design
- Firebase - Backend as a Service (Authentification, Firestore, Storage)
- Framer Motion - Bibliothèque d'animations
- React Hot Toast - Notifications
- Date-fns - Bibliothèque de manipulation de dates

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus d'informations.
