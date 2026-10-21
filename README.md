# Vite & Gourmand

Développement commencé le 20 octobre 2026 dans le dossier applicatif créé par le porteur du projet. Les documents de conception restent dans le dossier parent. Le [journal de développement](docs/AVANCEMENT.md) donne l'état réel de L0/L1 et les points restant à traiter.

Stack : Next.js App Router, React, TypeScript strict, PostgreSQL avec Prisma, MongoDB avec le pilote officiel, Docker Compose et Mailpit. Cible applicative : Vercel. Architecture : monolithe modulaire.

## Démarrer sur Windows

Prérequis : Node.js 24 LTS, npm et Docker Desktop avec moteur Linux actif.

```powershell
Copy-Item .env.example .env
npm install
npm run services:up
npm run dev
```

Application : http://localhost:3000. Mailpit : http://localhost:8025. L'accueil et le catalogue vide fonctionnent sans base. Les identifiants Compose sont exclusivement destinés au développement local, les ports sont liés à la machine locale.

PostgreSQL est exposé sur `localhost:5433` pour éviter le service déjà présent sur le port 5432. Le port peut être changé avec `POSTGRES_PORT` ; adapter aussi `DATABASE_URL`. Entre conteneurs, PostgreSQL reste accessible sur `postgres:5432`.

Le schéma métier reste en revue. Deux migrations sont préparées et testées exclusivement sur bases jetables ; ne pas les appliquer à la base de développement avant résolution des décisions concernées. Les tests les appliquent automatiquement dans leur propre base :

```powershell
npm run db:validate
Copy-Item .env.test.example .env.test
npm run test:integration
```

Le lanceur crée une base `vg_test_<uuid>`, applique deux fois les migrations, exécute les tests puis supprime uniquement cette base. Il exige `TEST_DATABASE_ADMIN_URL` et ne se rabat jamais sur `DATABASE_URL`. Les fixtures fictives restent dans cette base ; aucun administrateur de production ni contenu de démonstration n'est injecté dans le développement. `services:down` conserve les volumes ; ne pas ajouter `-v` si les données doivent être conservées.

Après adoption du modèle seulement : `npm run db:deploy`, puis `npm run db:seed` pour les rôles/statuts. Le seed ne crée aucun compte. Les modifications suivantes de schéma se préparent avec `db:migrate` en développement et se livrent par migrations versionnées.

## Vérifier

```powershell
npm run db:validate
npm run check
npm run test:integration
npm run build
```

Pour lancer les quatre services dans Docker : `docker compose up --build -d`. Le Dockerfile est destiné au développement, pas à un hébergement public de production. Les migrations ne sont jamais lancées automatiquement par le serveur.

## Périmètre réel

Réalisé localement : routes initiales, charte responsive, polices locales, gestion erreur/404, santé HTTP, connecteurs, validation de configuration au démarrage, modèle Prisma de travail et migrations de revue, seed rejouable, calcul tarifaire D01 et écriture transactionnelle d'outbox. 49 tests unitaires et 11 tests PostgreSQL passent. Workflow GitHub préparé ; voir [VALIDATION.md](docs/VALIDATION.md).

À développer : catalogue connecté, authentification, commande et livraison automatique, espaces client/employé/administrateur, worker d'outbox et envois durables, projection analytique, contact et contenus légaux. Les tables de sessions et d'outbox ne constituent pas ces fonctionnalités complètes. Ce socle ne constitue pas l'application finale ni une certification RGAA.

Les pages sont volontairement non indexables tant que le site n'est pas ouvert. Aucun déploiement n'est configuré ou exécuté. Avant Vercel : bases managées, secrets serveur, traitement différé durable, sauvegardes et recette. Ne jamais exposer les secrets via `NEXT_PUBLIC_`.

`APP_ENV=development` identifie explicitement la configuration locale, y compris lors d'un test local du build de production. En préproduction/production : `APP_ENV=preview` ou `production`, origine `APP_URL` HTTPS, bases et serveur SMTP distants, expéditeur validé. Le serveur refuse une configuration incomplète. La compilation ne dépend d'aucune connexion métier aux bases.

Voir [architecture](docs/ARCHITECTURE.md), [références et arbitrages](docs/REFERENCES.md), [backlog](docs/BACKLOG.md) et [validation](docs/VALIDATION.md).

Le [plan de développement](docs/FEUILLE-DE-ROUTE.md) décrit les lots restants, leurs dépendances et leurs critères de sortie. Il est accompagné du [plan de tests](docs/PLAN-DE-TESTS.md), de la [proposition CI/CD GitHub–Vercel](docs/CI-CD.md) et du [registre des décisions à valider](docs/DECISIONS-A-VALIDER.md). Ces documents constituent une feuille de route ; ils ne signalent pas un déploiement ou une recette déjà exécutés.

## Git

Convention prévue par le CDC : `main`, `develop`, puis une branche par fonctionnalité depuis `develop`. Aucun dépôt distant ni commit de livraison n'est créé automatiquement. Commencer par une revue du socle avant le premier commit.

Le premier instantané local regroupe le socle et les fondations L0/L1 vérifiées. Les branches `main` et `develop` partent de ce même point, sans historique artificiel. Les prochains travaux partiront de `develop` sur une branche `feature/*`. Aucun dépôt distant n'est configuré et cet instantané ne constitue pas une version de production.
