# Raccordement GitHub — 21 octobre 2026

Dépôt fourni par le porteur du projet : [GraffeTravis/Vite-Gourmand](https://github.com/GraffeTravis/Vite-Gourmand), public. Le compte connecté dispose des droits d'administration. `origin` est configuré dans le dépôt applicatif, situé dans le sous-dossier `Vite&Gourmand/` ; le dossier parent de références reste hors du dépôt.

## État de la reprise

- Le dépôt distant contenait `027e156`, un commit initial avec un README. Il a été conservé avec l'historique local par une fusion, sans push forcé ni remplacement du dépôt.
- `main` et `develop` conservent le socle L0/L1 ; `feature/catalogue-public` conserve le catalogue, les horaires et les vérifications L2.
- Le porteur du projet a explicitement autorisé la diffusion publique le 21 octobre. `main`, `develop` et `feature/catalogue-public` ont été publiées sans push forcé. Les fichiers exclus ci-dessous restent hors de Git.
- La [PR #1](https://github.com/GraffeTravis/Vite-Gourmand/pull/1), du catalogue vers `develop`, est ouverte en brouillon. Aucun code n'a été fusionné dans les branches protégées pendant cette reprise.
- La [première exécution Actions](https://github.com/GraffeTravis/Vite-Gourmand/actions/runs/39688885178), sur `9fa80eb`, est réussie : `qualite`, `integration`, `parcours` et `validation`. Elle vérifie le socle et le catalogue ensemble ; elle ne prouve pas un déploiement Vercel.
- Les protections de `main` et `develop` sont appliquées et relues via l'API : PR obligatoire, contrôle `validation` à jour, conversations résolues, interdiction des pushs forcés et des suppressions, administrateurs inclus. Aucun second approbateur imposé au propriétaire seul.
- Le propriétaire a créé le projet Vercel `travis22/vitegourmand` et relié GitHub, puis créé Neon et Atlas Free. Les bases sont désormais raccordées localement et les migrations Neon autorisées sont appliquées : [preuves](NEON-ATLAS.md). Le service d'e-mails et les paramètres d'hébergement restent à préparer ; voir [VERCEL.md](VERCEL.md). Aucun secret publié ni abonnement souscrit par cette reprise.

## Contenu préparé

| Inclus dans l'historique applicatif | Exclus de la publication |
| --- | --- |
| Code, schéma et migrations additives, tests et fixtures fictives | `.env`, `.env.test`, mots de passe ou jetons réels |
| README et documentation écrite pour ce dépôt | Documents originaux, profil développeur et autres fichiers du dossier parent |
| Workflow Actions, modèles d'issues et de PR, configuration locale Docker | Bases locales, dépendances, clients générés, builds, caches et rapports de tests |
| Trois photos illustratives du catalogue, avec notice de provenance et marquage de démonstration | Données de clients réels et comptes privilégiés |

Les photos restent des exemples fournis avec le prototype ; leur notice et les limites de diffusion sont conservées dans [public/images/demo/README.md](../public/images/demo/README.md). D10 reste ouverte avant une publication commerciale de l'application.

## Suite après publication

1. Maintenir la PR catalogue en revue et actualiser ses preuves sur chaque nouveau commit. Garder distinctes vérification du code et recette de préproduction.
2. Conserver le contrôle `validation` requis : il ne réussit que si qualité, PostgreSQL et parcours Chromium réussissent, sans secret de production.
3. Créer et isoler les services de préproduction, puis configurer Vercel avec leurs accès via les gestionnaires de secrets appropriés.
4. Mettre en place le déclenchement de livraison après CI prévu dans [CI-CD.md](CI-CD.md). La liaison Git Vercel actuelle lance des builds automatiquement ; elle ne constitue pas encore cette porte de livraison.
5. Vérifier migration, santé, parcours et retour applicatif en préproduction avant de déclarer J1 atteint. Ne pas fusionner ou désactiver des contrôles pour masquer une configuration manquante.

Les secrets restent dans les gestionnaires d'environnement appropriés, jamais dans une issue, une PR, un rapport ou le chat. La CI ne dépend pas de Vercel ni de bases managées.
