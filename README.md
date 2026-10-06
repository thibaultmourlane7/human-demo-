# HUMAN — Public Demo

Démo publique du concept HUMAN : une IA peut escalader une question vers un expert humain vérifié.

## Important

Ce dépôt est volontairement **sans backend réel, sans clé privée, sans schéma Supabase sensible et sans donnée utilisateur réelle**.

Le dépôt privé `human-internal` contient les migrations, les politiques RLS et la future logique serveur.

## Sprint 1

- React + TypeScript + Vite
- parcours visuel utilisateur → HUMAN → expert
- matching simulé localement
- réponse expert simulée
- contrôle automatisé empêchant l'ajout de secrets et de chemins privés

## Lancer localement

```bash
npm install
npm run check:public
npm run dev
```

Ne jamais ajouter de secret dans une variable `VITE_*` : tout ce qui est exposé au frontend est public.
