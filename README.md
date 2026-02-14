# Open Formation Civique

Crawler et site web de fiches thématiques pour la formation civique française, basé sur les contenus de [formation-civique.interieur.gouv.fr](https://formation-civique.interieur.gouv.fr/fiches-par-thematiques/).

## 📁 Structure du projet

```
.
├── crawler/                    # Crawler pour extraire les données
│   ├── formation-civique-data.json
│   └── ...
└── fiches/                     # Site web Starlight
    ├── src/content/docs/
    ├── generate-pages.js
    └── ...
```

## 🚀 Démarrage rapide

### Crawler

Le crawler extrait toutes les fiches depuis le site officiel et les sauvegarde en JSON.

```bash
cd crawler
npm install
npm run start
```

### Site web

Le site web Starlight est généré automatiquement à partir des données JSON.

```bash
cd fiches
npm install
npm run generate  # Génère les pages depuis le JSON
npm run dev       # Lance le serveur de développement
```

Le site sera accessible sur `http://localhost:4321`

## 🌐 Déploiement sur GitHub Pages

Le site est configuré pour être déployé automatiquement sur GitHub Pages via GitHub Actions.

### Configuration requise

1. **Créer un repository GitHub** (si ce n'est pas déjà fait) :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/VOTRE-USERNAME/VOTRE-REPO.git
   git push -u origin main
   ```

2. **Activer GitHub Pages** :
   - Allez dans Settings > Pages de votre repository
   - Sous "Source", sélectionnez "GitHub Actions"

3. **Vérifier la configuration** :
   - Dans [fiches/astro.config.mjs](fiches/astro.config.mjs), vérifiez que :
     - `site` correspond à `https://VOTRE-USERNAME.github.io`
     - `base` correspond à `/VOTRE-REPO-NAME`
   - Si vous utilisez un domaine personnalisé, ajustez `site` en conséquence

### Déploiement automatique

Une fois configuré, chaque push sur la branche `main` déclenchera automatiquement :
1. L'installation des dépendances
2. La génération des pages depuis le JSON
3. Le build du site Astro
4. Le déploiement sur GitHub Pages

Le site sera accessible à : `https://VOTRE-USERNAME.github.io/VOTRE-REPO-NAME/`

### Déploiement manuel

Vous pouvez aussi déclencher un déploiement manuellement :
- Allez dans l'onglet "Actions" de votre repository
- Sélectionnez le workflow "Deploy to GitHub Pages"
- Cliquez sur "Run workflow"

## 📊 Données

- **Source** : formation-civique.interieur.gouv.fr
- **Format** : JSON structuré avec 5 thématiques principales
- **Dernière mise à jour** : Voir `crawledAt` dans [crawler/formation-civique-data.json](crawler/formation-civique-data.json)

### Les 5 thématiques

1. **Principes et valeurs de la République** - Devise, symboles et laïcité
2. **Système institutionnel et politique** - Démocratie, séparation des pouvoirs, institutions
3. **Droits et devoirs** - Droits fondamentaux et obligations
4. **Histoire, géographie et culture** - Histoire de France, géographie, culture
5. **Vivre dans la société française** - Démarches administratives, santé, emploi, parentalité

## 🛠️ Technologies

### Crawler
- [Crawlee](https://crawlee.dev/) - Framework de web scraping
- [Cheerio](https://cheerio.js.org/) - Parser HTML
- [Turndown](https://github.com/mixmark-io/turndown) - Conversion HTML → Markdown

### Site web
- [Astro](https://astro.build) - Framework web moderne
- [Starlight](https://starlight.astro.build) - Thème de documentation
- [Sharp](https://sharp.pixelplumbing.com) - Optimisation d'images

## 📝 Mise à jour des données

Pour mettre à jour le contenu du site avec les dernières données :

```bash
# 1. Crawler les nouvelles données
cd crawler
npm run start

# 2. Régénérer les pages du site
cd ../fiches
npm run generate

# 3. Vérifier en local
npm run dev

# 4. Commit et push (déclenche le déploiement automatique)
git add .
git commit -m "Update content"
git push
```

## 📄 License

Les contenus sont issus du site officiel formation-civique.interieur.gouv.fr et restent la propriété du Ministère de l'Intérieur français.

Ce projet est un outil open source de présentation et de consultation de ces contenus publics.
