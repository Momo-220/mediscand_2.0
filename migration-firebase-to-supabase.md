# 🔄 Guide de Migration Firebase vers Supabase

## 📋 Vue d'Ensemble

Ce guide explique comment migrer les données existantes de Firebase vers Supabase pour le projet MediScan.

## 🗂️ Structure des Données

### Firebase (Ancien)
```
users/
  {userId}/
    email: string
    displayName: string
    createdAt: timestamp

analyses/
  {analyseId}/
    userId: string
    nom: string
    description: string
    imageUrl: string
    detailsAnalyse: object
    createdAt: timestamp
```

### Supabase (Nouveau)
```sql
-- Table profiles
profiles (
  id: UUID (référence auth.users)
  email: TEXT
  display_name: TEXT
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
)

-- Table analyses
analyses (
  id: UUID
  user_id: UUID (référence auth.users)
  nom: TEXT
  description: TEXT
  image_url: TEXT
  details_analyse: JSONB
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
)
```

## 🔧 Script de Migration

### 1. Export des Données Firebase

Créez un script Node.js pour exporter les données Firebase :

```javascript
// scripts/export-firebase-data.js
const admin = require('firebase-admin');
const fs = require('fs');

// Configuration Firebase Admin
const serviceAccount = require('./path-to-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://votre-projet.firebaseio.com'
});

const db = admin.firestore();

async function exportUsers() {
  const usersSnapshot = await db.collection('users').get();
  const users = [];
  
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    users.push({
      id: doc.id,
      ...data
    });
  });
  
  fs.writeFileSync('exported-users.json', JSON.stringify(users, null, 2));
  console.log(`${users.length} utilisateurs exportés`);
}

async function exportAnalyses() {
  const analysesSnapshot = await db.collection('analyses').get();
  const analyses = [];
  
  analysesSnapshot.forEach(doc => {
    const data = doc.data();
    analyses.push({
      id: doc.id,
      ...data
    });
  });
  
  fs.writeFileSync('exported-analyses.json', JSON.stringify(analyses, null, 2));
  console.log(`${analyses.length} analyses exportées`);
}

async function main() {
  await exportUsers();
  await exportAnalyses();
  console.log('Export terminé');
}

main().catch(console.error);
```

### 2. Script de Migration vers Supabase

```javascript
// scripts/migrate-to-supabase.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Clé service role
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateUsers() {
  const users = JSON.parse(fs.readFileSync('exported-users.json', 'utf8'));
  
  for (const user of users) {
    try {
      // Créer l'utilisateur dans Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: 'temp-password-' + Math.random(), // L'utilisateur devra changer son mot de passe
        email_confirm: true
      });
      
      if (authError) {
        console.error('Erreur création utilisateur:', authError);
        continue;
      }
      
      // Créer le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email: user.email,
          display_name: user.displayName || '',
          created_at: user.createdAt?.toDate?.() || new Date(),
          updated_at: new Date()
        });
      
      if (profileError) {
        console.error('Erreur création profil:', profileError);
      } else {
        console.log(`Utilisateur migré: ${user.email}`);
      }
    } catch (error) {
      console.error('Erreur migration utilisateur:', error);
    }
  }
}

async function migrateAnalyses() {
  const analyses = JSON.parse(fs.readFileSync('exported-analyses.json', 'utf8'));
  
  for (const analyse of analyses) {
    try {
      // Récupérer l'ID Supabase de l'utilisateur
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', analyse.userEmail) // Assumer que vous avez l'email dans les analyses
        .single();
      
      if (!profile) {
        console.error('Profil non trouvé pour:', analyse.userEmail);
        continue;
      }
      
      // Créer l'analyse
      const { error } = await supabase
        .from('analyses')
        .insert({
          user_id: profile.id,
          nom: analyse.nom,
          description: analyse.description,
          image_url: analyse.imageUrl,
          details_analyse: analyse.detailsAnalyse,
          created_at: analyse.createdAt?.toDate?.() || new Date(),
          updated_at: new Date()
        });
      
      if (error) {
        console.error('Erreur création analyse:', error);
      } else {
        console.log(`Analyse migrée: ${analyse.nom}`);
      }
    } catch (error) {
      console.error('Erreur migration analyse:', error);
    }
  }
}

async function main() {
  console.log('Début de la migration...');
  await migrateUsers();
  await migrateAnalyses();
  console.log('Migration terminée');
}

main().catch(console.error);
```

## 🖼️ Migration des Images

### 1. Script de Migration des Images

```javascript
// scripts/migrate-images.js
const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function downloadFromFirebase(storageRef, localPath) {
  const file = admin.storage().bucket().file(storageRef);
  await file.download({ destination: localPath });
}

async function uploadToSupabase(localPath, supabasePath) {
  const fileBuffer = fs.readFileSync(localPath);
  
  const { error } = await supabase.storage
    .from('medicament-images')
    .upload(supabasePath, fileBuffer);
  
  if (error) {
    throw error;
  }
  
  // Nettoyer le fichier local
  fs.unlinkSync(localPath);
}

async function migrateImages() {
  const analyses = JSON.parse(fs.readFileSync('exported-analyses.json', 'utf8'));
  
  for (const analyse of analyses) {
    if (!analyse.imageUrl || !analyse.imageUrl.includes('firebase')) {
      continue;
    }
    
    try {
      // Extraire le chemin Firebase de l'URL
      const firebasePath = analyse.imageUrl.split('/o/')[1]?.split('?')[0];
      if (!firebasePath) continue;
      
      const decodedPath = decodeURIComponent(firebasePath);
      const fileName = path.basename(decodedPath);
      const localPath = `./temp-images/${fileName}`;
      const supabasePath = `${analyse.userId}/${fileName}`;
      
      // Créer le dossier temporaire
      fs.mkdirSync('./temp-images', { recursive: true });
      
      // Télécharger depuis Firebase
      await downloadFromFirebase(decodedPath, localPath);
      
      // Uploader vers Supabase
      await uploadToSupabase(localPath, supabasePath);
      
      console.log(`Image migrée: ${fileName}`);
    } catch (error) {
      console.error('Erreur migration image:', error);
    }
  }
  
  // Nettoyer le dossier temporaire
  fs.rmSync('./temp-images', { recursive: true });
}

migrateImages().catch(console.error);
```

## 🔄 Mise à Jour des URLs d'Images

```sql
-- Script SQL pour mettre à jour les URLs d'images
UPDATE analyses 
SET image_url = REPLACE(
  image_url, 
  'https://firebasestorage.googleapis.com/v0/b/votre-projet.appspot.com/o/',
  'https://votre-projet-id.supabase.co/storage/v1/object/public/medicament-images/'
)
WHERE image_url LIKE '%firebasestorage.googleapis.com%';
```

## ✅ Vérification Post-Migration

### 1. Script de Vérification

```javascript
// scripts/verify-migration.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyMigration() {
  // Vérifier les utilisateurs
  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  
  // Vérifier les analyses
  const { count: analyseCount } = await supabase
    .from('analyses')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Utilisateurs migrés: ${userCount}`);
  console.log(`Analyses migrées: ${analyseCount}`);
  
  // Vérifier quelques analyses
  const { data: sampleAnalyses } = await supabase
    .from('analyses')
    .select('*')
    .limit(5);
  
  console.log('Échantillon d\'analyses:', sampleAnalyses);
}

verifyMigration().catch(console.error);
```

## 🚨 Points d'Attention

### 1. Sécurité
- Utilisez la clé **Service Role** pour la migration (jamais la clé publique)
- Supprimez les fichiers d'export après migration
- Changez les mots de passe temporaires des utilisateurs

### 2. Données Sensibles
- Les mots de passe Firebase ne peuvent pas être migrés
- Les utilisateurs devront réinitialiser leurs mots de passe
- Envoyez un email de notification aux utilisateurs

### 3. Rollback
- Gardez une sauvegarde des données Firebase
- Testez la migration sur un environnement de test d'abord
- Préparez un plan de rollback si nécessaire

## 📧 Notification aux Utilisateurs

Envoyez un email aux utilisateurs existants :

```html
<!DOCTYPE html>
<html>
<head>
  <title>Migration MediScan vers Supabase</title>
</head>
<body>
  <h1>Bonjour,</h1>
  
  <p>Nous avons migré MediScan vers une nouvelle infrastructure plus performante.</p>
  
  <h2>Ce qui a changé :</h2>
  <ul>
    <li>✅ Vos analyses sont conservées</li>
    <li>✅ Vos images sont conservées</li>
    <li>⚠️ Vous devrez réinitialiser votre mot de passe</li>
  </ul>
  
  <h2>Prochaines étapes :</h2>
  <ol>
    <li>Connectez-vous à MediScan</li>
    <li>Cliquez sur "Mot de passe oublié"</li>
    <li>Créez un nouveau mot de passe</li>
    <li>Profitez des nouvelles fonctionnalités !</li>
  </ol>
  
  <p>Merci de votre patience,<br>L'équipe MediScan</p>
</body>
</html>
```

## 🎯 Checklist de Migration

- [ ] Exporter les données Firebase
- [ ] Créer le projet Supabase
- [ ] Configurer la base de données
- [ ] Configurer l'authentification
- [ ] Configurer le stockage
- [ ] Migrer les utilisateurs
- [ ] Migrer les analyses
- [ ] Migrer les images
- [ ] Mettre à jour les URLs
- [ ] Vérifier la migration
- [ ] Notifier les utilisateurs
- [ ] Tester l'application
- [ ] Mettre en production
- [ ] Surveiller les erreurs
- [ ] Nettoyer les anciennes données

