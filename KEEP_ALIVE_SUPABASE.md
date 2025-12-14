# 🔄 Guide Keep-Alive pour Supabase

Ce guide explique comment maintenir votre projet Supabase actif en permanence, même sans activité sur le site.

## 📋 Problème

Les projets Supabase gratuits s'éteignent automatiquement après une période d'inactivité (généralement 7 jours). Cela peut causer des problèmes lorsque vous essayez d'utiliser votre application.

## ✅ Solution

Nous avons créé deux solutions pour maintenir Supabase actif :

### 1. Script Node.js (Recommandé pour développement local)

Un script qui envoie des requêtes périodiques à Supabase depuis votre machine.

#### Utilisation

```bash
# Exécuter le script keep-alive
npm run keep-alive
```

Le script va :
- Envoyer une requête toutes les 10 minutes par défaut
- Afficher les logs de chaque requête
- Continuer à fonctionner jusqu'à ce que vous l'arrêtiez (Ctrl+C)

#### Configuration

Vous pouvez personnaliser l'intervalle en ajoutant une variable d'environnement dans `.env.local` :

```env
# Intervalle en millisecondes (par défaut: 600000 = 10 minutes)
KEEP_ALIVE_INTERVAL=300000  # 5 minutes
```

#### Exécution en arrière-plan (Windows PowerShell)

```powershell
# Démarrer en arrière-plan
Start-Process node -ArgumentList "scripts/keep-alive-supabase.js" -WindowStyle Hidden

# Ou avec npm
Start-Process npm -ArgumentList "run", "keep-alive" -WindowStyle Hidden
```

#### Exécution en arrière-plan (Linux/Mac)

```bash
# Utiliser nohup
nohup npm run keep-alive > keep-alive.log 2>&1 &

# Ou utiliser pm2 (si installé)
pm2 start scripts/keep-alive-supabase.js --name supabase-keep-alive
```

### 2. Route API Next.js (Recommandé pour production)

Une route API que vous pouvez appeler depuis un service externe.

#### URL de la route

Si votre application est déployée sur `https://votre-app.com`, la route sera :
```
https://votre-app.com/api/keep-alive
```

#### Utilisation avec des services externes

##### Option A : UptimeRobot (Gratuit)

1. Créez un compte sur [UptimeRobot.com](https://uptimerobot.com)
2. Ajoutez un nouveau monitor :
   - Type : HTTP(s)
   - URL : `https://votre-app.com/api/keep-alive`
   - Intervalle : 5 minutes
3. UptimeRobot appellera automatiquement votre route toutes les 5 minutes

##### Option B : cron-job.org (Gratuit)

1. Créez un compte sur [cron-job.org](https://cron-job.org)
2. Créez un nouveau cron job :
   - URL : `https://votre-app.com/api/keep-alive`
   - Schedule : `*/10 * * * *` (toutes les 10 minutes)
3. Le service appellera automatiquement votre route

##### Option C : Vercel Cron (Si déployé sur Vercel)

Créez un fichier `vercel.json` à la racine :

```json
{
  "crons": [
    {
      "path": "/api/keep-alive",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

##### Option D : GitHub Actions (Gratuit)

Créez `.github/workflows/keep-alive.yml` :

```yaml
name: Keep Supabase Alive

on:
  schedule:
    - cron: '*/10 * * * *'  # Toutes les 10 minutes
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase
        run: |
          curl -X GET https://votre-app.com/api/keep-alive
```

## 🎯 Recommandations

### Pour le développement local
- Utilisez le script Node.js (`npm run keep-alive`)
- Laissez-le tourner pendant que vous développez

### Pour la production
- Déployez votre application (Vercel, Netlify, etc.)
- Configurez un service externe (UptimeRobot, cron-job.org) pour appeler `/api/keep-alive`
- Ou utilisez les crons natifs de votre plateforme de déploiement

## ⚠️ Notes importantes

1. **Intervalle recommandé** : 5-10 minutes est suffisant pour maintenir Supabase actif
2. **Coûts** : Les requêtes de keep-alive sont très légères et n'augmentent pas significativement vos coûts
3. **Sécurité** : La route API utilise la clé anonyme de Supabase, ce qui est sécurisé pour des requêtes de lecture simples
4. **Monitoring** : Surveillez les logs pour vous assurer que le keep-alive fonctionne correctement

## 🔍 Vérification

Pour vérifier que le keep-alive fonctionne :

1. **Script Node.js** : Les logs s'affichent dans la console
2. **Route API** : Testez manuellement :
   ```bash
   curl https://votre-app.com/api/keep-alive
   ```
   Vous devriez recevoir :
   ```json
   {
     "success": true,
     "message": "Supabase est actif",
     "timestamp": "2024-01-01T12:00:00.000Z"
   }
   ```

## 🆘 Dépannage

### Le script ne démarre pas
- Vérifiez que les variables d'environnement sont définies dans `.env.local`
- Assurez-vous que `dotenv` est installé : `npm install`

### La route API retourne une erreur
- Vérifiez que votre application est bien déployée
- Vérifiez les logs de votre plateforme de déploiement
- Assurez-vous que Supabase est accessible depuis votre serveur

### Supabase s'éteint quand même
- Vérifiez que le keep-alive fonctionne (logs ou monitoring)
- Réduisez l'intervalle (par exemple, 5 minutes au lieu de 10)
- Contactez le support Supabase si le problème persiste
