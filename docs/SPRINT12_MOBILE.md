# HUMAN BÂTIMENT Sprint 12 — Android / iOS

Status: compilations CI Android Debug et iOS Simulator validées ; aucune installation sur appareil ni signature/distribution.
Cette branche descend de feature/s12-pwa pour réutiliser le frontend.

## Réalisé
- capacitor.config.ts : identifiant fr.human.batiment, nom HUMAN Bâtiment, webDir dist,
  aucune URL distante (le code React sera embarqué et non chargé d'un serveur extérieur).
- Détection de l'environnement web / iOS / Android et indicateur non intrusif.
- Adaptations safe-area/ergonomie tactile pour petit écran.
- Audit statique bloquant l'activation fictive des notifications, paiements ou stockage offline confidentiel.
- Aucun plugin payant installé ni backend dupliqué.

## Construction locale après validation des environnements
1. Sur une machine autorisée avec Node 22 : npm install (verrouiller ensuite les dépendances avec package-lock.json avant toute livraison).
2. Capacitor Core/CLI/Android/iOS sont déclarés à la version 8.5.3 dans package.json.
   Le package-lock.json est désormais versionné ; utiliser npm ci sur un environnement de build autorisé.
3. npm run mobile:android:init / npm run mobile:ios:init (dans les environnements adaptés).
4. npm run mobile:sync, ouvrir Android Studio / Xcode.
5. Configurer Universal Links/App Links et les redirections Supabase Auth spécifiques
   AVANT toute vraie connexion OAuth ou accès aux dossiers.
6. Compiler et tester sur émulateur ou appareil; ne jamais annoncer cette étape
   validée avant son exécution.

## Non réalisé
- Répertoires natifs générés temporairement par GitHub Actions, pas encore versionnés dans le dépôt.
- Configuration réelle des identifiants, domaine, secrets publics et autorisations natives non validée.
- Builds natifs de validation CI réussis ; aucun TestFlight, Google Play, IPA signée, APK installé ni essai sur appareil.
- Aucun accès photo natif ni push (fonctionnalités futures soumises à
  permissions explicites et vérification de sécurité).
- Tests manuels reportés dans le registre central.

## Attention
Les sessions Supabase actuelles sont adaptées au navigateur. Leur persistence,
leurs URL de rappel et la protection des secrets devront être revues pour l'usage WebView.
Ne jamais copier de secret Stripe ou clé d'administration Supabase dans l'application.

## Parcours artisan local (aperçu facultatif)
- Composant BuildingIntakeDraft ajouté avec métier, question, contexte, 5 pièces jointes locales.
- L'activation de l'aperçu est conditionnée à VITE_HUMAN_BUILDING_PREVIEW=true.
- Aucun upload, aucune création de mission ni débit de crédit : la fonctionnalité métier n'est pas encore déployée.


## Dernière mise à jour
Les dépendances Capacitor 8.5.3 et le lockfile npm sont versionnés. Les contrôles GitHub valident désormais le build web, la génération Android/iOS, l'APK Debug et la compilation iOS Simulator ; aucun test matériel ni signature de distribution.

## Harmonisation PWA/mobile (13 octobre 2026)
- Même formulaire Bâtiment et même contrat de brouillon que la branche PWA (retour du métier exact obligatoire).
- Sélection de fichiers locale : jamais téléversée par ce formulaire ; modification du dossier annule la confirmation de sauvegarde précédente.
- Le service worker ne conserve que le shell et les ressources publiques explicitement autorisées ; test automatisé de rejet des chemins privés.
- Lockfile versionné et compilations natives CI confirmées ; les tests sur appareil et la configuration d'authentification restent à faire.
- Redirections/authentification natives, stockage photos, notifications et stores restent à tester après validation distincte.

## Mise à jour — verrouillage des dépendances (13 octobre 2026)

- Le `package-lock.json` a été **généré par npm sur GitHub Actions avec Node 22**, puis committé sur `feature/s12-mobile`.
- La validation CI utilise désormais `npm ci` plutôt que `npm install`, afin de refuser les divergences entre le manifeste et le verrou de dépendances.
- Les quatre dépendances Capacitor (core, CLI, iOS, Android) restent à la version épinglée 8.5.3.
- Cette étape garantit un jeu de dépendances npm reproductible ; elle ne remplace pas la génération Android/iOS, les tests d'appareils, la signature et les validations des stores.
- **Aucun projet natif n'a été généré ou compilé** par cette étape.


## Contrôle Capacitor Android — GitHub Actions (13 octobre 2026)

- La génération **temporaire** du projet Android par `npx cap add android` a été exécutée dans le runner CI, avec succès.
- Contrôles confirmés : `android/app/src/main/AndroidManifest.xml` et `android/settings.gradle` créés dans l'environnement de test, après `npm ci` et build web.
- La génération était un **smoke test** : le dossier natif n'a **pas** été committé au dépôt, et aucun APK/AAB n'a été compilé, signé, installé ou publié.
- Le projet iOS a ensuite été généré et compilé pour simulateur sur GitHub Actions macOS 26, sans signature ni App Store.
- Les vérifications d'authentification mobile, stockage natif et notifications restent en attente.

## Compilation Android de débogage automatisée — contrôlée sur GitHub Actions

La tâche GitHub Actions `38355346249` a exécuté avec succès :
- `npm ci`, contrôles de confidentialité, tests de verrouillage financier et `npm run build` ;
- installation de Java 21 et Android SDK API 36 ;
- `npx cap add android` pour générer le projet natif dans le runner ;
- `./gradlew :app:assembleDebug --no-daemon` puis confirmation de l'APK non vide.

Cette compilation confirme un projet Android débogage générable sur l'infrastructure CI, **pas** une application testée sur téléphone ou prête pour Play Store. Le fichier APK de cette exécution n'a pas été publié ni enregistré dans le dépôt et il n'y a pas eu de signature de distribution. Pas de génération ni de build Xcode iOS.

## Vérification iOS et protection des connexions — 13 octobre 2026

- GitHub Actions iOS Simulator réussi : exécution **38358942485** sur `feature/s12-mobile`, avec Xcode 26+, Swift Package Manager, `npx cap add ios`, `npx cap sync ios` et `xcodebuild` sans signature.
- GitHub Actions Android Debug réussi : exécution **38355346249** avec Java 21, Android API 36 et vérification d'un APK généré non vide.
- Les compilations ne contiennent pas nécessairement une configuration de production ou de staging connectée : en l'absence des paramètres publics Vite, l'application affiche **Configuration HUMAN manquante**. Ne pas prétendre que la connexion réelle est testée.
- Les sessions d'URL OAuth et les magic links ne sont pas consommés automatiquement dans les WebViews natives (contrôle `detectSessionInUrl` conditionnel). La connexion par mot de passe reste disponible dans le code ; compatibilité effective non testée sur appareil.
- Aucun lien universel, App Link, deep-link OAuth ou association de domaine activé ; ne pas activer ces fonctions avant un audit distinct.
- Aucun artefact publié sur un store, aucune migration appliquée et aucun test humain exécuté.
