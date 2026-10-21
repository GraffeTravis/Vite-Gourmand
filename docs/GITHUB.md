# Raccordement GitHub — 21 octobre 2026

Dépôt fourni par le porteur du projet : [GraffeTravis/Vite-Gourmand](https://github.com/GraffeTravis/Vite-Gourmand), public. Le compte connecté dispose des droits d'administration. `origin` est configuré dans le dépôt applicatif, situé dans le sous-dossier `Vite&Gourmand/` ; le dossier parent de références reste hors du dépôt.

## État de la reprise

- Le dépôt distant contenait `027e156`, un commit initial avec un README. Il a été conservé avec l'historique local par une fusion, sans push forcé ni remplacement du dépôt.
- `main` et `develop` conservent le socle L0/L1 ; `feature/catalogue-public` conserve le catalogue, les horaires et les vérifications L2.
- La publication a été arrêtée par le contrôle automatique : une confirmation explicite de la diffusion publique du code est requise. Aucun envoi Git, PR, protection distante ni exécution Actions n'est annoncé à ce stade.
- Le propriétaire prépare Vercel et les bases distantes. Aucun abonnement, secret distant, migration distante ni déploiement n'est créé pendant cette préparation.

## Contenu préparé

| Inclus dans l'historique applicatif | Exclus de la publication |
| --- | --- |
| Code, schéma et migrations additives, tests et fixtures fictives | `.env`, `.env.test`, mots de passe ou jetons réels |
| README et documentation écrite pour ce dépôt | Documents originaux, profil développeur et autres fichiers du dossier parent |
| Workflow Actions, modèles d'issues et de PR, configuration locale Docker | Bases locales, dépendances, clients générés, builds, caches et rapports de tests |
| Trois photos illustratives du catalogue, avec notice de provenance et marquage de démonstration | Données de clients réels et comptes privilégiés |

Les photos restent des exemples fournis avec le prototype ; leur notice et les limites de diffusion sont conservées dans [public/images/demo/README.md](../public/images/demo/README.md). D10 reste ouverte avant une publication commerciale de l'application.

## Séquence prévue après autorisation publique

1. Envoyer `main` et `develop` avec leurs historiques conservés, puis la branche de catalogue ; aucun push forcé.
2. Ouvrir une PR du catalogue vers `develop`, avec périmètre réel, limites et résultats locaux. Garder distinctes vérification du code et recette de préproduction.
3. Attendre les résultats Actions et corriger tout échec. Le workflow vérifie qualité, PostgreSQL et parcours Chromium sur des bases jetables, sans secret de production. Le job `validation` ne réussit que si tous les contrôles obligatoires réussissent.
4. Protéger `main` et `develop` : PR obligatoire, contrôle `validation` à jour, conversations résolues, push forcé et suppression interdits, règles appliquées aussi aux administrateurs. Ne pas imposer l'approbation d'un second compte indisponible au propriétaire seul ; tracer l'auto-revue.
5. Poursuivre la préproduction lorsque les projets et accès sont disponibles. Ne pas fusionner ou déployer pour simplement faire disparaître un contrôle en attente.

Les secrets restent dans les gestionnaires d'environnement appropriés, jamais dans une issue, une PR, un rapport ou le chat. La CI ne dépend pas de Vercel ni de bases managées.
