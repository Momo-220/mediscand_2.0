# 🚀 Guide de Configuration Supabase pour MediScan

## 📋 Prérequis

1. **Compte Supabase** : Créez un compte sur [supabase.com](https://supabase.com)
2. **Node.js** : Version 18+ installée
3. **Git** : Pour cloner le projet

## 🔧 Configuration du Projet Supabase

### 1. Créer un Nouveau Projet

1. Connectez-vous à [supabase.com](https://supabase.com)
2. Cliquez sur "New Project"
3. Choisissez votre organisation
4. Nom du projet : `mediscan`
5. Mot de passe de base de données : Générez un mot de passe sécurisé
6. Région : Choisissez la région la plus proche (Europe West pour la France)
7. Cliquez sur "Create new project"

### 2. Configuration des Variables d'Environnement

1. **Récupérez vos clés Supabase** :
   - Allez dans `Settings` > `API`
   - Copiez `Project URL` et `anon public` key

2. **Créez le fichier `.env.local`** dans le dossier `mediscan/` :
   ```bash
   # Configuration Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://votre-projet-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon-publique
   
   # Configuration Google Gemini AI
   NEXT_PUBLIC_GEMINI_API_KEY=votre-clé-api-gemini
   
   # Configuration Next.js
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### 3. Configuration de la Base de Données

1. **Allez dans l'éditeur SQL** de Supabase
2. **Exécutez le script SQL** fourni dans `supabase-schema.sql`
3. **Vérifiez les tables créées** :
   - `profiles` : Profils utilisateurs
   - `analyses` : Analyses de médicaments

### 4. Configuration du Stockage

1. **Allez dans `Storage`** dans le dashboard Supabase
2. **Créez un nouveau bucket** :
   - Nom : `medicament-images`
   - Public : ✅ Activé
   - File size limit : 5 MB
   - Allowed MIME types : `image/jpeg`, `image/png`, `image/webp`

3. **Configurez les politiques de sécurité** :
   ```sql
   -- Politique pour permettre l'upload aux utilisateurs authentifiés
   CREATE POLICY "Authenticated users can upload images" ON storage.objects
   FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
   
   -- Politique pour permettre la lecture publique des images
   CREATE POLICY "Public can view images" ON storage.objects
   FOR SELECT USING (bucket_id = 'medicament-images');
   
   -- Politique pour permettre la suppression aux propriétaires
   CREATE POLICY "Users can delete their own images" ON storage.objects
   FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
   ```

### 5. Configuration de l'Authentification

1. **Allez dans `Authentication` > `Settings`**
2. **Configurez les providers** :
   - Email : ✅ Activé
   - Google : ⚙️ Configurer avec vos clés OAuth Google
   - Mot de passe minimum : 6 caractères

3. **Configurez les URLs de redirection** :
   - Site URL : `http://localhost:3000`
   - Redirect URLs : 
     ```
     http://localhost:3000/auth/callback
     http://localhost:3000/auth/reset-password
     ```

### 6. Configuration Google OAuth (Optionnel)

1. **Allez sur [Google Cloud Console](https://console.cloud.google.com)**
2. **Créez un projet** ou sélectionnez un projet existant
3. **Activez l'API Google+**
4. **Créez des identifiants OAuth 2.0** :
   - Type : Application web
   - Origines JavaScript autorisées : `http://localhost:3000`
   - URIs de redirection autorisés : `https://votre-projet-id.supabase.co/auth/v1/callback`

5. **Copiez les clés** dans Supabase :
   - Client ID
   - Client Secret

## 🚀 Démarrage du Projet

### 1. Installation des Dépendances

```bash
cd mediscan
npm install
```

### 2. Démarrage du Serveur de Développement

```bash
npm run dev
```

Le projet sera accessible sur `http://localhost:3000`

## 🔍 Vérification de la Configuration

### 1. Test de Connexion à la Base de Données

1. Ouvrez l'application dans votre navigateur
2. Créez un compte utilisateur
3. Essayez de faire une analyse de médicament
4. Vérifiez que l'analyse est sauvegardée dans Supabase

### 2. Test du Stockage d'Images

1. Prenez une photo d'un médicament
2. Vérifiez que l'image est uploadée dans le bucket `medicament-images`
3. Vérifiez que l'URL de l'image est correctement sauvegardée

### 3. Test de l'Authentification

1. Testez la connexion par email/mot de passe
2. Testez la création de compte
3. Testez la réinitialisation de mot de passe
4. Testez la déconnexion

## 🛠️ Dépannage

### Problèmes Courants

1. **Erreur de connexion à Supabase** :
   - Vérifiez les variables d'environnement
   - Vérifiez que l'URL du projet est correcte

2. **Erreur d'upload d'images** :
   - Vérifiez que le bucket `medicament-images` existe
   - Vérifiez les politiques de sécurité du storage

3. **Erreur d'authentification** :
   - Vérifiez les URLs de redirection
   - Vérifiez la configuration des providers

### Logs de Débogage

Activez les logs de débogage en ajoutant dans `.env.local` :
```bash
NEXT_PUBLIC_DEBUG=true
```

## 📚 Ressources Supplémentaires

- [Documentation Supabase](https://supabase.com/docs)
- [Guide d'authentification Supabase](https://supabase.com/docs/guides/auth)
- [Guide de stockage Supabase](https://supabase.com/docs/guides/storage)
- [Documentation Next.js](https://nextjs.org/docs)

## 🎯 Prochaines Étapes

1. **Déploiement en production** :
   - Configurez les URLs de production
   - Utilisez des domaines personnalisés
   - Configurez HTTPS

2. **Optimisations** :
   - Mise en cache des images
   - Optimisation des requêtes
   - Compression des données

3. **Fonctionnalités avancées** :
   - Notifications push
   - Synchronisation hors ligne
   - Analytics et métriques

