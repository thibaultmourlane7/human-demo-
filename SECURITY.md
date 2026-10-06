# Sécurité de la démo publique

Ce dépôt ne doit contenir aucun secret, jeton, clé de service, mot de passe, URL de base privée ou logique d'autorisation sensible.

Les éléments suivants restent dans le dépôt privé :

- migrations Supabase ;
- politiques RLS ;
- Edge Functions ;
- clés et configuration serveur ;
- logique de matching réelle ;
- vérification d'experts ;
- paiements et commissions ;
- données utilisateurs.

Avant chaque push, exécuter :

```bash
npm run check:public
```
