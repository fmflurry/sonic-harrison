# Piko Turbo

Petit jeu de plateforme dans le navigateur, pour Harrison. Piko est un hérisson bleu original : dessins faits dans la page, sons générés, aucun personnage ni musique d'éditeur.

## Jouer

Les flèches gauche et droite font courir. Espace ou la flèche haut fait sauter. Sur une tablette, en paysage, les gros boutons Gauche, Droite et Saut font la même chose.

Tomber dans l'eau ou toucher une boule orange ramène au dernier drapeau. Piko garde ses anneaux. Il n'y a pas de défaite.

Trois niveaux courts : La prairie, La colline, Le looping. Le tapis orange donne un coup de vitesse. Dans le looping, Piko prend le grand cercle s'il va vite. S'il va doucement, le chemin au sol continue jusqu'à l'arrivée.

Sers le dossier (GitHub Pages, ou `python3 -m http.server`) et ouvre la racine. Un double-clic sur `index.html` peut bloquer les modules du jeu.

## Tests

```bash
npm ci
npx playwright install chromium
npm test
npm run smoke
```

## GitHub Pages

Le site est statique à la racine (`index.html`). Deux façons de le publier, une seule suffit :

- Réglage du dépôt : Pages, branche `master`, dossier `/ (root)`.
- Le workflow `.github/workflows/pages.yml`, qui déploie à chaque push sur `master` ou `main`.

Si les deux sont actifs, garde-en un seul.
