# HUMAN — Public Demo

Interface publique de HUMAN : une infrastructure permettant à une IA ou à un utilisateur d'escalader une question vers un expert humain qualifié.

## Sprint 4

La démo est maintenant reliée au vrai projet Supabase HUMAN avec uniquement des éléments prévus pour le navigateur :

- inscription / connexion Supabase Auth ;
- création d'une mission réelle ;
- déclenchement du matching ;
- historique des missions utilisateur ;
- création du profil expert ;
- état de vérification et disponibilité ;
- propositions de missions ;
- accepter / refuser ;
- démarrer une intervention ;
- envoyer la réponse experte ;
- validation et clôture côté utilisateur.

Le frontend ne contient ni migrations, ni logique de pricing, ni logique dataset, ni clé serveur. Toutes les commandes métier passent par l'Edge Function privée `human-command`.

## Lancer

```bash
npm install
npm run check:public
npm run dev
```

La Supabase publishable key est une configuration frontend publique. Les clés serveur ne doivent jamais apparaître dans ce dépôt.
