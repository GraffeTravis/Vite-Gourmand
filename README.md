# Vite & Gourmand

Développement commencé le 20 octobre 2026 dans le dossier applicatif créé par le porteur du projet. Les documents de conception restent dans le dossier parent. Le [journal de développement](docs/AVANCEMENT.md) donne l'état réel des lots et les points restant à traiter.

Stack : Next.js App Router, React, TypeScript strict, PostgreSQL avec Prisma, MongoDB avec le pilote officiel, Docker Compose et Mailpit. Cible applicative : Vercel. Architecture : monolithe modulaire.

## Démarrer sur Windows

Prérequis : Node.js 24 LTS, npm et Docker Desktop avec moteur Linux actif.

```powershell
Copy-Item .env.example .env
npm install
npm run services:up
npm run db:deploy
npm run db:seed
npm run db:seed:hours
npm run db:seed:demo
npm run dev
```

Application : http://localhost:3000. Mailpit : http://localhost:8025. Le catalogue et les horaires lisent PostgreSQL ; en cas de panne, un état d'indisponibilité est affiché. Les identifiants Compose sont exclusivement destinés au développement local, les ports sont liés à la machine locale.

PostgreSQL est exposé sur `localhost:5433` pour éviter le service déjà présent sur le port 5432. Le port peut être changé avec `POSTGRES_PORT` ; adapter aussi `DATABASE_URL`. Entre conteneurs, PostgreSQL reste accessible sur `postgres:5432`.

Quatre migrations additives ont été testées et activées dans la base locale initialement vide, après validation des règles de catalogue et des horaires. Les règles des futurs lots restent dans le registre : aucune authentification ou commande n'est déduite de la seule présence de leurs tables. Pour les tests, utiliser une base jetable indépendante :

```powershell
npm run db:validate
Copy-Item .env.test.example .env.test
npm run test:integration
```

Le lanceur crée une base `vg_test_<uuid>`, applique deux fois les migrations, exécute les tests puis supprime uniquement cette base. Il exige `TEST_DATABASE_ADMIN_URL` et ne se rabat jamais sur `DATABASE_URL`. Les fixtures automatiques restent dans cette base. `services:down` conserve les volumes ; ne pas ajouter `-v` si les données doivent être conservées.

Les seeds sont séparés : `db:seed` initialise seulement rôles/statuts ; `db:seed:hours` charge les horaires d'accueil fournis pour le projet si la table est vide ; `db:seed:demo` ajoute trois menus marqués fictifs. Les deux derniers scripts refusent une base distante ou de production. Aucun compte ni avis n'est créé. Les valeurs déjà renseignées ne sont pas remplacées lors d'une réexécution. Les modifications de schéma se préparent avec `db:migrate` en développement et se livrent par migration additionnelle ; ne pas modifier une migration déjà appliquée.

## Vérifier

```powershell
npm run db:validate
npm run check
npm run test:integration
node node_modules/@playwright/test/cli.js install chromium
npm run test:e2e
npm run build
```

Pour lancer les quatre services dans Docker : `docker compose up --build -d`. Le Dockerfile est destiné au développement, pas à un hébergement public de production. Les migrations ne sont jamais lancées automatiquement par le serveur.

## Périmètre réel

Réalisé localement : catalogue PostgreSQL avec filtres combinés sans rechargement, pagination, fiche et galerie, publication contrôlée, accueil connecté aux menus/avis approuvés, horaires d'accueil des sept jours, charte responsive et polices locales. Socle de tarification/configuration/outbox conservé. **78 tests unitaires, 31 tests PostgreSQL et 12 parcours Chromium bureau/mobile réussis** ; voir les résultats actualisés dans [VALIDATION.md](docs/VALIDATION.md).

À développer : authentification, commande et livraison automatique, espaces client/employé/administrateur, worker d'outbox et envois durables, projection analytique et contact. Les textes légaux sont signalés comme non finalisés. Contact/connexion dans la navigation et action Commander attendent leurs fonctions réelles ; aucun faux formulaire n'est proposé. Les tables techniques ne constituent pas ces fonctionnalités complètes. Les contrôles axe et clavier ne constituent pas une certification RGAA.

`test:e2e` construit une version de production, lance Chromium aux largeurs 1440 et 390 px sur le port 3109, puis arrête le serveur et supprime sa base. Il ne réutilise pas une application déjà ouverte. Les rapports et captures restent dans `test-results/` et `playwright-report/`, exclus de Git/Docker.

Les pages sont volontairement non indexables tant que le site n'est pas ouvert. Aucun déploiement n'est configuré ou exécuté. Avant Vercel : bases managées, secrets serveur, traitement différé durable, sauvegardes et recette. Ne jamais exposer les secrets via `NEXT_PUBLIC_`.

`APP_ENV=development` identifie explicitement la configuration locale, y compris lors d'un test local du build de production. En préproduction/production : `APP_ENV=preview` ou `production`, origine `APP_URL` HTTPS, bases et serveur SMTP distants, expéditeur validé. Le serveur refuse une configuration incomplète. La compilation ne dépend d'aucune connexion métier aux bases.

Voir [architecture](docs/ARCHITECTURE.md), [références et arbitrages](docs/REFERENCES.md), [backlog](docs/BACKLOG.md) et [validation](docs/VALIDATION.md).

Le [plan de développement](docs/FEUILLE-DE-ROUTE.md) décrit les lots restants, leurs dépendances et leurs critères de sortie. Il est accompagné du [plan de tests](docs/PLAN-DE-TESTS.md), de la [proposition CI/CD GitHub–Vercel](docs/CI-CD.md) et du [registre des décisions à valider](docs/DECISIONS-A-VALIDER.md). Ces documents constituent une feuille de route ; ils ne signalent pas un déploiement ou une recette déjà exécutés.

## Git

Convention prévue par le CDC : `main`, `develop`, puis une branche par fonctionnalité depuis `develop`. Le dépôt distant `origin` désigne [GraffeTravis/Vite-Gourmand](https://github.com/GraffeTravis/Vite-Gourmand). Le dépôt est public ; le rattachement local ne constitue pas une publication ni un déploiement.

Le premier instantané local `9e5b034` regroupe le socle et les fondations L0/L1. Le commit GitHub initial `027e156` a été conservé par fusion, sans réécriture d'historique. `main` et `develop` portent le socle ; le catalogue et les horaires restent sur `feature/catalogue-public` pour revue. Publication, protections et résultats distants : voir le [suivi GitHub](docs/GITHUB.md) et le [journal](docs/AVANCEMENT.md). La préproduction reste à configurer.
