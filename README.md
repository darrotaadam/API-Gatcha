# API-Gatcha

## Présentaiton:
Jeu type gatcha web utilisant 4 API Spring munie chacune d'une base de données MongoDB.
* `API_AUTH` : Gère l'authentification et la gestion des utilisateurs.
* `API_JOUEUR` : Gère les données des joueurs, avec leurs statistiques et leurs monstres.
* `API_MONSTRE` : Gère les données des monstres, avec leurs caractéristiques et leur stats.
* `API_INVOCATION` : Sert à déclencher une invocation, c'est à dire le tirage d'un monstre aléatoire pour un joueur.

## Build 
```
docker network create gatcha-lan
docker-compose up --build
```
