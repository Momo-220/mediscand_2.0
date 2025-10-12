# MediScan - Your Medication Analysis Assistant

MediScan is a simple and intuitive application that helps you identify your medications and obtain all important information about them. Simply take a photo of your medication, and our application will tell you everything you need to know!

## 📱 What You Can Do with MediScan

### 1. Analyze Your Medications
- Take a photo of your medication with your device
- Or upload an existing image
- Get all important information quickly

### 2. Get Detailed Information
- Medication name
- What it's used for
- How to take it
- Precautions to take
- Possible side effects
- Storage conditions

### 3. Manage Your History
- Create your personal account
- Save your analyses
- Easily find your previous analyses
- Access your history from any device

### 4. Ask Questions
- Use our PharmaAI assistant
- Ask questions about your medications
- Get clear and reliable answers
- Available 24/7

## 🚀 How to Use MediScan

### 1. First Time Use
1. Open the application in your browser
2. Create your account with your email
3. Confirm your email
4. Log in to your account

### 2. Analyze a Medication
1. Click the "Analyze" button
2. Choose between:
   - "Take a Photo" (use your camera)
   - "Upload an Image" (from your device)
3. Wait a few seconds during analysis
4. View detailed results

### 3. Check History
1. Click on "My History"
2. Find all your past analyses
3. Click on an analysis to see details

### 4. Use PharmaAI
1. Click the PharmaAI icon
2. Type your question
3. Receive a clear and precise answer

## 📋 Important Information

### Privacy
- Your data is secure and private
- Only you can access your history
- Photos are stored securely

### Precautions
- MediScan is an information aid tool
- Always consult your medication's package insert
- If in doubt, contact your healthcare professional
- Never modify your treatment without medical advice

### Accessibility
- Works on computer, tablet, and smartphone
- Interface adapted to all screens
- Simple and intuitive navigation
- Available in English and French

## 🆘 Need Help?

### In Case of Problems
- Check your internet connection
- Make sure your photo is clear and well-lit
- Try again if analysis fails
- Log out and log back in if problems persist

### Contact
For any questions or assistance:
- Use the "Help" section in the application
- Contact support via the contact form
- Consult our detailed user guide

## 🔒 Security and Privacy

We take your data protection seriously:
- Secure connection
- Encrypted data storage
- Compliance with privacy standards
- Protection of personal information

## 🔧 Technical Architecture

### Technologies Used

#### Frontend
- **Next.js 14**: Modern framework for smooth user experience
- **TypeScript**: For more reliable and maintainable code
- **Tailwind CSS**: For elegant and responsive design
- **Framer Motion**: For smooth animations
- **React Hot Toast**: For elegant notifications

#### Backend Services
- **Firebase**:
  - Authentication: Secure user management
  - Firestore: Database for storing analyses
  - Storage: Secure image storage
- **Google Gemini AI**: Artificial intelligence for medication analysis
- **API Routes Next.js**: For request processing

### Project Structure
```
mediscan/
├── src/
│   ├── app/                 # Application pages
│   │   ├── api/            # API endpoints
│   │   └── page.tsx        # Main page
│   ├── components/         # Reusable components
│   │   ├── Camera.tsx      # Photo capture component
│   │   ├── MediScan.tsx    # Main component
│   │   ├── PharmaAI.tsx    # AI Assistant
│   │   └── ...
│   ├── firebase/          # Firebase configuration
│   └── lib/              # Utilities
└── public/               # Static resources
```

### Technical Features
1. **Image Analysis**:
   - Webcam photo capture
   - Image upload
   - AI processing with Gemini Pro Vision
   - Text information extraction

2. **Data Management**:
   - Secure storage in Firestore
   - User session management
   - Analysis history
   - Automatic backup

3. **Security**:
   - Secure authentication
   - User data protection
   - Communication encryption
   - Firebase security rules

4. **Responsive Interface**:
   - Automatic adaptation to all screens
   - Mobile optimization
   - Dark mode management
   - Smooth animations

5. **Performance**:
   - Optimized loading
   - Smart caching
   - Image compression
   - Fast response time

---

**Important Note**: MediScan is an information tool and does not replace the advice of a healthcare professional. In case of doubt or medical questions, always consult your doctor or pharmacist.

---

[Version Française]

# MediScan - Votre Assistant d'Analyse de Médicaments

MediScan est une application simple et intuitive qui vous aide à identifier vos médicaments et à obtenir toutes les informations importantes à leur sujet. Prenez simplement une photo de votre médicament, et notre application vous dira tout ce que vous devez savoir !

## 📱 Ce que vous pouvez faire avec MediScan

### 1. Analyser vos Médicaments
- Prenez une photo de votre médicament avec votre appareil
- Ou téléchargez une image existante
- Obtenez rapidement toutes les informations importantes

### 2. Obtenir des Informations Détaillées
- Nom du médicament
- À quoi il sert
- Comment le prendre
- Précautions à prendre
- Effets secondaires possibles
- Conditions de conservation

### 3. Gérer votre Historique
- Créez votre compte personnel
- Sauvegardez vos analyses
- Retrouvez facilement vos analyses précédentes
- Accédez à votre historique depuis n'importe quel appareil

### 4. Poser vos Questions
- Utilisez notre assistant PharmaAI
- Posez vos questions sur vos médicaments
- Obtenez des réponses claires et fiables
- Disponible 24h/24, 7j/7

## 🚀 Comment Utiliser MediScan

### 1. Première Utilisation
1. Ouvrez l'application dans votre navigateur
2. Créez votre compte avec votre email
3. Confirmez votre email
4. Connectez-vous à votre compte

### 2. Analyser un Médicament
1. Cliquez sur le bouton "Analyser"
2. Choisissez entre :
   - "Prendre une Photo" (utilisez votre caméra)
   - "Télécharger une Image" (depuis votre appareil)
3. Attendez quelques secondes pendant l'analyse
4. Consultez les résultats détaillés

### 3. Consulter l'Historique
1. Cliquez sur "Mon Historique"
2. Retrouvez toutes vos analyses passées
3. Cliquez sur une analyse pour voir les détails

### 4. Utiliser PharmaAI
1. Cliquez sur l'icône PharmaAI
2. Tapez votre question
3. Recevez une réponse claire et précise

## 📋 Informations Importantes

### Confidentialité
- Vos données sont sécurisées et privées
- Seul vous pouvez accéder à votre historique
- Les photos sont stockées de manière sécurisée

### Précautions
- MediScan est un outil d'aide à l'information
- Consultez toujours la notice de vos médicaments
- En cas de doute, contactez votre professionnel de santé
- Ne modifiez jamais votre traitement sans avis médical

### Accessibilité
- Fonctionne sur ordinateur, tablette et smartphone
- Interface adaptée à tous les écrans
- Navigation simple et intuitive
- Disponible en français

## 🆘 Besoin d'Aide ?

### En cas de Problème
- Vérifiez votre connexion internet
- Assurez-vous que votre photo est nette et bien éclairée
- Réessayez si l'analyse échoue
- Déconnectez-vous et reconnectez-vous en cas de problème

### Contact
Pour toute question ou assistance :
- Utilisez la section "Aide" dans l'application
- Contactez le support via le formulaire de contact
- Consultez notre guide d'utilisation détaillé

## 🔒 Sécurité et Confidentialité

Nous prenons la protection de vos données très au sérieux :
- Connexion sécurisée
- Stockage crypté des données
- Respect des normes de confidentialité
- Protection des informations personnelles

---

**Note Importante** : MediScan est un outil d'information et ne remplace pas l'avis d'un professionnel de santé. En cas de doute ou de question médicale, consultez toujours votre médecin ou votre pharmacien.

---

## 🔧 Architecture Technique

### Technologies Utilisées

#### Interface Utilisateur (Frontend)
- **Next.js 14** : Framework moderne pour une expérience utilisateur fluide
- **TypeScript** : Pour un code plus fiable et maintenable
- **Tailwind CSS** : Pour un design élégant et responsive
- **Framer Motion** : Pour des animations fluides et agréables
- **React Hot Toast** : Pour des notifications élégantes

#### Services Backend
- **Supabase** :
  - Authentication : Gestion sécurisée des utilisateurs
  - PostgreSQL : Base de données pour stocker les analyses
  - Storage : Stockage sécurisé des images
- **Google Gemini AI** : Intelligence artificielle pour l'analyse des médicaments
- **API Routes Next.js** : Pour le traitement des requêtes

### Structure du Projet
```
mediscan/
├── src/
│   ├── app/                 # Pages de l'application
│   │   ├── api/            # Points d'entrée API
│   │   └── page.tsx        # Page principale
│   ├── components/         # Composants réutilisables
│   │   ├── Camera.tsx      # Composant de capture photo
│   │   ├── MediScan.tsx    # Composant principal
│   │   ├── PharmaAI.tsx    # Assistant IA
│   │   └── ...
│   ├── supabase/          # Configuration Supabase
│   └── lib/              # Utilitaires
└── public/               # Ressources statiques
```

### Fonctionnalités Techniques
1. **Analyse d'Images** :
   - Capture photo via webcam
   - Upload d'images
   - Traitement IA avec Gemini Pro Vision
   - Extraction d'informations textuelles

2. **Gestion des Données** :
   - Stockage sécurisé dans PostgreSQL (Supabase)
   - Gestion des sessions utilisateur
   - Historique des analyses
   - Sauvegarde automatique

3. **Sécurité** :
   - Authentification sécurisée
   - Protection des données utilisateur
   - Chiffrement des communications
   - Règles de sécurité Supabase

4. **Interface Responsive** :
   - Adaptation automatique à tous les écrans
   - Optimisation mobile
   - Gestion du mode sombre
   - Animations fluides

5. **Performance** :
   - Chargement optimisé
   - Mise en cache intelligente
   - Compression des images
   - Temps de réponse rapide
