# Architecture initiale

Monolithe modulaire Next.js App Router, React et TypeScript strict. Server Components par défaut. Les interactions seules justifient un Client Component. Aucun serveur Express séparé, aucun paiement ni panier multimenus.

- `src/app` : routes, pages et enveloppe visuelle.
- `src/modules` : domaines métier ; quantité et tarification D01 dans `orders/domain`. Montants calculés en centimes entiers, transférés et persistés sous forme décimale exacte.
- `src/server` : accès PostgreSQL/Prisma, pilote officiel MongoDB, transport SMTP, configuration et enregistrement transactionnel d'outbox. Les points d'accès importent `server-only` ; la validation pure de configuration reste testable sous Node.js.
- `prisma` : modèle de travail issu du MLD v0.1, D01/D02 et supports techniques sessions/récupération/outbox ; référentiels rejouables ; deux migrations de revue appliquées uniquement sur bases de test jetables.
- `tests/integration` et `scripts/test-integration.ts` : vérifications réelles PostgreSQL, base indépendante créée et supprimée à chaque exécution. Aucun recours à la base applicative.
- `docs` : décisions, périmètre, backlog et preuves.

Les futurs domaines sont auth, menus, orders, reviews, administration, statistics et contact. Chaque domaine sépare validation, service serveur, accès aux données et composants lorsque ces responsabilités existent. Les dossiers vides et faux endpoints ne sont pas ajoutés.

PostgreSQL porte les faits métier. MongoDB sera une projection analytique reconstruisible, alimentée par outbox transactionnelle avec reprise et idempotence. Le transport SMTP n'est pas encore un système d'envoi durable. Ne pas envoyer les notifications métier sans stockage transactionnel de leur intention et traitement différé adapté à Vercel.

`enqueueEvent` exige la transaction de l'appelant et écrit événement et états consommateurs ensemble. Une clé d'événement unique empêche de réécrire une intention existante. Le worker à baux, la reprise, les appels fournisseur et les projections restent à développer ; la présence des colonnes ne prouve pas leur exécution. Une réussite SMTP future signifiera acceptation du message, pas lecture du destinataire.

`scripts/run-next.ts` valide la configuration avant de lancer dev/start dans le même processus ; `src/instrumentation.ts` réitère ce contrôle au démarrage du serveur Node.js. La configuration Next.js bloque aussi les builds distants mal configurés. Aucun paramètre manquant n'est remplacé par une URL locale dans Prisma. Le build demeure indépendant d'une connexion aux bases.

Avant chaque mutation : session vérifiée côté serveur, rôle, propriété, validation et recalcul métier. Ne jamais accepter prix, rôle ou statut sensibles directement du navigateur. Les contraintes conditionnelles du MLD (historique atomique, auteur humain, annulation équipe, modération et publication) exigent services et contraintes SQL complémentaires.

`GET /api/health` vérifie uniquement que le processus HTTP répond. Il ne certifie ni les bases ni SMTP.

Les polices sont distribuées localement par les packages Fontsource, sans appel Google Fonts au démarrage. Les tokens reprennent le CDC v1.2, y compris bordure #E4D8CA et footer bordeaux. Les maquettes et données fictives restent des références de conception, sans publication comme faits réels.
