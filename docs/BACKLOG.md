# Backlog de démarrage — 20 octobre 2026

La [feuille de route détaillée](FEUILLE-DE-ROUTE.md) complète cette synthèse avec les lots L0–L10, les dépendances, charges proposées et preuves de sortie. Voir aussi le [plan de tests](PLAN-DE-TESTS.md), la [CI/CD](CI-CD.md) et les [décisions ouvertes](DECISIONS-A-VALIDER.md). Les états ci-dessous restent ceux du socle initial.

État actuel : L0/L1 local et lecture publique L2 développés, avec catalogue persistant, filtres, galerie, avis modérés en lecture et horaires du projet. 78 tests unitaires, 31 PostgreSQL et 12 parcours Chromium passent. F04/F10 restent partiels ; comptes, commandes et gestion interne restent à développer. Voir l'[avancement réel](AVANCEMENT.md) pour les décisions et preuves. Aucun jalon de préproduction n'est atteint. La table ci-dessous conserve l'état de départ.

| Lot | Exigences | État | Preuve attendue |
| --- | --- | --- | --- |
| Socle, charte, environnement et CI | Chapitres 7–11 | Initialisé | Installation, lint, types, tests, build |
| Validation données et contraintes SQL | Chapitre 7, MLD v0.1 | À arbitrer | Schéma relu, décisions, migration testée |
| Catalogue, filtres et détail | F01–F11 | À développer | Mobile, desktop, clavier, filtres et absence de résultats |
| Comptes, sessions et récupération | F12–F16, RM01–02 | À développer | Hash, sessions, expiration, limitation et contrôle serveur |
| Commande et outbox | F17–F23, RM05–07 | À développer après arbitrages | Transaction, stock concurrent, calcul serveur et e-mail rejouable |
| Espace client et suivi | F24–F28, RM08–12 | À développer | Propriété, verrouillage après acceptation, historique et matériel |
| Espace employé | F29–F33 | À développer | Habilitations, contact préalable et modération |
| Administration et statistiques | F34–F38 | À développer | Désactivation, projection MongoDB et reconstruction |
| Contact et notifications | F39–F41 | À développer | Anti-abus, persistance et livraison durable |
| Recette, RGAA, RGPD, Vercel | Chapitres 8, 11–13 | À réaliser | Parcours, audit, sauvegarde, reprise et préproduction |

Les six maquettes client ne réduisent pas le périmètre des espaces employé et administrateur.
