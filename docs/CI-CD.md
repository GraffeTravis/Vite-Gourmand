# CI/CD GitHub et exploitation sur Vercel

20 octobre 2026. Proposition adaptée au monolithe Next.js du projet. La CI vérifie chaque changement ; la livraison continue prépare une version vérifiée, puis la mise en production reste une action contrôlée. Ce document décrit la cible : seul le workflow minimal `ci.yml` existe aujourd'hui, sans dépôt distant ni déploiement configuré.

Voir aussi la [feuille de route](FEUILLE-DE-ROUTE.md), le [plan de tests](PLAN-DE-TESTS.md) et les décisions [D08–D12](DECISIONS-A-VALIDER.md).

Réalisation du 20 octobre : `.github/workflows/ci.yml` contient désormais `qualite`, `integration` PostgreSQL et `validation`, avec délais, permissions de lecture et rapports JUnit. Le job qualité construit sans service de base disponible. Les tests MongoDB/Mailpit, les parcours navigateur et les workflows de déploiement restent à ajouter avec les lots concernés. Aucun workflow n'a encore été exécuté sur GitHub ; voir [AVANCEMENT.md](AVANCEMENT.md).

## 1. Infrastructure proposée

| Besoin | Solution de départ | Limite ou condition |
| --- | --- | --- |
| Code, revues, suivi et automatisation | GitHub, Issues, Projects, Pull Requests et Actions sur runners Linux hébergés | Dépôt public attendu à la livraison ; propriétaire et droits à définir. |
| Application | Vercel, runtime Node compatible avec les versions verrouillées ; Node 24 pour développement et CI | Deux projets Vercel pour préproduction et production, même code et configurations séparées. Le Dockerfile actuel est de développement. |
| Données transactionnelles | PostgreSQL managé, connexions applicatives limitées et pool adaptées au serverless | URL de migration distincte/directe si le fournisseur l'exige ; sauvegardes restaurables. PostgreSQL 17 est la référence locale actuelle. |
| Statistiques | MongoDB managé, pilote officiel et index versionnés | Données analytiques reconstruisibles ; pas de dépendance bloquante à MongoDB pour enregistrer une commande. |
| E-mails | Fournisseur transactionnel SMTP/API ; Mailpit en local et CI | Domaine/expéditeur vérifiés ; mode test et destinataires contrôlés en préproduction. |
| Images gérées par l'équipe | Stockage objet persistant, par exemple Vercel Blob ou service équivalent retenu en D11 | Écriture dans le système de fichiers d'une fonction exclue comme stockage permanent ; contrôle des fichiers et des droits. |
| Traitement différé à petit volume | Outbox PostgreSQL et route serveur de reprise appelée chaque minute sur un plan Vercel compatible | Traitement borné, bail et idempotence obligatoires ; augmenter les moyens si le retard ou le volume dépasse les objectifs. |
| Surveillance | Sonde externe de disponibilité, logs structurés et alertes sur les erreurs et le retard d'outbox | Choix du service et destinataire d'alerte à finaliser ; aucune donnée personnelle ni secret dans les messages. |

Pour un usage commercial réel, prévoir un plan Vercel autorisant cet usage : Hobby est limité à l'usage personnel non commercial. Cette proposition retient Pro pour l'application et la cadence du traitement différé. Une démonstration pédagogique doit être qualifiée séparément. [Conditions du plan Hobby](https://vercel.com/docs/plans/hobby).

Le cron Hobby est limité à une exécution quotidienne ; Pro permet une cadence par minute. Cette différence empêche de promettre des notifications rapides avec le seul cron quotidien gratuit. Les offres et quotas seront revérifiés lors du choix d'hébergement. [Cadence des cron jobs](https://vercel.com/docs/cron-jobs/usage-and-pricing).

Ne pas promettre un hébergement entièrement gratuit. Le budget doit couvrir application, deux environnements, bases, sauvegardes, stockage, e-mails, domaine et éventuels dépassements. Chiffrer ces postes sur les offres retenues avant activation ; aucun abonnement n'est souscrit par ce plan.

## 2. Environnements et circulation du code

| Environnement | Déclenchement | Données et e-mails |
| --- | --- | --- |
| Local | Travail sur `feature/*` issue de `develop` | Docker Compose : PostgreSQL, MongoDB, Mailpit ; données fictives. |
| CI éphémère | PR et push sur branches utiles | Services jetables par job ; identifiants de test uniquement ; aucun accès production. |
| Préproduction | Automatiquement après succès CI sur `develop`, et pour le candidat de livraison `main` | Bases, stockage, secrets et destinataires de test distincts de production ; accès protégé et absence d'indexation. |
| Production | Déclenchement manuel depuis `main` pour un SHA ayant une recette de préproduction réussie | Bases et domaine réels, sauvegarde et secrets de production ; aucun seed de démonstration automatique. |

Flux : `feature/* → PR → develop → préproduction → PR de livraison → main → validation du candidat main en préproduction → déclenchement production → contrôles de disponibilité`.

Une fusion crée potentiellement un SHA différent de celui de `develop`. Le candidat exact de `main` doit donc être vérifié en préproduction avant la production. Un rapport mentionnant seulement « develop était vert » est insuffisant. Pendant cette recette, réserver la préproduction au candidat ; mettre les déploiements ordinaires en attente, ou utiliser une cible de recette isolée. Ne pas laisser une nouvelle livraison `develop` écraser les données ou le code en cours de recette.

Deux projets Vercel permettent d'isoler également les cron jobs : ils tournent sur la cible de production de chaque projet, dont l'un sert ici de préproduction. Les tâches de préproduction doivent conserver leurs fournisseurs de test. Les aperçus par PR sont optionnels : les premières itérations utilisent des tests locaux CI et une préproduction commune, sans provisionner une base payante par branche.

GitHub Actions pilote les déploiements via la CLI Vercel. Désactiver les déploiements Git automatiques concurrents de Vercel, afin qu'une fusion ne publie pas du code avant les contrôles. Épingler la CLI et les actions à des versions contrôlées ; pour les actions, préférer un SHA complet vérifié et des mises à jour suivies.

## 3. Contrôles automatiques avant fusion

Le workflow existant installe avec `npm ci`, valide Prisma et exécute lint, types, tests et build. En L1, le faire évoluer vers les jobs suivants. Les commandes nouvelles sont à ajouter au dépôt avec leurs suites ; elles ne sont pas encore disponibles.

| Job proposé | Exécution | Preuve / condition |
| --- | --- | --- |
| `qualite` | `npm ci`, génération Prisma, `npm run db:validate`, lint, types, tests unitaires ; analyse des dépendances et recherche de secrets | Échec bloquant ; dépendances reproductibles avec lockfile. |
| `integration` | PostgreSQL 17, MongoDB 8 et Mailpit ; migration versionnée sur base neuve ; fixtures ; tests de transactions, droits, concurrence, outbox et projection | Services déclarés prêts avant tests ; résultats JUnit et journaux expurgés en cas d'échec. |
| `parcours` | Services isolés, données d'essai, `npm run build`, serveur compilé, attente HTTP puis Playwright/axe | Chromium sur PR ; Firefox/WebKit avant livraison et changements à risque ; traces d'échec. |
| `validation` | Job récapitulatif dépendant des contrôles obligatoires | Nom stable utilisé comme contrôle requis sur `develop` et `main` ; ne réussit que si tous les jobs requis réussissent. |

Au démarrage, ces jobs peuvent rester peu nombreux et séquentiels pour limiter la configuration. La séparation ci-dessus évite surtout de confondre un test unitaire sans base et une transaction réellement exercée. Ne pas partager une base mutable entre jobs parallèles.

Prévoir `test:unit`, `test:integration`, `test:e2e` et un mode navigateurs de livraison. Conserver `npm test` pour l'usage local simple. Lancer les tests navigateur contre le build de production. Ne jamais exécuter `migrate dev`, `db push` ou un reset de base sur la production ; pour Prisma 7 verrouillé dans ce projet, utiliser le script existant `npm run db:deploy` basé sur `prisma migrate deploy`. [Documentation versionnée Prisma 7](https://www.prisma.io/docs/cli/v7/migrate/deploy).

Pour les PR externes, limiter les permissions à la lecture et ne fournir aucun secret de déploiement. Ne pas employer `pull_request_target` pour exécuter le code de la PR avec des secrets. Le workflow déployant un candidat utilise uniquement du code approuvé sur une branche durable.

Définir des délais maximum de jobs et annuler les anciennes CI d'une même PR. En revanche, ne pas annuler brutalement une migration ou une publication en cours. Un échec de contrôle bloque la fusion et les jobs de livraison associés. Garder 14 jours de rapports comme point de départ, avec traces seulement utiles et accès maîtrisé.

Le rapport historique de validation signale des alertes élevées dans la chaîne de développement ESLint. Les réévaluer en L0 ; ne pas les ignorer au motif qu'elles ne sont pas en production. Une exception éventuelle documente impact, responsable, mesure provisoire et échéance ; aucune rétrogradation majeure automatique pour faire disparaître un indicateur. Les dépendances d'exécution critiques/élevées non traitées bloquent la livraison.

## 4. Livraison automatique en préproduction

Après réussite des contrôles sur un push `develop`, un job de confiance appelle un workflow réutilisable de déploiement. Un candidat de `main` réutilise la même procédure. Ne pas déclencher une livraison sur le résultat d'un workflow provenant d'une PR non approuvée.

Ordre de travail :

1. Verrouiller l'environnement de livraison et identifier le SHA exact. Une seule migration/livraison active par environnement.
2. Charger les paramètres du projet Vercel de préproduction ; construire avec ses variables, sans les imprimer ni les archiver avec le rapport public.
3. Appliquer les migrations revues et compatibles avec l'application encore en ligne. Appliquer aussi les index/versions de projection MongoDB par un script dédié idempotent.
4. Publier le build de ce SHA dans le projet de préproduction et attendre son état prêt.
5. Charger les données d'essai nécessaires par une procédure explicitement réservée à cet environnement ; exécuter les parcours et contrôler les tâches différées.
6. Archiver URL, SHA, migrations, résultats et date ; indiquer clairement réussite ou échec.

La préproduction reçoit le socle dès L1. Les tests de livraison évoluent avec les fonctionnalités : disponibilité au départ, puis catalogue, compte, commande et traitement interne. Une santé HTTP verte n'autorise pas à annoncer tout le produit testé.

## 5. Mise en production contrôlée

Le workflow de production est déclenché manuellement depuis la branche `main`. Il reçoit un candidat identifié par son SHA et vérifie lui-même qu'il correspond à une livraison préparée depuis `main`, aux contrôles réussis et au candidat effectivement testé en préproduction. Il ne doit pas accepter arbitrairement une branche ou un artefact fourni par l'utilisateur du workflow.

| Étape | Action et protection |
| --- | --- |
| Vérifier le candidat | Contrôler SHA, provenance de l'artefact/rapport, succès CI, recette et absence d'anomalie bloquante. Si le commit n'est plus le candidat retenu, arrêter. |
| Autoriser | Validation du porteur de projet. Protection de l'environnement GitHub lorsque disponible ; compte seul : ne pas exiger une approbation par un second humain inexistant. |
| Préparer | Verrou de livraison production ; sauvegarde récente vérifiée, ancienne URL de déploiement conservée ; construire avec configuration de production avant de modifier les données. |
| Migrer | Appliquer uniquement les migrations versionnées déjà testées, sous identité de migration ; arrêter en cas d'erreur. Aucun reset ni migration destructive improvisée. |
| Déployer le candidat | Publication Vercel de production sans attribution immédiate du domaine, puis vérifications non destructives sur son URL. |
| Basculer | Promouvoir le déploiement vérifié vers le domaine de production ; contrôler pages publiques et disponibilité après bascule. |
| Tracer | Enregistrer SHA, identifiant de déploiement, migrations, approbation, résultats et tag de version ; suivre erreurs et outbox pendant la période d'observation. |

La CLI prend en charge `vercel deploy --prod --skip-domain`, puis `vercel promote` pour attribuer les domaines après vérification. La séquence finale sera éprouvée sur le projet de préproduction avec la version de CLI retenue. Ne pas réutiliser un build préproduction contenant ses valeurs publiques dans la production : même SHA source, construction adaptée à la cible. [Options de déploiement Vercel](https://vercel.com/docs/cli/deploy).

Les vérifications du candidat connecté aux données de production sont non destructives et n'envoient pas de faux e-mails clients. Les parcours de création complets s'exécutent en préproduction ; un éventuel compte technique de contrôle en production nécessite des données dédiées et une procédure approuvée. Les cron jobs et autres effets externes doivent être pris en compte pendant la bascule : le nouveau et l'ancien code peuvent brièvement coexister.

Le CDC prévoit un dépôt public : GitHub permet alors les protections d'environnement sur les plans courants. Sur dépôt privé, leur disponibilité dépend du plan ; les approbations de déploiement obligatoires ne sont pas incluses dans toutes les offres. Si elles sont absentes, conserver le déclenchement manuel après recette et les droits restreints, en indiquant que cela n'équivaut pas à un contrôle indépendant imposé par la plateforme. [Disponibilité des environnements GitHub](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).

Pour les branches : exiger PR et contrôle `validation` réussi, interdire les pushs forcés et les suppressions de `main`/`develop`, limiter les contournements et revoir les changements de workflows. Une revue indépendante est recommandée lorsqu'un autre relecteur est disponible ; sinon consigner l'auto-revue et conserver les contrôles sans créer un blocage permanent.

## 6. Migrations et retour à une version stable

La stratégie courante est additive : ajouter les nouvelles colonnes/tables, déployer le code compatible, effectuer une reprise de données contrôlée, puis supprimer l'ancien support dans une version ultérieure. Tester sur une copie représentative que l'ancien et le nouveau code fonctionnent avec le schéma pendant la transition.

La migration et la publication d'une fonction ne forment pas une transaction commune. Si une migration échoue, ne pas promouvoir le candidat. Si l'application échoue après une migration additive, rétablir le précédent déploiement compatible et corriger en avant. Ne pas croire qu'un retour Vercel remet PostgreSQL ou MongoDB dans leur état antérieur.

Pour pouvoir construire avant de migrer, ne pas interroger pendant le build des colonnes qui n'existent pas encore : rendre les parcours transactionnels à l'exécution et maîtriser les lectures de catalogue éventuellement préconstruites. Vérifier ce point lors de chaque évolution de schéma, avec validation explicite des variables serveur ; aucune URL locale de secours en environnement distant.

Une restauration de base est une procédure d'incident distincte : évaluer la perte de commandes depuis la sauvegarde, arrêter les écritures et les traitements si nécessaire, restaurer de manière coordonnée puis reconstruire les projections. Ne jamais la lancer automatiquement pour chaque échec de déploiement.

Les builds déjà réussis et anciens identifiants de déploiement permettent une reprise applicative rapide ; le stockage et l'accès à ces artefacts doivent être définis sans archiver de secrets de construction dans des artefacts publics. Un exercice sur préproduction vérifie le retour applicatif et la restauration séparément.

## 7. Traitements différés réellement durables

L'outbox SQL conserve événement, identifiant unique, type, version métier, payload minimisé, destinataires nécessaires, nombre d'essais, prochaine tentative et état de traitement. Séparer la progression des consommateurs e-mail et statistiques : la réussite de l'un ne doit pas perdre le travail restant de l'autre.

La commande, son historique et les intentions de notification/projection sont écrits dans une seule transaction PostgreSQL. Un traitement appelé chaque minute sélectionne les éléments dus, acquiert un bail atomique, traite un petit lot puis enregistre le résultat. Un bail expirant permet de reprendre après arrêt. Les appels réseau ne doivent pas maintenir une longue transaction SQL ouverte.

Prévoir :

- clé d'événement stable ; projection MongoDB par commande et version, empêchant doublons et événements anciens d'écraser les nouveaux ;
- délais et lots inférieurs à la limite de fonction ; gestion de concurrence avec baux SQL et contrôle du propriétaire du bail ;
- reprises avec délai croissant, nombre d'essais limité, état bloqué et outil de reprise contrôlé ;
- authentification du point d'entrée, par exemple `CRON_SECRET`, sans cache ni accès public aux données ;
- détection d'absence d'exécution, événements anciens et rapprochement périodique avec SQL ;
- procédure de reconstruction statistique et mise à jour du dernier rafraîchissement visible à l'administrateur.

Un déclencheur cron ne fournit pas de garantie de traitement à lui seul : des appels peuvent être manqués ou doublés et les erreurs ne sont pas automatiquement réessayées. L'outbox et ses réconciliations portent cette responsabilité. [Comportement des cron jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

Pour les e-mails, une panne après acceptation par le fournisseur et avant écriture du résultat peut produire un doublon au réessai. Choisir un fournisseur offrant une clé d'idempotence lorsque possible ; sinon décrire cette limite, conserver un identifiant de message stable et une procédure de rapprochement. Ne pas promettre « exactement un e-mail » sur la seule base d'un envoi SMTP.

Pour le matériel, distinguer mise en file, acceptation de l'envoi, éventuel événement de livraison et preuve de notification convenue en D05. L'échéance ne démarre pas silencieusement à la création de l'outbox. Les frais de 600 € suivent une décision métier tracée ; ils ne sont pas un prélèvement automatique.

Objectif initial proposé : notifications prises en charge sous cinq minutes hors incident et alerte si l'âge d'un événement prêt dépasse ce seuil. Il s'agit d'un objectif à mesurer, pas d'une garantie du fournisseur. Si les lots débordent, si le rattrapage excède les limites ou si les délais deviennent contractuels, déplacer le consommateur vers un worker/file managée sans modifier la transaction de commande. GitHub Actions planifié ne sert pas de moteur métier de production.

## 8. Secrets, sauvegardes et surveillance

| Paramètres | Emplacement prévu |
| --- | --- |
| Projet Vercel, organisation et jeton de déploiement | Secrets/variables GitHub de l'environnement concerné, avec droits minimums ; identifiants non secrets séparés des jetons. |
| Connexion SQL de migration | Secret GitHub utilisé seulement pour les étapes de migration de la cible ; pas exposé aux PR. |
| SQL applicatif, MongoDB, fournisseur e-mail, sessions, cron et stockage | Variables serveur Vercel propres à chaque projet ; aucune valeur secrète `NEXT_PUBLIC_`. |
| URL publique et paramètres de présentation | Variables publiques explicitement non sensibles, construites pour la bonne cible. |

Le compte applicatif SQL n'a pas les mêmes privilèges que le compte de migration. Les runners doivent pouvoir joindre les services avec TLS et une politique réseau adaptée ; vérifier cette faisabilité avant de choisir les fournisseurs. Ne pas ouvrir durablement une base à tout Internet pour contourner une difficulté de CI. Prévoir rotations, récupération des accès et droits des opérateurs.

Sauvegarder PostgreSQL avec la rétention décidée ; un objectif provisoire de perte maximale 24 h et de reprise en 4 h doit être validé et démontré, puis renforcé si nécessaire. Les images ont leur propre politique de récupération. MongoDB étant reconstruisible, conserver aussi scripts, index et définition des projections ; définir la sauvegarde éventuelle de ses données selon le besoin de reprise.

Surveiller la disponibilité HTTP, erreurs serveur, saturation des connexions SQL, échecs e-mail et retard d'outbox/projection. `/api/health` actuel ne mesure que la vie HTTP ; ajouter un contrôle de disponibilité des dépendances protégé et sans détails sensibles. Distinguer dépendances critiques SQL et dépendances dégradables MongoDB/e-mail pour éviter d'annoncer une panne globale trompeuse.

Proposer une sonde toutes les cinq minutes et des alertes vers le responsable désigné ; ajuster selon budget. Tester au moins une vraie alerte avant livraison. Tracer les changements de rôle, désactivations, transitions, annulations et décisions matériel sans journaliser mots de passe, jetons ou coordonnées complètes.

## 9. Mise en place progressive

| Moment | Configuration à produire |
| --- | --- |
| L0 | Dépôt GitHub, visibilité prévue, branches, règles disponibles, Issues/Projects et modèle de PR. |
| L1 | CI enrichie ; scripts de tests ; préproduction et bases isolées ; workflow réutilisable de livraison ; première migration approuvée et exercice de retour applicatif. |
| L3 | Outbox, reprise cron et e-mails de test ; secrets et alertes de traitement. |
| L4–L8 | Suites commande/permissions/concurrence ; migrations évolutives ; projection et vérifications de rattrapage. |
| L10 | Workflow manuel de production, sauvegardes-restauration démontrées, répétition complète de livraison, alertes et guide d'incident. |

Fichiers cibles : faire évoluer `.github/workflows/ci.yml`, ajouter un workflow réutilisable de déploiement, un workflow de préparation du candidat et un workflow manuel de production, puis une configuration de mises à jour des dépendances. Leur découpage final doit rester simple et conserver un lien explicite entre SHA, résultats et déploiement. Aucun de ces workflows supplémentaires n'est activé par le présent document.
