# HUMAN BÂTIMENT Sprint 12 — Android / iOS

Status: CONFIGURATION PREPAREE sur feature/s12-mobile, pas de compilation native.
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
   Générer/vérifier le fichier package-lock.json avant une livraison native reproductible.
3. npm run mobile:android:init / npm run mobile:ios:init (dans les environnements adaptés).
4. npm run mobile:sync, ouvrir Android Studio / Xcode.
5. Configurer Universal Links/App Links et les redirections Supabase Auth spécifiques
   AVANT toute vraie connexion OAuth ou accès aux dossiers.
6. Compiler et tester sur émulateur ou appareil; ne jamais annoncer cette étape
   validée avant son exécution.

## Non réalisé
- Répertoires natifs android/ et ios/ pas encore générés : dépendances natives
  et outils de compilation non disponibles dans ce runtime.
- Aucun build d'app, aucun TestFlight ni Google Play.
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
Les dépendances Capacitor 8.5.3 et les scripts de génération sont poussés sur la branche. Les contrôles GitHub valident le build web, PAS les projets natifs Android/iOS. Aucune compilation native exécutée et aucun lockfile généré à ce stade.
