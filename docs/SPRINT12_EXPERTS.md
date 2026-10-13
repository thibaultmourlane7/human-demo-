# HUMAN BÂTIMENT — expert métier + validation administrateur

Statut: composant préparé et compilé sur branches de travail ; fonctionnalité **désactivée** par défaut.

## Interface expert
- L'inscription d'un nouvel expert peut proposer la spécialité Bâtiment, uniquement si la fonctionnalité est active.
- Après création du profil, l'expert choisit les métiers du bâtiment déclarés.
- La déclaration n'atteste **aucune** qualification. Chaque métier doit être approuvé par un administrateur.

## Interface administrateur
- Consultation du tableau des qualifications déclarées.
- L'administrateur doit d'abord vérifier le profil général et les justificatifs de qualification.
- Validation explicite métier par métier ; possibilité de retrait avec motif.
- Chaque décision effective est journalisée dans la base par le backend.
- Un expert non vérifié globalement ne peut pas être approuvé par métier.

## Conditions techniques
Activation seulement avec les trois drapeaux explicitement vrais :
- `VITE_HUMAN_BUILDING_PREVIEW`
- `VITE_HUMAN_BUILDING_API_ENABLED`
- `VITE_HUMAN_BUILDING_EXPERT_ENABLED`

L'interface appelle `human-command`, qui vérifie le JWT. Les migrations préparatoires 008 et 009 sont indispensables pour exécuter les actions ; elles **n'ont pas été appliquées à Supabase**.

Aucune connexion expert réelle ni contrôle manuel de diplôme/assurance réalisés, aucun paiement lancé, aucune fonctionnalité publiée. Les contrôles automatiques sont nécessaires mais ne remplacent pas le contrôle des accès en base.
