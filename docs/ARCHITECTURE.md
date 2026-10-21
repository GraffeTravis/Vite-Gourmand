# Architecture applicative

Monolithe modulaire Next.js App Router, React et TypeScript strict. Server Components par défaut. Les interactions seules justifient un Client Component. Aucun serveur Express séparé, aucun paiement ni panier multimenus.

- `src/app` : routes, pages et enveloppe visuelle.
- `src/modules` : quantité et tarification D01 dans `orders/domain`, catalogue dans `menus`, horaires et avis publiés dans `public`. Montants calculés en centimes entiers, transférés et persistés sous forme décimale exacte.
- `src/server` : accès PostgreSQL/Prisma, pilote officiel MongoDB, transport SMTP, configuration et enregistrement transactionnel d'outbox. Les points d'accès importent `server-only` ; la validation pure de configuration reste testable sous Node.js.
- `prisma` : modèle de travail issu du MLD v0.1 et des décisions reçues ; quatre migrations additives appliquées localement ; référentiels rejouables et initialisations distinctes des horaires et menus de démonstration. Aucun compte initial. Les supports neutres sessions/récupération/outbox ne valent pas implémentation de l'authentification.
- `tests/integration`, `tests/e2e` et leurs lanceurs : PostgreSQL indépendant créé et supprimé par chaque suite, sans repli vers la base applicative ; Playwright/axe contre le build de production, sur Chromium bureau et mobile.
- `docs` : décisions, périmètre, backlog et preuves.

Les futurs domaines sont auth, gestion des commandes, modération, administration, statistics et contact. Chaque domaine sépare validation, service serveur, accès aux données et composants lorsque ces responsabilités existent. Les dossiers vides et faux endpoints ne sont pas ajoutés.

Le catalogue est lu à l'exécution, sans accès métier pendant le build. Le serveur sélectionne uniquement les menus actifs avec images, plats et allergènes vérifiés. La migration 003 contrôle la publication en fin de transaction ; une modification de composition invalide la vérification. Les exemples `IS_DEMO` sont exclus des lectures de production. Les images publiques sont actuellement des fichiers locaux contrôlés ; le téléversement persistant reste en D11/L6.

`GET /api/menus` valide les paramètres, renvoie des DTO sans coordonnées client et désactive le cache partagé. Compte, liste et facettes sont lus dans une transaction à instantané cohérent. Les filtres se combinent en ET ; le navigateur annule les lectures dépassées et refuse qu'une réponse ancienne remplace le dernier choix. Les horaires PostgreSQL TIME représentent l'heure locale d'accueil à Bordeaux : leur affichage ne les convertit pas vers le fuseau du visiteur. La migration 004 refuse intervalles incohérents, fermeture contradictoire et chevauchement.

PostgreSQL porte les faits métier. MongoDB sera une projection analytique reconstruisible, alimentée par outbox transactionnelle avec reprise et idempotence. Le transport SMTP n'est pas encore un système d'envoi durable. Ne pas envoyer les notifications métier sans stockage transactionnel de leur intention et traitement différé adapté à Vercel.

`enqueueEvent` exige la transaction de l'appelant et écrit événement et états consommateurs ensemble. Une clé d'événement unique empêche de réécrire une intention existante. Le worker à baux, la reprise, les appels fournisseur et les projections restent à développer ; la présence des colonnes ne prouve pas leur exécution. Une réussite SMTP future signifiera acceptation du message, pas lecture du destinataire.

`scripts/run-next.ts` valide la configuration avant de lancer dev/start dans le même processus ; `src/instrumentation.ts` réitère ce contrôle au démarrage du serveur Node.js. La configuration Next.js bloque aussi les builds distants mal configurés. Aucun paramètre manquant n'est remplacé par une URL locale dans Prisma. Le build demeure indépendant d'une connexion aux bases.

Avant chaque mutation : session vérifiée côté serveur, rôle, propriété, validation et recalcul métier. Ne jamais accepter prix, rôle ou statut sensibles directement du navigateur. Les contraintes conditionnelles du MLD (historique atomique, auteur humain, annulation équipe, modération et publication) exigent services et contraintes SQL complémentaires.

`GET /api/health` vérifie uniquement que le processus HTTP répond. Il ne certifie ni les bases ni SMTP.

Neon et Atlas sont raccordés via les connecteurs existants. PostgreSQL reste Prisma/pg, avec pool partagé et gestion du cycle de vie Vercel ; MongoDB conserve le pilote officiel avec pool borné. L'application utilise `DATABASE_URL` mutualisée et les migrations `DATABASE_URL_UNPOOLED` quand elle existe. Les transactions et connexions ont des délais bornés adaptés au démarrage distant. Les tests forcent les deux URL SQL vers leur base jetable. `services:check` vérifie les connecteurs sans exposer de secret ; ses écritures exigent des cibles isolées. Voir [NEON-ATLAS.md](NEON-ATLAS.md).

Les polices sont distribuées localement par les packages Fontsource, sans appel Google Fonts au démarrage. Les tokens reprennent le CDC v1.2, y compris bordure #E4D8CA et footer bordeaux. Les maquettes et données fictives restent des références de conception, sans publication comme faits réels.
