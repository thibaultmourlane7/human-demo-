# HUMAN BÂTIMENT Sprint 12 — PWA

Statut : CODE UNIQUEMENT SUR feature/s12-pwa, non déployé, installation manuelle non vérifiée.

## Réalisé
- Manifeste d'installation, identité HUMAN et icône SVG.
- Service worker statique : application-shell, CSS, JS et images du site.
- Jamais de cache des réponses Supabase/Stripe, documents de mission ou jetons.
- Enregistrement après load, uniquement en build de production.
- Proposition facultative d'installation pour navigateurs compatibles.

## En attente
- Vérification installation mobile et desktop, fonctionnement offline, iOS Safari.
- Icônes PNG 192 et 512 px / icône maskable à préparer pour compatibilité étendue.
- Éventuels liens de notifications push, qui nécessitent une validation séparée.
- Parcours métier Bâtiment à activer uniquement après les migrations et RPC dédiées.

## Garde-fous
- Les tests automatisés vérifient structure/cache ; les tests manuels restent dans le registre.
- Aucun nouveau paiement ni déploiement, aucune modification de main.
- Réévaluer manifest id, start_url et scope lors de la migration du domaine.
