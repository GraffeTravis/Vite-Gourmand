# Plan de tests dès le début du développement

20 octobre 2026. Complément de la [feuille de route](FEUILLE-DE-ROUTE.md). La matrice décrit la cible de vérification complète ; seuls les résultats explicitement consignés dans le journal sont acquis.

Mise à jour du lot catalogue : **78 tests unitaires, 31 tests PostgreSQL et 12 scénarios Chromium bureau/mobile réussis localement**, avec rapports JUnit. Les parcours couvrent filtres combinés sans rechargement, galerie, erreurs/réessai, réponses dépassées, horaires, clavier et axe sur catalogue/fiche. Publication, pagination, minimisation des données publiques et horaires ont des tests PostgreSQL dédiés. Voir [AVANCEMENT.md](AVANCEMENT.md). F04/F10 restent partiels ; les scénarios ci-dessous restent la cible complète : le primitif concurrent de stock ne valide pas à lui seul T11, et l'écriture d'outbox ne valide pas le worker de T26. Ces résultats ne constituent ni une recette multi-navigateurs ni une certification RGAA.

## 1. Méthode et moyens

Avant chaque fonctionnalité, écrire le scénario réussi, les refus attendus, les cas limites et les pannes pertinentes. Les règles métier critiques sont testées avant ou avec leur implémentation ; une capture de succès ne remplace pas une assertion sur les données.

| Niveau | Outil prévu | Ce qu'il vérifie | Moment |
| --- | --- | --- | --- |
| Contrôles statiques | ESLint, TypeScript strict, Prisma validate | Types, conventions, frontière serveur/client et cohérence du schéma | Chaque PR |
| Unitaire | Vitest, horloge et adaptateurs contrôlés | Calculs, validations, calendrier, permissions et transitions pures | Chaque PR |
| Intégration | Vitest + vrais PostgreSQL 17 et MongoDB 8 jetables ; Mailpit | Transactions, contraintes, requêtes, concurrence, projection et capture d'e-mails | Dès L1 ; chaque PR |
| Composants interactifs | Testing Library lorsque nécessaire | Erreurs de formulaire, focus, filtres et états d'attente ; pas de test de chaque détail de présentation | Avec les composants concernés |
| Parcours navigateur | Playwright sur un build de production | Pages et services réels, cookies, formulaires, navigation et persistance | Dès L2, étoffé à chaque lot |
| Accessibilité | axe dans Playwright + vérifications manuelles | Défauts automatisables, clavier, zoom, lecture des erreurs, dialogues et technologies d'assistance | À chaque lot puis recette |
| Exploitation | Scénarios de panne, restauration et retour de version | Rattrapage, sauvegardes et livraison reproductible | L1 première répétition ; L10 exercice complet |

Chromium couvre les parcours critiques de chaque PR. Firefox et WebKit couvrent ces parcours à la livraison et lors des changements d'authentification, navigation ou formulaires. Une exécution planifiée n'est utile que si elle surveille une application de test maintenue. WebKit automatisé ne remplace pas une vérification sur un véritable appareil Safari lorsque celui-ci fait partie de la recette.

## 2. Données et isolation

- Base PostgreSQL neuve par job ; migrations versionnées appliquées par `npm run db:deploy`. Tester aussi une mise à niveau depuis la version précédente avec données existantes.
- Rôles et statuts en seed rejouable ; fixtures distinctes pour comptes, menus et commandes de test. Aucun compte privilégié de production créé par le seed de démonstration.
- Deux clients A/B, un employé, un administrateur et un compte désactivé. Menus de minima 8, 10, 12 et 20 ; prix à décimales ; stocks nul, un et plusieurs ; menus actifs, archivés et en édition.
- Commandes à chaque statut, avec/sans matériel ; avis en attente/accepté/refusé ; contacts valides et invalides. Mots de passe de test limités aux environnements jetables.
- Dates fixes, fuseau métier explicite ; cas de changement d'heure Europe/Paris et de jours fériés selon D04/D05. Ne jamais dépendre de la date réelle du runner.
- Horloge, service de distance et fournisseur e-mail simulables pour les cas limites ; bases et transactions réelles pour leurs tests d'intégration.
- Envois capturés par Mailpit ou fournisseur de test. Pas d'e-mail vers un client réel et pas de restauration de production dans une préproduction sans traitement adapté.
- Isolation des suites et identifiants uniques ; aucun test ne dépend de l'ordre d'un autre. Les traces navigateur peuvent contenir des données : accès et durée de conservation limités.

## 3. Matrice des risques et résultats attendus

**P0** : intégrité des commandes, calculs, permissions et reprise ; bloquant pour la livraison. **P1** : fonctions requises, présentation exploitable et compatibilité ; à résoudre avant recette, ou réserve explicitement acceptée si elle n'affecte pas une obligation. Les propositions dépendant d'une décision Dxx ne sont pas des règles déjà approuvées.

| ID | Exigences / risque | Cas et résultat attendu | Niveau / priorité / lot |
| --- | --- | --- | --- |
| T01 | F01–F07, F11 ; publication | Public connecté ou non ; menus réellement publiés seulement ; conditions et sept jours d'horaires visibles ; seuls avis approuvés affichés | Intégration + navigateur / P1 / L2 puis L9 |
| T02 | F08 ; filtres | Maximum, fourchette, thème, régime, minimum et combinaisons ; réinitialisation ; zéro résultat ; paramètres invalides ; réponses asynchrones dans le désordre sans écraser le dernier choix ; absence de rechargement complet | Unitaire + navigateur / P1 / L2, D13 |
| T03 | F09–F10, RM03–RM04 ; détail | Images/alternatives, plats et allergènes cohérents ; plat partagé ; stock nul ou menu archivé ; menu choisi conservé après connexion ; aucune absence d'allergène supposée | Intégration + navigateur / P1 / L2 |
| T04 | F12–F14, RM01–RM02 ; inscription | Champs requis ; mot de passe 9/10 caractères et chaque catégorie manquante ; e-mail normalisé et doublon simultané ; rôle ADMIN/EMPLOYEE injecté refusé ; bienvenue mise en file atomiquement ; aucun mot de passe dans les logs | Unitaire + intégration / P0 / L3 |
| T05 | F15 ; session | Connexion valide/invalide ; compte inconnu et mot de passe incorrect sans révélation inutile ; limitation persistante des essais ; cookies protégés ; expiration ; déconnexion et ancien cookie inutilisable | Intégration + navigateur / P0 / L3 |
| T06 | F16 ; récupération | Compte existant/inconnu avec réponse publique uniforme ; jeton à durée limitée, stocké de façon sûre, unique ; jeton erroné/expiré/réutilisé et deux usages concurrents ; nouveau mot de passe conforme ; révocation des sessions selon politique | Intégration + navigateur / P0 / L3 |
| T07 | Tous espaces ; autorisations | Pour chaque lecture/mutation sensible : visiteur, client A, client B, employé, admin, désactivé ; appel direct de la Route Handler/Server Action ; manipulation d'identifiant ; lecture et écriture interdites sans fuite ni effet secondaire | Intégration / P0 / L3–L9 |
| T08 | F17–F19 ; prestation | Coordonnées préremplies mais adresse de prestation distincte ; date passée, format incorrect, créneau interdit ; lieu requis ; fuseau et changement d'heure ; conservation des champs après erreur | Unitaire + navigateur / P1 / L4, D04 |
| T09 | F20–F21, RM06–RM07 ; quantité | Pour chaque minimum m : m−1 refusé, m et m+4 sans remise, m+5 et m+6 à 10 % ; zéro, négatif, fraction, NaN, infini et entier non sûr refusés | Unitaire / P0 / L4 ; neuf cas déjà présents à étendre |
| T10 | F21–F22, RM05 ; prix | Decimal, arrondi convenu, prix par unité validée ; Bordeaux/hors Bordeaux ; distance nulle/fractionnaire/indisponible ; livraison séparée de la remise ; prix/total/remise/distance falsifiés dans la requête sans effet ; changement de prix entre devis et confirmation signalé | Unitaire + intégration / P0 / L4, D01/D03 |
| T11 | Stock et concurrence | Deux connexions et transactions réellement simultanées sur la dernière disponibilité ; une seule réussite ; aucun stock négatif ; stock restauré une seule fois à annulation ; modification de quantité cohérente | Intégration / P0 / L4, D02 |
| T12 | F23 ; transaction | Erreur injectée après création de commande ou historique : rollback complet ; commit réussi : commande + statut Reçue + premier historique + événements outbox cohérents ; instantanés préservés après modification du profil/menu | Intégration / P0 / L4 |
| T13 | F23 ; double soumission | Double clic, même requête rejouée, coupure après commit puis réessai avec même clé : une seule commande ; clé réutilisée avec contenu différent refusée ; réponse retrouvable sans nouvel envoi métier | Intégration + navigateur / P0 / L4 |
| T14 | F24–F25 ; espace client | Liste et détail appartenant au client ; profil valide/invalide ; changement du profil sans réécriture des anciennes commandes ; rechargement et nouvelle session conservent les données | Intégration + navigateur / P1 / L5 |
| T15 | F26, RM08 ; modification | Reçue : champs autorisés modifiables, menu inchangé ; Acceptée et suivantes : mutation refusée ; annulation rejouée sans double libération ; course acceptation employé/modification ou annulation client : une issue cohérente, aucun historique impossible | Intégration / P0 / L5–L6 |
| T16 | F27, F31 ; statuts | Graphe de transitions autorisé ; saut/retour illégitime refusé ; état et historique dans la même transaction, auteur et date exacts ; deux mises à jour concurrentes détectées ; absence de clôture contournant le retour matériel | Unitaire + intégration / P0 / L6 |
| T17 | F32, RM09 ; annulation équipe | Motif, canal, date et trace de contact requis ; contact antérieur à l'annulation ; acteur habilité ; échec sans écriture partielle ; conservation dans le suivi interne | Intégration + navigateur / P0 / L6 |
| T18 | RM10–RM11, F41 ; matériel | Cycle avec/sans prêt ; notification seulement après envoi confirmé au niveau convenu ; 9/10/11 jours ouvrés, week-end, jour férié et limite horaire ; panne/reprise ; 600 € appliqués une fois selon décision ; restitution empêche frais futurs ; prix initial non réécrit | Unitaire + intégration / P0 / L6, D05 |
| T19 | F28, F33, RM12 ; avis | Interdit avant Terminée ; propriétaire seulement ; notes 0/1/5/6 ; unicité si confirmée ; avis en attente/refusé invisible ; approbation visible même après mise en cache ; commentaire HTML/script affiché sans exécution | Intégration + navigateur / P0 / L5–L6 |
| T20 | F29, RM03–RM04 ; gestion catalogue | CRUD et validation ; répercussion publique après modification ; téléversement d'image autorisé, type/taille contrôlés, nom sûr ; suppression d'un menu référencé refusée ou archivage ; plats/allergènes partagés et ordre préservés | Intégration + navigateur / P1 / L6 |
| T21 | F30 ; recherche interne | Filtres statut/client seuls et combinés ; pagination stable ; aucune liste complète de données clients exposée au public | Intégration + navigateur / P1 / L6 |
| T22 | F34–F36 ; employés | Création par admin seulement ; doublon ; notification sans mot de passe ; désactivation conserve l'historique et invalide les sessions actives ; employé ne crée ni admin ni employé | Intégration + navigateur / P0 / L7 |
| T23 | F37–F38 ; statistiques | Jeux SQL de référence ; nombre et montants selon D07 ; bornes de période et fuseau ; menus sans commande ; annulation/modification répercutées ; graphique avec alternative tabulaire ; accès admin uniquement | Intégration + navigateur / P0 / L8 |
| T24 | Synchronisation MongoDB | Même événement rejoué et événements dans le désordre : état final correct ; panne MongoDB n'annule pas la commande ; rattrapage et reconstruction complète rapprochés de SQL ; dernier rafraîchissement affiché | Intégration / P0 / L8 |
| T25 | F39–F40 ; contact | Titre/description/e-mail requis ; limites, anti-abus et injection d'en-têtes ; persistance et outbox atomiques ; destinataire entreprise, Reply-To utilisateur validé ; erreur SMTP reprise sans faux « reçu par l'entreprise » | Intégration + navigateur / P1 / L9 |
| T26 | F14, F16, F23, F28, F41 ; notifications | Tous modèles et liens ; origine d'URL configurée ; aucune donnée sensible inutile ; arrêt avant/après acceptation fournisseur ; réessais, bail expiré et événement bloqué visibles ; doublon limité selon capacités fournisseur | Intégration / P0 / dès L3 |
| T27 | Sécurité transverse | Entrées et tailles validées ; injection SQL/XSS ; CSRF/origine pour mutations selon mécanisme ; redirection externe non autorisée ; secrets absents du bundle/client/logs ; pages privées hors cache partagé ; fichiers et opérations privilégiés protégés | Intégration + contrôles / P0 / chaque lot |
| T28 | UX et accessibilité | Six parcours sur mobile/bureau ; états initiaux, vide, erreur, attente, réussite et indisponibilité ; labels/erreurs annoncés ; focus et dialogues ; contraste, statut textuel ; pas de boutons de démonstration dans le produit | axe + navigateur + manuel / P1 / chaque lot |
| T29 | Performance et compatibilité | Images optimisées, pagination ; absence de requêtes répétées par carte ; catalogue réaliste ; filtres et commande sous concurrence modérée ; Chrome/Firefox/WebKit et appareils retenus | Mesures + navigateur / P1 / L2/L4/L10 |
| T30 | Migrations et exploitation | Installation depuis clone ; migration base vide et version précédente ; seed rejoué ; sauvegarde restaurée ; ancien code compatible avec migration additive ; rollback applicatif ; panne SQL explicite sans fausse confirmation | Intégration + exercice / P0 / L1/L10 |
| T31 | Protection des données | Données retournées minimisées ; logs expurgés ; accès aux sauvegardes ; rectification ; anonymisation/suppression selon D10 avec historique légalement conservé et projection reconstruite ; aucun jeu réel dans les tests | Intégration + revue manuelle / P0 / L10 |

## 4. Parcours de recette de bout en bout

| Parcours | Résultat à observer |
| --- | --- |
| Visiteur → filtre → détail → inscription → commande | Menu conservé, bon préremplissage, total détaillé, commande persistée, confirmation capturée, espace client mis à jour. |
| Client → modification puis annulation d'une commande Reçue | Prix/stock/historique cohérents ; menu non modifiable ; actualisation visible après rechargement. |
| Employé accepte pendant une action client | Contrôle atomique ; aucune modification client après acceptation ; message compréhensible. |
| Employé → préparation → livraison → clôture sans matériel | Historique daté et invitation à déposer un avis ; client dépose, employé modère, accueil actualisé. |
| Commande avec matériel → notification → retour → clôture | Échéance correcte, preuve de traitement, retour conservé et absence de clôture anticipée. |
| Administrateur → création/désactivation d'un employé → statistiques | Ancienne session employé refusée, historique conservé, agrégats MongoDB rapprochés des commandes. |
| Contact avec panne e-mail puis reprise | Demande enregistrée, erreur observable, envoi repris avec les bonnes informations. |
| Panne MongoDB et arrêt du traitement différé | Commande maintenue dans SQL, événements rattrapés, indicateurs remis à jour sans double compte. |

## 5. Contrôles manuels qui restent nécessaires

Tester le clavier seul, l'ordre du focus, l'ouverture/fermeture des dialogues, la lecture des erreurs et des mises à jour, le zoom à 200 % et le réagencement à fort agrandissement. Vérifier au moins 390 px et 1440 px, plus une largeur tablette et une largeur étroite de contrôle. Utiliser un lecteur d'écran disponible sur les parcours inscription, commande et suivi. Tester sur appareil réel les cas retenus au registre D12.

Revoir les contrastes de tous les états et respecter le CDC : texte noir sur les boutons terracotta ; texte encre pour les petits badges sur crème ; couleurs accompagnées de libellés. Contrôler visuellement les captures de régression avant toute mise à jour de référence.

Ces contrôles produisent un relevé d'anomalies et de critères vérifiés. axe, Lighthouse, une comparaison d'images ou une collection de captures ne constitue pas un audit RGAA complet.

## 6. Règles de validation et preuves

Chaque PR doit faire passer les contrôles statiques et tests applicables. Dès qu'un lot ajoute une mutation, ses tests d'intégration et de refus sont obligatoires. Les tests P0 des parcours livrés bloquent les fusions et la livraison. Une mesure de couverture sert à trouver les trous, sans substituer un pourcentage global à ces scénarios ; aucun seuil arbitraire n'est imposé à tout le squelette.

Pour la performance, établir une mesure sur préproduction en L2 puis convenir des budgets en L4 : proposition de départ, catalogue sur 100 menus et jusqu'à 10 utilisateurs de test concurrents, sans erreur serveur ni incohérence de stock. Les tailles et budgets de temps seront ajustés au volume attendu et au service choisi ; ne pas présenter ce scénario comme un test de forte charge. Lighthouse sert de tendance reproductible, pas de preuve unique.

Conserver dans GitHub Actions les résultats de tests, la couverture utile et les traces d'échec, avec une durée courte proposée de 14 jours. Le dossier de recette lie chaque résultat à : exigence F/RM, ID Txx, jeu de données, navigateur/environnement, commit, date, résultat attendu/observé et anomalie éventuelle. Les scénarios non exécutés restent marqués « non exécuté ».

Une anomalie corrigée reçoit un test de non-régression au niveau le plus pertinent. Un test instable n'est pas contourné par des relances illimitées ; identifier sa cause. Les actions destructives et pannes simulées s'exécutent sur des données jetables, jamais sur la production réelle.
