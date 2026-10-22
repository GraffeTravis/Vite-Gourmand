# Journal de développement

## 21 octobre 2026 — catalogue publié sur la production Vercel

Reprise demandée : déployer correctement le catalogue dans le projet existant. Branche `feature/deploiement-vercel`, issue de `feature/raccordement-bases-distantes`, sans fusion des PR dépendantes.

- Vercel CLI officiel authentifié après accord explicite du propriétaire. Le projet était déclaré générique et ne contenait aucune variable serveur. Configuration corrigée vers Next.js, Node 24 et Francfort ; les sept paramètres de production sont enregistrés comme sensibles, sans connexion SQL de migration ni secrets de production dans les aperçus de PR.
- Mode d'e-mails explicitement désactivé, car aucun fournisseur n'existe encore et aucune fonction d'envoi n'est livrée. Le transport refuse les envois dans ce mode. HTTPS, bases distantes et validation SMTP lors de son activation restent obligatoires.
- Contrôle de disponibilité des deux bases protégé par un jeton aléatoire ajouté ; aucune écriture et aucun détail fournisseur retourné. Exclusions d'envoi CLI renforcées pour les secrets locaux et le contexte Neon.
- Compilation locale réussie, lint/types réussis, 88 tests unitaires réussis. Les premières exécutions sous bac à sable Windows ont rencontré des refus de jonction/renommage ; compilation et tests ont ensuite réussi avec les permissions adaptées, sans changement de dépendances.
- 31 tests PostgreSQL et 12 parcours Chromium bureau/mobile passent aussi : **131 tests réussis**. La [CI GitHub du candidat](https://github.com/GraffeTravis/Vite-Gourmand/actions/runs/39696821830) réussit sur `9a3f8e332ad550f85b903efca52e5718e484b57c`, ainsi que GitGuardian. [PR #3](https://github.com/GraffeTravis/Vite-Gourmand/pull/3) en brouillon, dépendante de la PR Neon/Atlas.
- Candidat `dpl_HsZ8y6UHHUd82k8QSeHh9y4QFTyA` construit avec succès sur Vercel ; fonctions exécutées à Francfort. [Inspection](https://vercel.com/travis22/vitegourmand/HsZ8y6UHHUd82k8QSeHh9y4QFTyA). Contrôles authentifiés : accueil, catalogue, API catalogue et santé en 200. Le contrôle privé renvoie 503 avec PostgreSQL disponible et MongoDB indisponible. Aucune donnée métier distante créée.
- Le contrôle automatique a d'abord refusé la promotion tant que MongoDB est indisponible. Après information sur cette limite et refus des solutions réseau alternatives, le propriétaire demande explicitement de passer directement sur la production Vercel. Cette nouvelle instruction permet la promotion du candidat, sans modifier Atlas ni prétendre que l'analytique fonctionne.
- Atlas vérifié dans sa console : seule l'adresse de ce poste est autorisée. Le propriétaire refuse explicitement l'ouverture globale `0.0.0.0/0` ; formulaire annulé, aucune règle réseau enregistrée et aucun changement d'utilisateur. **Contrainte de reprise : préserver une liste d'accès réseau limitée.** Recherche d'une sortie stable ou d'un hébergement intermédiaire maîtrisé, avec coût et changement d'architecture explicites avant activation. Aucun abonnement souscrit.
- **Production publiée : [vitegourmand.vercel.app](https://vitegourmand.vercel.app)**, cible relue `READY` sur le même déploiement et le même code `9a3f8e3`. Contrôles sans session Vercel : `/`, `/menus`, `/api/menus`, `/api/health`, `/mentions-legales` et `/cgv` en 200, fiche absente en 404. JSON du catalogue vide vérifié. Capture navigateur enregistrée dans `docs/preuves/vercel-production-2026-10-21.png`.
- Contrôle interne authentifié après promotion : PostgreSQL `true`, MongoDB `false`, HTTP 503 ; sans jeton : 404. **Atlas reste à raccorder depuis Vercel**, sans ouverture globale, proxy, intermédiaire Render ou abonnement. SMTP est explicitement désactivé ; aucune fonction d'e-mails n'est annoncée. Catalogue et horaires distants restent sans contenu initialisé.
- Les builds Preview Git restent sans secrets de production et échouent faute de leur environnement séparé ; le déploiement de production a réussi indépendamment. `main`/`develop` et les PR dépendantes ne sont pas fusionnées. Le journal et la [note de déploiement](VERCEL.md) distinguent cette livraison manuelle du futur workflow CI/CD complet.

## 21 octobre 2026 — raccordement Neon et Atlas

Point de reprise actuel : `feature/raccordement-bases-distantes`, créée à partir du catalogue en revue. Le propriétaire fournit le projet Neon, sa branche `production` et le cluster Atlas Free. La [note de raccordement](NEON-ATLAS.md) conserve les étapes, preuves non sensibles et limites.

- CLI Neon installé et authentifié ; `neon deploy` réussit, sans changement de service. Connexions récupérées dans `.env`, sauvegarde locale préalable et contexte `.neon` ignorés par Git.
- Atlas connecté avec les informations fournies par le propriétaire. Le mot de passe visible dans la capture doit être renouvelé ; il n'est ni journalisé ni versionné.
- Prisma/pg conservés ; pool et nettoyage Vercel adaptés, connexion directe réservée aux migrations, deux URL forcées vers les bases jetables dans les tests. Vérification des services ajoutée, en lecture par défaut et avec garde-fous pour les écritures isolées.
- Les quatre migrations passent sur une branche Neon de test puis se réappliquent sans changement. Écritures/lectures temporaires Neon et Atlas réussies. Après confirmation explicite du propriétaire, les quatre migrations ont aussi été appliquées à `production`, réappliquées sans changement, puis le seed exécuté deux fois : 22 tables métier, trois rôles, huit statuts, zéro compte et zéro menu.
- Le HTTP 503 du catalogue trouvé pendant ce contrôle venait du démarrage de transaction Prisma (`P2028`) ; le seed distant a rencontré le même délai. Attente et durée bornées adaptées dans le client et le seed ; initialisation et contrôles HTTP rejoués avec succès après correction.
- `npm run build` réussit avec la configuration finale. Contrôles HTTP en 200 sur la branche de test puis sur `production` en lecture ; les deux connecteurs sont validés. Serveurs arrêtés ; branche/base temporaires et fichiers de connexion de contrôle supprimés. La sauvegarde de configuration locale est conservée, hors de Git.
- 78 tests unitaires, 31 tests PostgreSQL locaux et 12 parcours Chromium bureau/mobile passent ; lint/types passent ; audit de production à zéro vulnérabilité.
- Le refus initial du contrôle automatique a été résolu par les preuves isolées puis l'accord explicite du propriétaire. Aucune écriture de contrôle ni donnée fictive n'a été ajoutée à `production`. **J1 reste incomplet** : paramètres Vercel, SMTP, préproduction et reprise applicative restent à finaliser.

Suite : revue séparée de ce lot dépendant du catalogue ; configuration Vercel/SMTP avec les services réels du propriétaire et isolation de la préproduction ; L3 ensuite. Aucun compte privilégié ni menu de démonstration distant créé. La liaison locale à la branche nommée `production` ne constitue pas une recette de mise en production de l'application.

## 21 octobre 2026 — raccordement GitHub et préparation de publication L0/L1

Cette entrée constitue le point de reprise actuel. La branche `feature/catalogue-public` contient l'avancée L2 du 20 octobre ; `main` et `develop` portaient encore le socle initial. Les décisions du lot catalogue ci-dessous restent acquises et ne sont pas rouvertes.

### Raccordement et cadre de publication

- Dépôt fourni : [GraffeTravis/Vite-Gourmand](https://github.com/GraffeTravis/Vite-Gourmand), public ; compte connecté avec droits d'administration.
- `origin` configuré dans le sous-dossier applicatif. Le dépôt distant comportait déjà le commit `027e156` avec un README, malgré sa description comme vide. Son historique a été conservé par fusion avec le socle local (`145ee2c`), puis avec la branche catalogue (`b11399b`). Aucun historique supprimé ni push forcé.
- Après un premier refus du contrôle automatique, le porteur du projet a explicitement autorisé la diffusion publique du code, migrations, tests, documentation et trois images de démonstration, en excluant secrets et documents originaux. Les trois branches ont été envoyées sans push forcé ; les deux historiques sont conservés.
- La [PR #1](https://github.com/GraffeTravis/Vite-Gourmand/pull/1) du catalogue vers `develop` est ouverte en brouillon et attachée au chat. Aucune fusion distante ni promotion en production effectuée. Les modèles d'issues sont publiés ; les issues et le tableau de suivi distant ne sont pas créés par cette reprise.
- `main` et `develop` sont protégées : PR et `validation` à jour obligatoires, conversations résolues, push forcé et suppression interdits, règles appliquées aussi aux administrateurs. Paramètres relus après application ; pas d'approbateur indépendant imposé au propriétaire seul.
- Le propriétaire a créé et relié [travis22/vitegourmand](https://vercel.com/travis22/vitegourmand). Il confirme que les bases et le service d'e-mails ne sont pas créés. Le build Vercel de la branche reçoit le code mais échoue sur les paramètres distants manquants ; [diagnostic et suite](VERCEL.md). Aucun service payant, secret ou migration distante créé par cette reprise. **J1 reste incomplet**.

### Corrections de préparation

- ESLint exclut désormais `playwright-report/`, `test-results/` et `coverage/`. Les rapports HTML générés par les parcours étaient analysés comme du code et ralentissaient fortement le contrôle. L'exclusion est vérifiée avec l'API ESLint ; aucun fichier applicatif n'est exclu en plus.
- Actions vise les pushs sur `main`/`develop`, les PR vers ces branches et les lancements manuels. Une branche de fonctionnalité passe par sa PR, sans doubler ses quatre jobs à chaque push.
- README, état CI/CD et suivi GitHub actualisés ; les documents de référence du dossier parent restent intacts.

### Contrôles de reprise

- 78 tests unitaires et 31 tests d'intégration PostgreSQL réussis ; quatre migrations appliquées sur une base vide puis réappliquées sans opération supplémentaire.
- Validation Prisma, génération du client, lint et types stricts réussis. Comme lors des lots précédents, Vitest exige ici une exécution hors du bac à sable Windows pour renommer son cache ; aucun test ignoré.
- Build de production et 12 parcours Chromium bureau/mobile réussis, incluant filtres, galerie, refus 400/404, panne/réessai, réponses anciennes, clavier et axe. Serveur temporaire arrêté par Playwright ; aucune base `vg_test_*` restante après les deux suites.
- Revue des cinq révisions de l'historique destiné à GitHub : 303 contenus textuels examinés, aucun fichier exclu présent et aucun motif de clé privée/jeton détecté. Cette recherche ciblée ne constitue pas une garantie absolue d'absence de secret. Les fichiers d'environnement réels, originaux de référence, dépendances et rapports restent hors de Git.
- [Première CI GitHub réussie](https://github.com/GraffeTravis/Vite-Gourmand/actions/runs/39688885178) sur `9fa80eb` : `qualite`, `integration`, `parcours`, puis `validation`. Les quatre contrôles sont confirmés via l'API, sur runners Linux et PostgreSQL jetable ; rapports JUnit/navigateur conservés. GitGuardian a aussi réussi son analyse des trois commits de la PR.
- Vercel demeure en échec indépendamment de la CI GitHub : `APP_URL`, `DATABASE_URL`, `MONGODB_URI`, `MONGODB_DATABASE`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` manquent dans le build Preview consulté. L'adresse initiale fournie redirige le visiteur non connecté vers Vercel ; elle ne prouve pas une disponibilité de l'application.

### Suite

1. Maintenir la PR catalogue en revue et sa CI à jour ; compléter le suivi distant et conserver les protections. La publication du code ne constitue pas une livraison applicative.
2. Préparer les bases et e-mails avec le propriétaire, renseigner la préproduction Vercel et ajouter le workflow de livraison après CI, en conservant l'isolation et les contenus de démonstration explicites. La liaison Git actuelle lance des builds automatiquement sans attendre cette porte de livraison. Ne pas annoncer de recette ou de retour applicatif démontré avant leur exécution.
3. Poursuivre L3 conformément à la feuille de route : identité, sessions et récupération, puis traitement durable d'outbox. Les arbitrages D08/D09 et les règles métier encore ouvertes restent ciblés sur leurs lots.

## 20 octobre 2026 — poursuite L1 et catalogue public L2

Cette entrée constitue le point de reprise actuel ; l'état initial est conservé plus bas. Branche de travail : `feature/catalogue-public`, créée depuis `develop`. **J1 reste incomplet** : GitHub, CI distante, préproduction et exercice de retour applicatif restent à configurer/vérifier. Aucun lot complet n'est déclaré livré en préproduction.

### Décisions reçues pendant cette reprise

- D03 : gratuité dans la **commune** de Bordeaux ; hors Bordeaux, 5 € + 0,59 €/km sur le trajet aller en voiture le plus rapide depuis le 36 rue de la Benauge, 33100 Bordeaux ; arrondi du prix final au centime ; confirmation impossible si le calcul automatique échoue. Ces règles sont validées, l'adaptateur et le devis serveur restent à développer en L4.
- D06 : catégorie commune du plat ; au moins une image, un plat et vérification des allergènes avant publication ; archivage d'un menu déjà commandé ; un avis par commande, public après modération. Règles validées par le porteur du projet.
- D05 : suivi global du matériel par commande, sans inventaire article par article ni retour partiel. Calendrier, notification et application des frais restent ouverts avant L6.
- D13 : un groupe de 12 voit les menus dont le minimum est inférieur ou égal à 12 ; tous les critères se combinent en ET. Les deux plafonds de prix se combinent en retenant le plus restrictif.
- D04, accueil sur place/téléphone en heure locale de Bordeaux : lundi fermé ; mardi à vendredi 09:00–13:00 / 14:00–18:00 ; samedi 09:00–13:00 / 14:00–17:00 ; dimanche 09:00–12:30. Valeurs proposées et fournies pour le projet, pas déduites du CDC. Créneaux/délais de livraison à préciser séparément.

### Réalisation

| Élément | État réel |
| --- | --- |
| Catalogue | Lecture PostgreSQL, compte des résultats, pagination stable de 12 menus, filtres prix/plage/thème/régime/groupe ; saisies invalides refusées ; réinitialisation et conservation des filtres au retour d'une fiche |
| Actualisation | Sans rechargement complet ; annulation de la requête précédente et garde contre les réponses anciennes ; état d'attente lisible, réessai après erreur ; changement d'ancre clavier sans nouvelle lecture inutile |
| Fiche et galerie | Photos alternatives, composition et allergènes par plat, conditions mises en évidence, minimum, régime, thème et stock en nombre de commandes ; menu épuisé visible ; menu caché ou absent en 404 |
| Publication | Migration 003 : contrôle SQL différé à la fin de transaction ; refus d'une publication incomplète et de la suppression de la dernière image ; nouvelle vérification obligatoire après changement de composition ou d'allergènes ; verrou du menu pour les contrôles concurrents |
| Contenus publics | Accueil alimenté par les menus et avis approuvés de commandes terminées, sans coordonnées client ; sept jours au footer ; liens légaux menant à des contenus explicitement en attente de validation |
| Horaires | Migration 004 : cohérence des heures, fermeture et absence de chevauchement ; 12 lignes pour les sept jours fournis ; initialisation rejouable qui ne remplace pas des horaires déjà renseignés ; heures TIME affichées sans conversion vers le fuseau du poste |
| Données locales | Migrations additives activées dans la base locale initialement vide ; référentiels, trois menus fictifs et horaires du projet ; aucun compte ni avis créé par ces initialisations |
| Démonstration | Seed de menus séparé et gardé pour les bases locales/test ; marquage IS_DEMO, bandeau, cartes et légendes explicites ; exemples exclus des lectures de production ; images locales copiées depuis les références sans modifier les originaux |
| CI | Jobs qualité, PostgreSQL, parcours Chromium bureau/mobile et validation ; chaque suite a sa propre base jetable ; rapports JUnit, traces d'échec et captures ; aucune exécution GitHub annoncée |

L'activation locale concerne les blocs désormais définis du catalogue et des horaires. Les tables neutres de sessions et les blocs futurs ne valent pas choix d'une bibliothèque d'authentification ni validation des règles restantes D04/D05/D08. Les migrations déjà appliquées ne doivent plus être réécrites ; toute suite se fait par migration additionnelle.

### Vérifications de cette reprise

- 78 tests unitaires et 31 tests d'intégration PostgreSQL passent. Quatre migrations appliquées sur bases vides et réappliquées sans opération supplémentaire ; bases jetables supprimées après exécution.
- Recette de 12 scénarios Chromium bureau/mobile contre le build de production : filtres sans nouveau document, combinaison/réinitialisation, galerie, retour aux filtres, HTTP 400/404, panne/réessai, réponses dans le désordre, sept jours, clavier et absence de débordement.
- axe sur catalogue et fiche ; captures bureau/mobile inspectées. Aucun résultat automatique n'est présenté comme certification RGAA ; lecteur d'écran, appareil réel et autres navigateurs restent à vérifier.
- Deux anomalies trouvées pendant la recette ont été corrigées : chargement du catalogue qui anticipait un HTTP 200 sur une fiche absente ; perte de contraste liée à l'opacité de la liste pendant son actualisation. Le lien d'évitement ne relance plus les filtres à l'occasion d'un simple changement d'ancre.
- Lint, types stricts, validation Prisma, build, cohérence du lockfile et YAML CI contrôlés. Les rapports utiles se trouvent dans `test-results/`, exclus de Git et du contexte Docker.
- Application Docker reconstruite et relancée sans suppression de volume : accueil/catalogue/API en 200, menu absent en 404, trois exemples et filtre de groupe vérifiés. Base locale : 12 plages pour les sept jours, aucun compte/avis ; aucune base jetable restante après les suites.
- Le pilote pg 8 émet encore un avertissement de dépréciation sur sa file de requêtes dans l'adaptateur Prisma. Les tests passent avec les versions verrouillées ; revoir l'adaptateur avant un passage à pg 9, sans masquer l'avertissement.

### Reprise actuelle

1. Achever L0/L1 distant lorsque le dépôt GitHub et la cible Vercel sont connus ; configurer protections, préproduction, secrets et procédure de reprise. Ne pas déclarer J1 atteint sur les seuls tests locaux.
2. L2 lecture publique est utilisable localement ; F04 reste partiel (contact/connexion), F10 attend l'identité et la commande, D10 attend les vrais contenus/photos et textes légaux. Les boutons de commande désactivés n'en constituent pas une livraison.
3. Poursuivre L3 : choix compatible de bibliothèque d'authentification et adaptation des supports neutres si nécessaire, inscription, sessions/révocation, récupération et worker d'outbox. Aucun compte privilégié par le seed ou l'inscription publique.
4. Puis L4 : adaptateur automatique de distance, devis durable côté serveur, créneaux de livraison encore à valider, réservation/libération idempotente du stock et commande atomique. Ne jamais reprendre les 20 km de démonstration.

La section suivante conserve le premier état du socle et ses anciennes limites ; les décisions et points de reprise ci-dessus prévalent.

## 20 octobre 2026 — première réalisation L0/L1

Référence : feuille de route v1.0 et cahier des charges v1.2. Ce journal distingue le code réalisé des jalons validés. **J1 n'est pas atteint** : pas de dépôt distant, de CI exécutée sur GitHub ni de préproduction. Le modèle métier reste en revue.

### Décisions reçues du porteur du projet

- D01 validée : prix par personne, sous-total égal au prix multiplié par la quantité, remise de 10 % dès minimum + 5 personnes, livraison ajoutée ensuite. Implémentation en centimes entiers, montants persistés en Decimal. Arrondi commercial de la remise au centime ; pas d'arrondi intermédiaire sur chaque personne.
- D02 validée : stock global exprimé en **nombre de commandes**, réservé à la création et restitué une seule fois à l'annulation. Une modification de quantité ne consomme pas une nouvelle unité de stock. La réservation/libération dans le service de commande reste à réaliser en L4.
- D03 partielle : calcul de distance **automatique dès la première version**. Départ retenu : **36 rue de la Benauge, 33100 Bordeaux**, implantation fictive du projet à une adresse réelle. Ce choix ne vaut ni établissement commercial réel ni disponibilité du local. Le tarif dans Bordeaux, le trajet et l'arrondi de livraison restent à finaliser avant L4.

Les documents sources MCD/MLD ne sont pas réécrits. Les écarts décidés et le modèle applicatif de travail sont tracés ici et dans le registre des décisions.

### Code réalisé

| Élément | Réalisation | Limite |
| --- | --- | --- |
| Organisation L0 | Modèles d'issues et de PR ; index portable et inventaire de diffusion ; premier instantané local sur main et develop | Dépôt GitHub, protections et tableau distant à configurer |
| Configuration | Précontrôle avant lancement dev/start, contrôle au démarrage Node.js et à la compilation distante ; erreur sans valeur secrète ; refus des services locaux en distant ; suppression du repli SQL local dans Prisma | Validation de configuration, pas test de disponibilité des services |
| Tarification D01 | Calcul exact des sous-total, remise et total, contrôle des montants stockables ; aucun tarif de livraison inventé | Fonction métier prête ; devis public et commande prévus en L4 |
| Modèle L1 | Ajout du minimum de personnes figé dans la commande ; supports de sessions, récupération et outbox à consommateurs indépendants | Pas de connexion publique ni de récupération fonctionnelle avant L3 |
| Migrations | Deux migrations de revue versionnées : création de 22 tables, puis contraintes SQL ; index des sessions et livraisons outbox | Appliquées exclusivement sur bases jetables ; pas d'adoption du modèle ni de migration de la base de développement |
| Outbox | Fonction serveur d'enregistrement d'un événement et de ses consommateurs dans la transaction de l'appelant | Aucun worker, e-mail ni projection MongoDB exécuté par ce code ; L3/L8 restent à faire |
| Tests | Base aléatoire `vg_test_<uuid>` par exécution ; création, migrations, réexécution, tests et suppression automatique | Compte de test autorisé à créer des bases ; jamais de repli sur DATABASE_URL |
| CI | Jobs qualite, integration PostgreSQL et validation ; permissions de lecture, délais, annulation des anciennes CI et rapports JUnit | Configuration vérifiée localement ; aucune exécution GitHub. MongoDB/Mailpit et navigateur seront ajoutés avec leurs fonctionnalités |

### Preuves locales

- Prisma 7.10.1 : schéma validé et client généré.
- 49 tests unitaires réussis : 9 quantité, 20 tarification, 20 configuration.
- 11 tests d'intégration réussis sur PostgreSQL 17 : seed rejouable sans compte, e-mails normalisés/uniques, quantités et montants, arrondis SQL identiques au domaine, instantanés, deux transactions ouvertes simultanément sur le dernier stock, sessions/jetons invalides, historique humain sans auteur, annulation complète d'une transaction et stockage indépendant des consommateurs d'outbox.
- Migration sur base vide et seconde application sans opération supplémentaire réussies. Chaque base créée par le lanceur a été supprimée après les tests.
- Rapports JUnit produits dans `test-results/`, exclus de Git. La CI est configurée pour les conserver 14 jours.
- Lint, types stricts et build de production vérifiés ; voir le relevé complémentaire de VALIDATION.md.
- YAML du workflow, des modèles d'issues et de Docker Compose analysé sans erreur.
- Serveur compilé : accueil, catalogue et santé HTTP 200 ; page absente 404 ; en-têtes de sécurité vérifiés. Serveur temporaire arrêté.
- Configuration volontairement privée de DATABASE_URL : sortie code 1 avant lancement HTTP. Le précontrôle corrige le comportement de Next.js qui peut conserver un processus ouvert après une erreur d'instrumentation.
- Cohérence du lockfile vérifiée par `npm ci --dry-run --ignore-scripts --no-audit --no-fund` ; @next/env est une dépendance explicite alignée sur la version de Next.js verrouillée.
- Fichiers `.env` et `.env.test` exclus de Git ; aucune référence personnelle du dossier parent copiée dans le dépôt.

Sous le bac à sable Windows, Vitest rencontre toujours un refus de renommage dans son cache temporaire. Les suites ont été exécutées avec succès hors de cette restriction. Aucun échec de code n'est masqué par un test ignoré.

### Reprise de travail

1. Finaliser les parties du schéma concernées par D03/D04/D05/D06/D08 avant d'adopter les migrations métier. Les unicités d'avis et le suivi global du matériel restent des hypothèses héritées du MLD, pas de nouvelles validations.
2. Compléter les contraintes de service : graphe des statuts, autorisations, historique obligatoire, contact préalable à annulation et restitution unique du stock. Les contraintes SQL de ce lot ne prétendent pas vérifier toutes les règles intertables.
3. Éprouver la migration adoptée, préparer les fixtures utiles et configurer GitHub/préproduction avec les accès du propriétaire. Démontrer séparément la reprise applicative et la restauration ; aucune des deux n'est acquise ici.
4. Commencer L2 sur ce socle, avec le sens du filtre D13 confirmé, puis L3 et L4 dans l'ordre de la feuille de route.

### Recherche livraison automatique

L'IGN fournit un [géocodage d'adresses](https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/geocodage/) et un [calcul d'itinéraire routier](https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/calcul-itineraire/). C'est le candidat technique à éprouver en D03, pas encore un adaptateur livré. Prévoir une réponse explicite en cas d'adresse ambiguë, de quota ou de panne : aucune distance de démonstration ni distance libre fournie par le navigateur ne doit servir de prix de secours.

Lors de la validation du fournisseur : confirmer le trajet aller et le profil de calcul, identifier Bordeaux par sa commune plutôt que par son seul code postal, conserver la provenance et les éléments utiles du devis côté serveur, et documenter l'envoi des adresses au fournisseur. Le test d'accès à l'API via l'outil Web n'a pas fourni de réponse exploitable ; aucune distance réelle n'est annoncée.
