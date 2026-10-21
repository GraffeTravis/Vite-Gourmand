# Plan de développement de Vite & Gourmand

Version 1.0 du 20 octobre 2026. Plan proposé à partir des références disponibles et du code local. Les charges sont des estimations de réalisation restante, pas un engagement de délai.

L'objectif est de livrer une application utilisable depuis la consultation des menus jusqu'au traitement des commandes et au pilotage administratif. La réalisation conserve la stack retenue et avance par fonctionnalités complètes : interface, règles serveur, données, tests et vérification en préproduction dans le même lot.

Le dossier comprend trois compléments : [plan de tests](PLAN-DE-TESTS.md), [CI/CD et exploitation](CI-CD.md), [registre des décisions](DECISIONS-A-VALIDER.md). Les scénarios décrits sont à réaliser, sauf les neuf tests RM06/RM07 déjà présents dans le socle.

Suivi de réalisation : voir le [journal de développement](AVANCEMENT.md), ouvert le 20 octobre 2026. Les états décrits ci-dessous constituent le point de départ du plan ; ils ne remplacent pas ce journal actualisé.

## 1. Références et ordre de priorité

| Source examinée | Usage dans le plan |
| --- | --- |
| Cahier des charges v1.2, 22 pages, 7 octobre 2026 | Référence principale : F01–F41, RM01–RM12, stack, charte, livrables L01–L08 et recette. Fonctions pp. 5–7, règles pp. 8–9, architecture pp. 9–11, charte pp. 12–16, organisation et livraison pp. 17–22. |
| CDC initial et v1.1, PDF et Word | Historique des exigences. La copie PDF synchronisée du projet est identique au PDF initial ; elle ne remplace pas la v1.2. |
| Cadrage v0.1, PDF et Word, 5 octobre | Priorisation et parcours. Ses propositions graphiques initiales cèdent devant la charte v1.2. |
| MCD et MLD v0.1 du 15 octobre, notices, sources structurées et diagrammes | Proposition de données à valider ; contraintes, instantanés de commande et arbitrages à conserver. |
| Notice du prototype, rapports des 7 et 8 octobre, journaux de corrections et d'avancée jusqu'au 10 octobre, captures | Références d'interface et risques de régression. Le point actuel du journal prévaut sur les anciennes listes d'anomalies. Le lot 40 est clôturé ; le lot 41 reste partiel. |
| Charte SVG, planche des six écrans, aperçu HTML/CSS/JS | Supports secondaires. Les substitutions typographiques et valeurs de démonstration ne redéfinissent aucune règle. |
| README, architecture, backlog, références, validation du 20 octobre et code applicatif | Point de départ technique réellement disponible. Le profil développeur du 8 octobre apporte du contexte d'accompagnement ; ses constats techniques antérieurs au socle ne sont pas l'état actuel du code. |

Les originaux se trouvent dans le dossier parent de l'application, aux emplacements recensés dans [REFERENCES.md](REFERENCES.md). Aucun document source n'est modifié par ce plan. Le fichier Figma courant n'a pas été réaudité : les journaux et captures sont des preuves historiques, pas une nouvelle validation du design.

En cas d'écart : appliquer le CDC v1.2, conserver les corrections plus récentes compatibles, puis consigner la décision. Ne pas réintroduire une anomalie corrigée en recopiant une ancienne capture. Les écrans employé et administrateur doivent être conçus : les six maquettes client ne limitent pas le périmètre fonctionnel.

## 2. État de départ

Le dépôt applicatif est le sous-dossier `Vite&Gourmand/`, qui contient `package.json` et `.git`. Le dossier parent rassemble les références. Au contrôle du 20 octobre : branche locale `feature/initialisation`, aucun commit et aucun dépôt distant configuré. La création du dépôt GitHub et le premier commit restent donc à effectuer.

| Élément | État constaté | Conséquence |
| --- | --- | --- |
| Next.js, React, TypeScript, styles et polices locales | Socle présent ; accueil et catalogue initial sans données métier | Réutiliser le socle, compléter les pages au fil des lots. |
| PostgreSQL/Prisma, MongoDB, SMTP, Docker Compose | Connecteurs et environnement présents | Tester les opérations réelles et les pannes avant de les considérer comme une fonctionnalité livrée. |
| Modèle Prisma | Transcription de travail du MLD, 18 tables ; aucune migration versionnée | Valider les décisions concernées avant la migration initiale ; ajouter sessions, récupération et outbox. |
| Tests | Neuf cas unitaires RM06/RM07 dans `quantity.test.ts` | Étendre la couverture aux montants, transactions, permissions et parcours. |
| GitHub Actions | Workflow local : installation, validation Prisma, lint, types, tests, build | CI minimale écrite ; aucune preuve d'exécution sur GitHub à ce stade. |
| Déploiement | Aucun configuré | Mettre une préproduction en place tôt, avant la finalisation fonctionnelle. |
| Maquettes | Conception avancée et corrections documentées, validation globale incomplète | Contrôler les états utiles avant leur intégration ; prévoir les interfaces de gestion. |

Les contrôles techniques antérieurs sont consignés dans [VALIDATION.md](VALIDATION.md). Ce travail de planification ne réexécute pas ces contrôles et ne transforme pas leurs résultats historiques en nouvelle recette.

## 3. Architecture et périmètre de réalisation

L'application reste un monolithe modulaire Next.js App Router : un dépôt GitHub et un code applicatif, des modules métier séparés, Server Components par défaut et Client Components pour les interactions. PostgreSQL conserve les faits métier ; MongoDB contient une projection statistique reconstruisible. Docker Compose sert au développement et aux tests, Vercel à l'hébergement applicatif.

Modules prévus : identité et sessions, catalogue, commandes, avis, gestion employé, administration, statistiques, contact et notifications. Les Route Handlers et Server Actions délèguent aux services métier et vérifient session, rôle, propriété et données d'entrée. Les décisions sensibles sont prises côté serveur.

Une outbox PostgreSQL enregistre, dans la transaction métier, les événements à traiter ensuite. Un traitement borné reprend les e-mails et la projection MongoDB avec verrouillage, reprise et idempotence. La proposition de lancement pour une petite activité est détaillée dans [CI-CD.md](CI-CD.md) : pas de dépendance à une requête navigateur restant ouverte.

Dès L1, valider les variables obligatoires au démarrage selon l'environnement. Un déploiement distant doit échouer explicitement si une configuration manque, plutôt qu'utiliser silencieusement l'URL locale de développement. Les données transactionnelles ne doivent pas dépendre d'une lecture de base exécutée pendant la compilation.

La première version comprend tous les blocs obligatoires F01–F41. Paiement en ligne, panier multimenus, application native, microservices et inventaire matériel article par article restent hors du plan initial. Leur ajout constituerait une évolution à chiffrer.

## 4. Feuille de route ordonnée

Les charges incluent développement, tests du lot, revue, documentation courte et vérification de son intégration. Les jours d'attente de décisions ou d'accès ne sont pas compris. Une fonctionnalité traverse la CI avant fusion ; elle devient un jalon validé après vérification en préproduction.

| Lot | Travail que je peux réaliser | Dépendances et critère de sortie | Charge |
| --- | --- | --- | --- |
| L0 — Règles et organisation GitHub | Formaliser les décisions ; vérifier le socle ; préparer dépôt, branches, modèles d'issue/PR et tableau de suivi ; inventorier les références publiables | Décisions structurantes D01–D03 examinées avant les parties de modèle concernées ; premier historique propre et contrôles GitHub identifiés | 4–6 h |
| L1 — Données, tests et préproduction | Finaliser modèle validé et contraintes SQL ; ajouter supports techniques de sessions/outbox ; produire migration et jeux de test ; étendre CI avec bases éphémères ; déployer le socle en préproduction | L0 pour le schéma ; accès hébergeurs pour la partie distante. Migration sur base vide, seed rejouable, isolation des environnements et retour à la version précédente démontrés | 10–14 h |
| L2 — Site public et catalogue | Accueil, navigation, footer, catalogue connecté, filtres combinés, fiche menu et galerie ; composants accessibles ; états vide/erreur/chargement ; politique de mise à jour du catalogue | L1 pour les données. F01–F11 consultables sur mobile et bureau ; filtres sans rechargement complet ; aucune donnée fictive présentée comme réelle | 10–14 h |
| L3 — Comptes et notifications durables | Inscription, hash, sessions, connexion/déconnexion, récupération ; autorisations communes ; provisionnement contrôlé de l'administrateur ; outbox et premiers e-mails | L1, D08–D09. F12–F16, RM01–RM02 ; tests d'accès direct, expiration, abus et panne e-mail ; compte privilégié impossible par inscription publique | 12–18 h |
| L4 — Commande transactionnelle | Formulaire prérempli ; devis serveur ; quantité/remise/livraison ; réservation de stock ; création atomique commande/historique/outbox ; prévention des doublons | L2 + L3 ; D01–D03 et règles de prestation D04. F17–F23, RM05–RM07 ; concurrence et panne SMTP/MongoDB testées ; confirmation persistée et retrouvable | 18–26 h |
| L5 — Espace client, suivi et avis | Profil, liste/détail des commandes, modification et annulation autorisées, chronologie ; dépôt d'avis après clôture ; mail d'invitation | L4 ; D06 pour la contrainte d'avis. F24–F28, RM08 et partie client RM12 ; client A ne lit/modifie jamais les données de B | 10–14 h |
| L6 — Espace employé et matériel | Concevoir puis développer les écrans de gestion ; menus/plats/images/horaires ; filtres commandes ; transitions ; annulation motivée ; suivi du matériel ; modération | L4 + L5 ; D04–D05. F29–F33, RM03–RM04, RM09–RM12 ; parcours complet avec et sans prêt ; historique conservé | 12–18 h |
| L7 — Administration des comptes | Gestion des employés, désactivation et révocation de sessions ; accès aux fonctions employé ; journaux d'opérations sensibles | L3 + L6. F34–F36 ; employé sans accès administrateur ; compte désactivé inutilisable malgré une session déjà ouverte | 6–10 h |
| L8 — Statistiques MongoDB | Projection versionnée et idempotente ; agrégations et graphiques accessibles ; filtres menu/période ; rapprochement SQL et reconstruction | L4 + L7 ; D07. F37–F38 ; relecture d'événements sans double comptage, rattrapage après panne et chiffres justifiés | 10–14 h |
| L9 — Contact et contenus de livraison | Formulaire public et transmission durable ; protection anti-abus ; contenus légaux et CGV validés ; complétude des horaires et contenus publics | L2 + L3 ; D04, D09–D10. F39–F41 et F05 finalisés ; envoi rejouable, destinataire correct, sept jours renseignés | 6–10 h |
| L10 — Recette finale et mise en production | Régression complète ; sécurité/accessibilité/performance ; exercice de sauvegarde-restauration ; répétition de livraison ; documentation et manuel ; recette puis production | Lots fonctionnels terminés, D10–D12, contenus et budget validés. L01–L08 remis avec preuves et incidents résiduels explicités | 12–18 h |
| **Total hors réserve** | **Périmètre obligatoire restant** | **À réestimer après L1 et L4** | **110–162 h** |

Prévoir environ 20 % de réserve pour les reprises d'interface, intégrations hébergeur et anomalies : enveloppe de pilotage arrondie **130–200 heures**. À 20 h disponibles par semaine, cela représente environ **7 à 10 semaines**, hors attente et apprentissage supplémentaire. Cette estimation est une proposition issue du découpage, pas une mesure de vitesse de développement déjà constatée.

Les 70 h du CDC sont une indication initiale, pas une garantie compatible avec toutes les exigences de fiabilité et de livraison ci-dessus. Si cette enveloppe devient impérative, il faudra convenir d'un niveau de démonstration et de concessions documentées. Ne pas annoncer le périmètre complet livré en retirant silencieusement les espaces internes, MongoDB, les tests ou la reprise.

### Jalons et chemin critique

1. **J1, fin L1 : socle reproductible et préproduction disponible.** Code vérifié sur GitHub, migration éprouvée, secrets isolés et première procédure de livraison exécutée.
2. **J2, fin L4 : première commande réelle de test.** Catalogue → compte → prestation → transaction → e-mail de test → commande visible après rechargement. Ce jalon reste intermédiaire.
3. **J3, fin L7 : cycle opérationnel complet.** Le client et l'équipe traitent une commande avec ou sans matériel ; les permissions et les avis sont vérifiés.
4. **J4, fin L8–L9 : périmètre fonctionnel complet.** Statistiques, contact et contenus finalisés.
5. **J5, fin L10 : version livrable.** Recette, restauration et déploiement contrôlé réalisés ; documentation remise.

Chemin critique : décisions de prix/stock/livraison → modèle/migration → identité → commande → traitement métier → recette. L2 et la préparation graphique peuvent avancer pendant certains arbitrages ; les statistiques attendent des événements de commande stables. Le contact peut être avancé dès L3. Les tests, l'accessibilité et la documentation accompagnent chaque lot.

## 5. Organisation du dépôt GitHub

Respecter l'organisation du CDC : `feature/*` depuis `develop`, PR vers `develop`, puis PR de livraison de `develop` vers `main`. Les corrections urgentes partent de `main` et sont réintégrées dans `develop`. Utiliser des commits de fusion entre les branches durables pour conserver leur ascendance ; le squash convient aux branches courtes. Identifier chaque version livrée par un tag et son SHA.

Le CDC attend un dépôt public à la livraison (L01). Préparer ce résultat avec uniquement code, documentation publiable et données de démonstration. Exclure secrets, données personnelles réelles, accès administrateur, captures sensibles et le profil développeur. Les références placées aujourd'hui hors du dépôt nécessiteront un index portable et, pour les pièces autorisées, une copie versionnée dans `docs/references/` ; ne pas compter sur des liens vers le dossier parent dans GitHub.

Utiliser GitHub Issues et Projects comme outil de suivi : À préciser → Prêt → En cours → En revue → À vérifier en préproduction → Terminé. Une issue contient l'exigence, le résultat utilisateur, la dépendance, les critères d'acceptation, les tests, le responsable et la preuve. Relier chaque PR à son issue et à son lot.

Le premier commit peut établir le socle sur `main`, puis matérialiser `develop` depuis ce point, sans historique artificiel. La branche locale d'initialisation doit être rangée selon cette opération. Ne pas versionner les dossiers de dépendances ni les fichiers d'environnement locaux.

## 6. Conditions d'entrée et de sortie d'une fonctionnalité

Une tâche est prête lorsque sa règle métier est claire, ses données sont connues, ses droits sont définis et ses résultats attendus sont écrits. Un point ouvert ne bloque que les tâches qui en dépendent : le registre précise ce découpage.

Une fonctionnalité est terminée lorsque :

- elle remplit les critères F/RM concernés, avec contrôles serveur et messages compréhensibles ;
- les tests prévus passent, y compris les refus et les erreurs pertinents ;
- son interface est utilisable au clavier et aux formats prévus ;
- les migrations et les données d'essai sont reproductibles ;
- sa PR a passé les contrôles et sa documentation est mise à jour ;
- elle a été vérifiée sur la préproduction cible avec une preuve liée au commit.

Le [plan de tests](PLAN-DE-TESTS.md) définit les cas et niveaux ; [CI-CD.md](CI-CD.md) précise les portes de livraison. Un bouton désactivé, une capture Figma ou un e-mail simplement mis en file ne constitue pas une preuve d'exécution métier.

## 7. Ce que je peux prendre en charge

| Travail | Modalité |
| --- | --- |
| Code, migrations de revue, composants, tests, jeux d'essai, workflows, documentation, analyse des erreurs et correctifs | Réalisable dans le dépôt, avec preuves et revue par lot. |
| Dépôt/PR GitHub, règles de branche, préproduction, secrets, services managés et déploiements | Réalisable lorsque les accès et le cadre de publication sont disponibles ; aucun service distant n'est créé par ce document. |
| Règles de prix, stock, matériel, contenus réels, politique de conservation, budget et acceptation produit | Décisions du porteur de projet/client ; je peux préparer les options et leurs conséquences. |
| Recette visuelle et d'accessibilité | Contrôles automatisés et manuels documentables ; les vérifications nécessitant un appareil ou lecteur d'écran indisponible restent explicitement à effectuer. Aucune certification déduite d'un score automatique. |

Les livrables attendus restent ceux du CDC : dépôt public et historique, application déployée, scripts SQL/NoSQL, manuel utilisateur PDF, charte et exports graphiques, documentation projet et technique, dossier de recette. Les identifiants de démonstration sont fournis par un canal adapté, révocables et limités à des données fictives ; aucun mot de passe privilégié dans le dépôt public.

## 8. Première séquence de travail

Commencer par L0 : formaliser D01–D03, confirmer le sens des filtres et préparer le dépôt GitHub. Puis effectuer L1 : modèle corrigé, première migration sur bases jetables, jeux d'essai et tests d'intégration, CI enrichie et préproduction du socle. Ce résultat rendra L2–L4 vérifiables sans attendre la fin du projet.

À chaque jalon, mettre à jour l'avancement réel, les décisions, les risques et le reste à faire. Le présent plan ne vaut ni validation du MLD, ni recette de l'application, ni activation de la CI/CD distante.
