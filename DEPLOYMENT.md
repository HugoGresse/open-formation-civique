# 🚀 Guide de déploiement GitHub Pages

Ce guide vous accompagne étape par étape pour déployer le site sur GitHub Pages.

## ✅ Prérequis

- Un compte GitHub
- Git installé localement
- Node.js 18+ installé

## 📝 Étapes de déploiement

### 1. Vérifier la configuration Astro

Ouvrez [fiches/astro.config.mjs](fiches/astro.config.mjs) et vérifiez les paramètres :

```javascript
export default defineConfig({
  site: 'https://VOTRE-USERNAME.github.io',
  base: '/VOTRE-REPO-NAME',
  // ...
});
```

**Exemples :**
- Pour `https://github.com/hugogresse/open-formation-civique`
  - `site: 'https://hugogresse.github.io'`
  - `base: '/open-formation-civique'`

- Pour un domaine personnalisé `https://formation.example.com`
  - `site: 'https://formation.example.com'`
  - `base: '/'`

### 2. Initialiser le repository Git (si nécessaire)

Si ce n'est pas déjà fait :

```bash
# Dans le dossier racine du projet
git init
git add .
git commit -m "Initial commit: crawler + Starlight site"
git branch -M main
```

### 3. Créer le repository sur GitHub

1. Allez sur https://github.com/new
2. Nommez votre repository (ex: `open-formation-civique`)
3. Ne cochez PAS "Initialize with README" (vous en avez déjà un)
4. Cliquez sur "Create repository"

### 4. Lier votre repository local à GitHub

```bash
git remote add origin https://github.com/VOTRE-USERNAME/VOTRE-REPO.git
git push -u origin main
```

### 5. Activer GitHub Pages

1. Allez dans votre repository sur GitHub
2. Cliquez sur **Settings** (Paramètres)
3. Dans le menu de gauche, cliquez sur **Pages**
4. Sous **Source**, sélectionnez **"GitHub Actions"**
5. Cliquez sur **Save**

![GitHub Pages Settings](https://docs.github.com/assets/cb-47267/mw-1440/images/help/pages/publishing-source-drop-down.webp)

### 6. Déclencher le premier déploiement

Le déploiement se fait automatiquement au push. Si vous venez de pousser, le workflow devrait déjà être en cours :

1. Allez dans l'onglet **Actions** de votre repository
2. Vous devriez voir le workflow "Deploy to GitHub Pages" en cours
3. Attendez qu'il termine (🟢 vert = succès)

Si aucun workflow n'est en cours, vous pouvez en déclencher un manuellement :
1. Onglet **Actions**
2. Sélectionnez "Deploy to GitHub Pages"
3. Cliquez sur **Run workflow** > **Run workflow**

### 7. Accéder à votre site

Une fois le déploiement terminé (après 2-5 minutes) :

🌐 Votre site est accessible à : **https://VOTRE-USERNAME.github.io/VOTRE-REPO-NAME/**

Exemple : `https://hugogresse.github.io/open-formation-civique/`

## 🔄 Mises à jour automatiques

Maintenant, chaque fois que vous poussez du code sur la branche `main`, le site se met à jour automatiquement :

```bash
# Après avoir modifié des fichiers
git add .
git commit -m "Description de vos modifications"
git push
```

Le workflow GitHub Actions va :
1. ✅ Installer les dépendances
2. ✅ Générer les pages depuis le JSON
3. ✅ Builder le site Astro
4. ✅ Déployer sur GitHub Pages

## 🐛 Dépannage

### Le déploiement échoue

1. Vérifiez les logs dans l'onglet **Actions**
2. Problèmes courants :
   - ❌ Erreur de build : vérifiez que `npm run build` fonctionne en local
   - ❌ Permissions : vérifiez que Pages est activé dans Settings

### Le site affiche une page 404

- Vérifiez que `base` dans `astro.config.mjs` correspond au nom de votre repo
- Attendez 5-10 minutes après le premier déploiement

### Les liens/CSS ne fonctionnent pas

- Problème de `base` dans la config
- Vérifiez que tous vos liens utilisent des chemins relatifs ou incluent le base path

## 📱 Domaine personnalisé (optionnel)

Pour utiliser votre propre domaine :

1. Dans Settings > Pages, ajoutez votre domaine personnalisé
2. Configurez vos DNS :
   ```
   Type: CNAME
   Name: www (ou votre sous-domaine)
   Value: VOTRE-USERNAME.github.io
   ```
3. Mettez à jour `astro.config.mjs` :
   ```javascript
   site: 'https://votre-domaine.com',
   base: '/',
   ```

## 📚 Ressources

- [Documentation GitHub Pages](https://docs.github.com/pages)
- [Documentation Astro - Déploiement](https://docs.astro.build/en/guides/deploy/github/)
- [Documentation Starlight](https://starlight.astro.build/)

## ✨ C'est tout !

Votre site est maintenant en ligne et se met à jour automatiquement ! 🎉
