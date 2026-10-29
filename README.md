# Piko Turbo

Petit jeu de plateforme dans le navigateur, pour Harrison. Piko est un hérisson bleu original, Nox un hérisson violet tout aussi original. Tout le pixel art est dessiné à la main dans le code (palettes et lignes de caractères), les sons sont générés, aucun personnage, image ou musique d'éditeur, aucun appel réseau.

## Jouer

Sur l'écran titre, choisis Piko ou Nox (le choix est gardé pour la prochaine fois).

- Flèches gauche et droite : courir.
- Espace ou flèche haut : sauter. Chaque saut roule le héros en boule.
- Quand il va très vite (tapis orange, élan dans une descente, sortie de looping), il se met en boule tout seul. La boule garde sa vitesse et accélère dans les descentes, puis il se relève quand il ralentit.
- Flèche bas en courant (clavier seulement) : se mettre en boule exprès.
- Maj (Nox seulement) : l'éclair, un petit élan vers l'avant. Il se recharge en une seconde et demie.
- Échap ou P : pause. M : couper le son.

Sur une tablette, en paysage, les gros boutons Gauche, Droite, Éclair et Saut font la même chose. Pause et son sont en haut à droite.

Une boule ou un éclair fait éclater les boules orange (elles reviennent un peu plus tard). Tomber dans l'eau ou toucher une boule orange debout ramène au dernier drapeau, avec tous les anneaux. Il n'y a pas de défaite.

Cinq niveaux d'environ deux minutes : La prairie, La colline, Le looping, La plage, La nuit étoilée. Chaque niveau a quatre drapeaux, des pierres pour traverser l'eau, des ressorts, des ponts et un tapis orange qui donne un coup de vitesse. Pour un looping, il faut arriver vite, en général juste après un tapis orange.

Sers le dossier (GitHub Pages, ou `python3 -m http.server`) et ouvre la racine. Un double-clic sur `index.html` peut bloquer les modules du jeu.

## Tests

```bash
npm ci
npx playwright install chromium
npm test
npm run smoke
```

`npm test` vérifie la physique, les dessins et les niveaux : un robot qui tient la flèche droite et saute aux trous finit chaque niveau, avec Piko et avec Nox, sans tomber, en 70 à 170 secondes, avec au plus 35 secondes entre deux drapeaux. Si le navigateur de Playwright ne peut pas être téléchargé, `PW_CHROMIUM=/chemin/vers/chrome npm run smoke` utilise un Chromium déjà installé.

## Dessins

Les sprites sont dans `js/sprites/` : `piko.js` et `nox.js` pour les héros, `hero.js` pour les poses communes, `world.js` pour le reste. `node tools/render-sprites.mjs` refait les planches de `docs/sprites/` à partir des mêmes données. `tools/capture-report.mjs` prend les captures d'écran du rapport de PR.

## GitHub Pages

Le site est statique à la racine (`index.html`). Deux façons de le publier, une seule suffit :

- Réglage du dépôt : Pages, branche `master`, dossier `/ (root)`.
- Le workflow `.github/workflows/pages.yml`, qui déploie à chaque push sur `master` ou `main`.

Si les deux sont actifs, garde-en un seul.
