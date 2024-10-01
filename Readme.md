# ntorrent Client

Ceci est une implémentation basique d'un client Bittorrent.

## Fonctionnement d'un torrent
-   Envoyer une première requête à un tracker et ce dernier répond avec une liste de peer qui correspond aux adresses ip des utilisateurs ayant le fichier à télécharger.
-   Se connecter ensuite aux peers et commencer les téléchargements.

### Connection au tracker
L'url du tracker est contenu dans la clé 'announce' dans les métadonnées du torrent
Envoyer une requête GET au tracker avec commme params:
- info_hash: hash sha1 de la propriété info du torrent
- peer_id: identifié unique généré pour chaque client bittorrent
- left: la quantité restante de donnée à télécharger

Une fois la requête bien formatée est envoyée, le tracker renvoie un dictionnaire bencode. On peut y trouver:

-  peers: Une liste de dictionnaire contennant le peer id, le port et l'ip
- ...

### Téléchargement à partir des peers
- Créer une connection tcp avec la liste des peers (plus il y a de peers plus rapide est le téléchargement).
- Envoyer un handshake au peer (Le Handshake est le premier message a envoyé au peer une fois la connection établie. Il doit être composé du info_hash, du peer_id, pstrlen, pstr, reserved)
- Demander les morceaux de fichiers voulus aux peers
- Écrire sur les morceaux de données sauvegardés en mémoire sur disque


# Comment l'utiliser ?
 
1- Installer les dépendances avec **npm install**

2- 

3- 