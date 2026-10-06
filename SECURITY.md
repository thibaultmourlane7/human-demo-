# Sécurité de la démo publique

Ce dépôt ne doit contenir aucun secret serveur, jeton privé, mot de passe, clé privée ou logique d'autorisation sensible.

La configuration frontend peut contenir la **Supabase publishable key** : elle est conçue pour être exposée dans le navigateur et ne donne aucun privilège serveur. La sécurité repose sur l'authentification, les RPC serveur contrôlées et les politiques RLS.

Restent exclusivement dans `human-internal` :

- migrations Supabase et politiques RLS ;
- Edge Functions et logique métier ;
- clés serveur et secrets ;
- logique de matching, vérification expert, pricing et dataset.

Avant chaque push :

```bash
npm run check:public
npm run build
```
