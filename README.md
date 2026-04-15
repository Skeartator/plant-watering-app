# 🌿 Arrosage des Plantes

Suivi d'arrosage de plantes avec météo en temps réel à La Ciotat + notifications push chaque matin à 8h.

## Stack

- **Next.js 14** App Router
- **SQLite** via `better-sqlite3`
- **Open-Meteo API** (gratuit, sans clé) — météo à La Ciotat
- **web-push** — notifications VAPID
- **Vercel Cron** — rappel automatique à 8h Paris

---

## Développement local

```bash
# 1. Installer les dépendances
npm install

# 2. Copier le fichier d'environnement
cp .env.example .env.local

# 3. Générer les clés VAPID
npx web-push generate-vapid-keys
# Copier les clés dans .env.local

# 4. Compléter .env.local
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<votre_clé_publique>
VAPID_PRIVATE_KEY=<votre_clé_privée>
VAPID_EMAIL=mailto:votre@email.com
CRON_SECRET=un_secret_aleatoire_long

# 5. Lancer le serveur de dev
npm run dev
```

L'app est disponible sur [http://localhost:3000](http://localhost:3000).

La base de données SQLite (`plants.db`) est créée automatiquement à la racine du projet.

---

## Déploiement sur Vercel

### 1. Pousser le code sur GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/vous/plant-watering.git
git push -u origin main
```

### 2. Importer sur Vercel

1. Aller sur [vercel.com](https://vercel.com) → **New Project**
2. Importer votre dépôt GitHub
3. Framework preset : **Next.js** (détecté automatiquement)

### 3. Variables d'environnement

Dans **Settings → Environment Variables** de votre projet Vercel, ajouter :

| Variable | Valeur |
|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Clé publique VAPID |
| `VAPID_PRIVATE_KEY` | Clé privée VAPID |
| `VAPID_EMAIL` | `mailto:votre@email.com` |
| `CRON_SECRET` | Chaîne aléatoire secrète |

### 4. Générer les clés VAPID

```bash
npx web-push generate-vapid-keys
```

Copiez les deux clés dans les variables d'environnement Vercel.

### 5. Déployer

Cliquez sur **Deploy**. Le Vercel Cron est configuré automatiquement via `vercel.json`.

---

## Cron Job

Le fichier `vercel.json` configure l'exécution quotidienne :

```json
{
  "crons": [
    {
      "path": "/api/cron/notify",
      "schedule": "0 7 * * *"
    }
  ]
}
```

- `0 7 * * *` = **7h00 UTC** = **8h00 Paris (hiver CET)**
- En été (CEST, UTC+2) : ajustez à `0 6 * * *` pour garder 8h Paris

Vercel envoie automatiquement l'en-tête `Authorization: Bearer {CRON_SECRET}`.

### Tester le cron manuellement

```bash
curl -H "Authorization: Bearer votre_secret" https://votre-app.vercel.app/api/cron/notify
```

---

## Limitation SQLite sur Vercel

> **Important** : sur Vercel, le système de fichiers est **éphémère**. La base SQLite est stockée dans `/tmp` qui persiste entre les invocations chaudes d'une même instance, mais est réinitialisée entre les déploiements et les démarrages à froid.

**Pour un usage personnel/léger**, c'est généralement acceptable : si vous accédez à l'app régulièrement, l'instance reste chaude.

**Pour une persistance garantie**, considérez :
- [Turso](https://turso.tech) — SQLite distribué via HTTP (plan gratuit généreux)
- [Neon](https://neon.tech) — PostgreSQL serverless gratuit

---

## Routes API

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/plants` | Liste toutes les plantes |
| `POST` | `/api/plants` | Ajoute une plante |
| `DELETE` | `/api/plants?id=X` | Supprime une plante |
| `POST` | `/api/water/[id]` | Marque une plante comme arrosée |
| `POST` | `/api/subscribe` | Enregistre une subscription push |
| `DELETE` | `/api/subscribe` | Supprime une subscription push |
| `GET` | `/api/cron/notify` | Déclenché par Vercel Cron à 8h |

---

## Météo

L'API [Open-Meteo](https://open-meteo.com) est utilisée — **gratuite, sans clé API**.

Coordonnées : La Ciotat (lat 43.17, lon 5.61).

La recommandation d'arrosage se base sur `precipitation_sum` de la prévision journalière :
- Si pluie prévue **> 1 mm** → pas besoin d'arroser
