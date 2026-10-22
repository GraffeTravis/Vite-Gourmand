# Validation du socle — 20 octobre 2026

## Production Vercel — 21 octobre 2026

Code `9a3f8e332ad550f85b903efca52e5718e484b57c` : compilation locale et Vercel réussies ; lint/types réussis ; 88 tests unitaires, 31 tests PostgreSQL et 12 parcours Chromium bureau/mobile réussis. [CI GitHub](https://github.com/GraffeTravis/Vite-Gourmand/actions/runs/39696821830) et GitGuardian réussis sur ce code. Les suites SQL et navigateur utilisent exclusivement des bases locales jetables, sans accès aux données de production.

Déploiement promu sur [vitegourmand.vercel.app](https://vitegourmand.vercel.app) après demande explicite du propriétaire, informé de la limite MongoDB. État Vercel relu `READY` : `dpl_HsZ8y6UHHUd82k8QSeHh9y4QFTyA`. Contrôles sans session Vercel : accueil, catalogue, API catalogue, santé et pages légales en 200 ; fiche absente en 404. Catalogue vide confirmé dans le JSON, sans contenu fictif distant. Contrôle navigateur et [capture](preuves/vercel-production-2026-10-21.png) conservés.

Limite vérifiée : contrôle privé authentifié en 503, `postgres: true`, `mongodb: false` ; sans jeton, 404 avant connexion. La liste réseau Atlas reste limitée à ce poste : ouverture globale explicitement refusée, formulaire annulé et aucune règle ajoutée. Les e-mails sont explicitement désactivés ; leur transport refuse tout envoi. Les aperçus de PR restent sans configuration isolée et échouent ; leur échec est distinct de la production publiée. [Preuves détaillées et commandes](VERCEL.md).

## Raccordement Neon et Atlas — 21 octobre 2026

Neon et Atlas sont vérifiés via les connecteurs applicatifs, avec TLS/certificat Neon contrôlés. Quatre migrations éprouvées sur une copie jetable puis appliquées à `production` après accord explicite, seconde application sans opération supplémentaire ; seed rejoué deux fois. Comptages finaux : 22 tables métier, quatre migrations, trois rôles, huit statuts, aucun compte ni menu.

Build de production réussi avec la configuration locale finale ; serveur compilé démarré sur la cible Neon désignée et contrôlé en lecture : accueil, catalogue, API catalogue et santé en 200, JSON du catalogue vide vérifié. Écriture/lecture et nettoyage éprouvés séparément dans la branche Neon et la base Atlas isolées, ensuite supprimées. Les fichiers de connexion de contrôle sont supprimés et les serveurs arrêtés.

78 tests unitaires, 31 tests PostgreSQL locaux et 12 parcours Chromium bureau/mobile réussis. Lint, types, schéma Prisma et cohérence du lockfile vérifiés ; audit des dépendances de production à zéro vulnérabilité. Le HTTP 503 et l'échec de seed dus au délai de transaction `P2028` ont été corrigés et les contrôles concernés rejoués. Voir [les sorties, les échecs récupérés et les limites](NEON-ATLAS.md). La configuration Vercel/SMTP reste distincte de ces résultats locaux.

## Reprise GitHub — 21 octobre 2026

Sur `feature/catalogue-public`, reprise des vérifications du catalogue avant publication : 78 tests unitaires, 31 tests PostgreSQL et 12 parcours Chromium bureau/mobile réussis. Validation Prisma, génération du client, types stricts, lint et build de production réussis. Les quatre migrations s'appliquent sur base neuve et une seconde application n'ajoute aucune opération. Aucune base `vg_test_*` restante après les suites ; serveur navigateur temporaire arrêté.

La correction ESLint exclut les seuls rapports générés (`playwright-report/`, `test-results/`, `coverage/`) ; exclusion vérifiée par l'API ESLint. Le workflow évite les doublons push/PR des branches de fonctionnalité et autorise un lancement manuel.

Revue de diffusion avant push : cinq révisions et 303 contenus textuels, aucun fichier exclu ni motif ciblé de clé privée/jeton trouvé. Le porteur du projet a ensuite explicitement autorisé la diffusion publique ; les trois branches ont été publiées et la PR catalogue ouverte. Les protections de `main`/`develop` ont été appliquées puis relues via l'API.

[Première CI GitHub](https://github.com/GraffeTravis/Vite-Gourmand/actions/runs/39688885178) réussie sur `9fa80eb` : qualité (installation, Prisma, lint, types, tests, build), intégration PostgreSQL, parcours Chromium et contrôle récapitulatif `validation`. GitGuardian réussit aussi l'analyse des trois commits de la PR. Ces résultats distants complètent les preuves locales ; ils ne valident pas la préproduction.

Le propriétaire a relié son projet Vercel. Son build Preview échoue sur les paramètres serveur et services manquants ; bases et e-mails ne sont pas encore créés. Voir [VERCEL.md](VERCEL.md), [GITHUB.md](GITHUB.md) et [AVANCEMENT.md](AVANCEMENT.md).

Les sections suivantes conservent les résultats historiques du socle et du lot catalogue.

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

## Complément — catalogue public et horaires, 20 octobre 2026

Cette section actualise les états historiques ci-dessus après réception des décisions D03/D06/D13, des horaires D04 et du suivi global D05.

- **121 contrôles automatisés réussis**, aucun échec ni test ignoré : 78 unitaires, 31 intégrations PostgreSQL, 12 parcours Chromium bureau/mobile. Rapports JUnit locaux : `test-results/unit.xml`, `integration.xml` et `e2e.xml`.
- Quatre migrations appliquées sur bases jetables puis réappliquées sans opération ; contraintes de publication, invalidation de la vérification des allergènes, suppression concurrente des images, pagination, confidentialité des avis et cohérence des horaires testées.
- Les parcours exécutent le build de production : filtres combinés sans rechargement complet, réinitialisation, galerie/retour, erreurs 400/404, panne 503/réessai, réponses anciennes, horaires, lien d'évitement clavier et absence de débordement à 1440 et 390 px. axe réussit sur catalogue et fiche ; captures inspectées aux deux formats.
- Lint sans avertissement, TypeScript strict, Prisma validate et build réussis. Lockfile cohérent, workflow YAML valide et liens internes Markdown présents.
- Migrations additives activées dans la base locale du projet initialement vide ; 3 menus explicitement fictifs, 12 lignes d'horaires pour les sept jours, zéro compte et zéro avis. Référentiels inchangés. Les initialisations locales ne remplacent pas les données déjà renseignées.
- Image Docker reconstruite et application relancée sans suppression de volume. Contrôle du serveur local : accueil, catalogue, santé et API en 200 ; API catalogue avec 3 menus et `Cache-Control: no-store` ; groupe de 8 compatible avec un menu ; identifiant absent en 404 ; horaires présents dans le HTML.
- Vérification PostgreSQL finale : aucune base `vg_test_*` restante. Les données applicatives ont été conservées.
- La chaîne ESLint garde les cinq alertes élevées de développement déjà décrites ; le pilote pg 8 émet un avertissement amont sur sa file de requêtes. Aucun avertissement n'est masqué ni rétrogradation majeure appliquée.

Limites : cette recette locale ne valide ni GitHub Actions ni la préproduction, et ne certifie pas RGAA. Authentification, commande, devis automatique de livraison, worker d'outbox, e-mails et espaces de gestion restent à développer. F04/F10 restent partiels ; les textes légaux et offres réelles attendent leurs contenus validés. J1 reste incomplet. Les anciennes mentions « aucune migration locale » décrivent le premier état et sont remplacées par ce complément.
