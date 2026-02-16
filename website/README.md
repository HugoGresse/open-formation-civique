# Formation Civique - Site Starlight

[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)

Site web de fiches thématiques pour la formation civique, généré à partir des données crawlées depuis [formation-civique.interieur.gouv.fr](https://formation-civique.interieur.gouv.fr/fiches-par-thematiques/).

## 📋 Prérequis

- Node.js 18+
- npm ou yarn

## 🚀 Démarrage rapide

### Installation

```bash
npm install
```

### Développement

Lancer le serveur de développement :

```bash
npm run dev
```

Le site sera accessible sur `http://localhost:4321`

### Build

Construire le site pour la production :

```bash
npm run build
```

### Preview

Prévisualiser le build de production :

```bash
npm run preview
```

## 📁 Structure

```
website/
├── src/
│   └── content/
│       └── docs/
│           ├── index.mdx                    # Page d'accueil
│           ├── principes-et-valeurs/        # Thématique 1
│           ├── systeme-institutionnel/      # Thématique 2
│           ├── droits-et-devoirs/           # Thématique 3
│           ├── histoire-geographie-culture/ # Thématique 4
│           └── vivre-en-france/             # Thématique 5
├── generate-pages.js                        # Script de génération
└── astro.config.mjs                         # Configuration Starlight
```

## 🔄 Régénération des pages

Pour régénérer toutes les pages à partir du fichier JSON source :

```bash
npm run generate
```

Ce script :
1. Lit les données depuis `../crawler/formation-civique-data.json`
2. Organise les fiches par thématique
3. Génère les fichiers markdown dans `src/content/docs/`
4. Crée la page d'accueil avec les 5 thématiques

## 📚 Les 5 thématiques

1. **Principes et valeurs de la République** - Devise, symboles et laïcité
2. **Système institutionnel et politique** - Démocratie, séparation des pouvoirs, institutions
3. **Droits et devoirs** - Droits fondamentaux et obligations
4. **Histoire, géographie et culture** - Histoire de France, géographie, culture
5. **Vivre dans la société française** - Démarches administratives, santé, emploi, parentalité

## 📊 Statistiques

- **170 pages** générées automatiquement
- **5 thématiques** principales
- **169 fiches** de contenu

## 🛠️ Technologies

- [Astro](https://astro.build) - Framework web moderne
- [Starlight](https://starlight.astro.build) - Thème de documentation pour Astro
- [Sharp](https://sharp.pixelplumbing.com) - Optimisation d'images

## 📄 License

Les contenus sont issus du site officiel formation-civique.interieur.gouv.fr
