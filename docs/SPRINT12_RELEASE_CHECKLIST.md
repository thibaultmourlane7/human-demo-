# HUMAN BÂTIMENT — Sprint 12 / Candidat PWA et applications mobiles

Date : 13 octobre 2026. Statut : **code préparé et contrôlé, pas de mise en service**.

## Réalisé et vérifié en CI
- PWA Bâtiment : création explicite d'un brouillon (feature-gated), choix des 12 métiers, documents PDF/photo privés après enregistrement, sans envoi automatique.
- Parcours expert Bâtiment : déclaration de chaque spécialité sans auto-homologation.
- Administration : décision métier par métier, retrait motivé.
- Chiffrage et réservation : fonctionnalités Bâtiment OFF par défaut ; bouton explicite de recherche d'expert après réservation, jamais avant.
- `.env.example` : les cinq variables de fonctionnalité Bâtiment sont fixées à `false` et surveillées par la CI.
- Android : projet Capacitor généré et APK Debug compilé en CI.
- iOS : projet Capacitor généré et application simulateur compilée sans signature en CI.
- Dépendances natives verrouillées par `package-lock.json` et installées avec `npm ci`.
- Authentification : connexion par e-mail/mot de passe conservée ; traitement automatique des URL OAuth bloqué dans les WebViews natives en l'absence de liens profonds validés.

## Non terminé / exige une validation distincte
- Supabase réel n'a pas les migrations S10–S12 : les fonctions Bâtiment ne sont donc pas actives.
- Aucun test humain du parcours et aucun upload de document réel dans l'environnement HUMAN.
- Aucun OAuth natif ou connexion réelle ChatGPT/Claude finalisée.
- Aucun IPA de distribution, signature Apple, artefact Play Store ou installation sur appareil.
- Paiement réel, RLS sur Supabase staging et barème métier restent à valider.

## Conditions d'activation
Un compte de staging Supabase **distinct du projet HUMAN réel** et ses URL/clés publiques propres sont requis. Les flags de l'exemple restent `false`. Ne les activer qu'après tests SQL et API, contrôle des autorisations, validation des prix, RGPD et autorisation explicite.

**Ne pas déployer, pousser sur main, publier ou déclencher un vrai paiement sans instruction séparée.**
