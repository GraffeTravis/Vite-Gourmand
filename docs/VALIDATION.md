# Validation du socle — 20 octobre 2026

## Contrôles réussis

- Dépendances installées et `package-lock.json` généré. `npm ci --dry-run --ignore-scripts --no-audit --no-fund` réussit.
- Prisma 7.10.1 : validation et génération du client réussies. Schéma de travail : 18 tables, 19 relations, types et nullabilité repris du MLD v0.1.
- ESLint : aucune erreur ni avertissement de code.
- TypeScript strict : contrôle réussi.
- Vitest : 9 tests réussis pour RM06/RM07, incluant des minima différents et des quantités invalides.
- Build de production Next.js 16.4.2 : réussi, routes `/`, `/menus`, `/api/health`, page introuvable et polices locales.
- Contrôle HTTP du serveur compilé : accueil 200, menus 200, santé 200 avec statut `ok`, route absente 404. Serveur temporaire arrêté après contrôle.
- `docker compose config --quiet` : configuration valide.
- Après activation de Docker Desktop : PostgreSQL, MongoDB et Mailpit démarrés, états sains. Connexions vérifiées depuis les connecteurs applicatifs : requête Prisma `SELECT 1`, ping MongoDB, négociation SMTP sans envoi et interface Mailpit HTTP 200.
- Image applicative construite avec succès, installation `npm ci` et génération Prisma sous Linux vérifiées. Les quatre services sont démarrés. Depuis le conteneur applicatif : PostgreSQL, MongoDB et SMTP joignables par les connecteurs serveur. Depuis la machine : `/`, `/menus` et `/api/health` répondent HTTP 200 sur le port 3000.
- PostgreSQL expose le port local 5433, le 5432 étant déjà utilisé par un autre service Windows. Le port interne Docker reste 5432.
- `.env`, clients générés, dépendances et build exclus de Git.
- Audit npm des dépendances de production : zéro vulnérabilité signalée.

## Limites observées

- Le seed n'est pas exécuté : il dépend de la migration métier qui reste en attente de validation.
- Aucune migration exécutée : le modèle v0.1 comporte des arbitrages ouverts. Aucun compte privilégié créé.
- L'audit complet signale cinq entrées de sévérité élevée sur la chaîne de développement `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`. La dernière version publiée de braces au contrôle est 3.0.3, elle-même signalée. La remédiation automatique propose une rétrogradation majeure de Next lint : non appliquée. Suivre le correctif amont avant la recette.
- ESLint 9.39.5 est déprécié mais conservé pour respecter les peer dependencies des plugins import, react et jsx-a11y livrés par eslint-config-next 16.4.2. ESLint 10 passe le lint mais provoque des incompatibilités déclarées ; il n'est pas retenu.
- Pas d'audit visuel navigateur, de recette clavier/lecteur d'écran, de certification RGAA ou de déploiement. L'enveloppe graphique n'est pas la reproduction finale des six maquettes.
- Vitest nécessite ici l'exécution hors du bac à sable Windows à cause d'un refus de renommage dans son cache temporaire. Les neuf tests passent dans ce contexte.

## Particularité Windows

Le caractère `&` du chemin provoque un échec dans certains wrappers `.cmd` des dépendances npm. Les scripts invoquent leurs exécutables JavaScript via Node avec des chemins relatifs ; le nom du dossier est conservé. La commande de seed suit la même convention.

Versions principales verrouillées : Next.js 16.4.2, React 19.3.1, TypeScript 5.9.3, Prisma 7.10.1, MongoDB driver 7.7.0, Nodemailer 10.1.7.

## Complément — début du développement L0/L1, 20 octobre 2026

Les sections précédentes décrivent la validation historique du socle. État actualisé :

- 49 tests unitaires réussis : quantité 9, tarification D01 20, configuration 20.
- 11 tests d'intégration réussis sur une vraie base PostgreSQL 17 jetable, créée puis supprimée par le lanceur. La vérification finale ne trouve aucune base `vg_test_*` restante.
- Deux migrations de revue appliquées sur base vide, puis réappliquées sans opération supplémentaire : 22 tables et contraintes SQL complémentaires. Aucun déploiement du modèle dans la base applicative.
- Seed exécuté plusieurs fois dans la base de test : trois rôles, huit statuts, aucun compte initial ; fixtures exclusivement fictives et jetables.
- Tarification en centimes concordante avec NUMERIC/round PostgreSQL, instantanés préservés après changement du menu ; total falsifié et quantité invalide refusés.
- Deux transactions réellement ouvertes avant de tenter la dernière réservation : une seule décrémentation réussie, stock final nul.
- Erreur injectée après écriture d'une commande, de son historique et de l'outbox : rollback complet, stock restauré par l'annulation de transaction.
- Fonction `enqueueEvent` testée dans une transaction : intention durable, unicités et progression e-mail/statistiques indépendantes ; aucun worker ni envoi réel annoncé.
- Lint sans erreur ni avertissement, types stricts et build de production réussis après les modifications.
- Test HTTP du serveur compilé : `/`, `/menus`, `/api/health` en 200, route absente en 404 et en-têtes de sécurité contrôlés ; serveur temporaire arrêté.
- Configuration sans DATABASE_URL : démarrage interrompu avec code 1 avant lancement de Next.js ; aucun secret affiché dans l'erreur.
- Lockfile cohérent (`npm ci --dry-run --ignore-scripts --no-audit --no-fund`), YAML analysé sans erreur, liens Markdown internes vérifiés.
- Workflow préparé avec `qualite`, `integration` PostgreSQL et `validation` et rapports JUnit. Aucun résultat GitHub ni préproduction n'est déduit de ces contrôles locaux.

Les migrations restent de revue tant que les décisions de modèle concernées ne sont pas finalisées. Les tests de primitives ne valident ni un parcours complet de commande, ni l'authentification, ni une reprise d'outbox. Voir [AVANCEMENT.md](AVANCEMENT.md) et [DECISIONS-A-VALIDER.md](DECISIONS-A-VALIDER.md).
