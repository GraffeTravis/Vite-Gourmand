# Journal de développement

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
