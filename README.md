# API-Gatcha

## Présentaiton:
Jeu type gatcha web utilisant 4 API Spring munie chacune d'une base de données MongoDB.
* `API_AUTH` : Gère l'authentification et la gestion des utilisateurs.
* `API_JOUEUR` : Gère les données des joueurs, avec leurs statistiques et leurs monstres.
* `API_MONSTRE` : Gère les données des monstres, avec leurs caractéristiques et leur stats.
* `API_INVOCATION` : Sert à déclencher l'invocation, d'un monstre aléatoire pour un joueur.

## Lancer le projet :
* `git clone --recurse-submodules https://github.com/darrotaadam/API-Gatcha.git`
* `cd API-Gatcha`
* `docker network create gatcha-lan`
* `docker-compose up --build`
* `npx serve  .` ou `python3 -m http.server` 

