# Déploiement Vercel — 21 octobre 2026

Projet existant : [travis22/vitegourmand](https://vercel.com/travis22/vitegourmand), relié au dépôt GitHub. Domaine de production vérifié : [vitegourmand.vercel.app](https://vitegourmand.vercel.app). Les premiers builds échouaient parce que le projet utilisait le preset générique et ne contenait aucune variable serveur. Le résultat effectif de cette livraison est consigné dans le journal.

## Configuration versionnée

`vercel.json` impose Next.js, `npm ci`, `npm run build` et la région `fra1`, proche du projet Neon de Francfort. Node est fixé à `24.x` dans le projet et le lockfile. `.vercelignore` exclut les configurations locales, secrets, contexte Neon, fichiers Git, dépendances et rapports de tests de l'envoi CLI. Prisma est généré à l'installation et à la compilation.

Les migrations ne tournent jamais au démarrage ni pendant le build Vercel. Les quatre migrations et les référentiels ont déjà été appliqués sur Neon après accord : [preuves et limites](NEON-ATLAS.md). La connexion SQL directe de migration n'est pas transmise à Vercel.

## Paramètres de production

Les valeurs sont enregistrées comme variables sensibles dans Vercel, uniquement pour `production`. Aucune valeur réelle n'est versionnée ni affichée dans les rapports.

| Variable | Configuration |
| --- | --- |
| `APP_ENV` | `production` |
| `APP_URL` | Origine HTTPS du domaine de production vérifié |
| `DATABASE_URL` | Connexion Neon mutualisée, TLS vérifié |
| `MONGODB_URI`, `MONGODB_DATABASE` | Connexion et base Atlas du propriétaire |
| `MAIL_TRANSPORT` | `disabled`, aucun fournisseur d'e-mails créé à ce stade |
| `READINESS_SECRET` | Jeton aléatoire de contrôle interne, conservé dans un fichier local ignoré et dans Vercel |

Le mode `MAIL_TRANSPORT=disabled` permet d'afficher le catalogue sans prétendre disposer d'un service d'envoi. La création d'un transport d'e-mails échoue explicitement dans ce mode. Une activation future exige `MAIL_TRANSPORT=smtp`, un vrai fournisseur distant, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` et les éventuels `SMTP_USER`/`SMTP_PASSWORD` ensemble. Sans mode explicite, SMTP reste obligatoire. Les protections HTTPS et bases distantes restent actives dans les deux modes.

## Contrôles de livraison

- `GET /api/health` vérifie seulement que le serveur répond.
- `GET /api/internal/readiness` vérifie `SELECT 1` et le ping MongoDB, sans écriture. Un en-tête `Authorization: Bearer <READINESS_SECRET>` est obligatoire ; sinon réponse 404 avant toute connexion. Résultat authentifié : 200 si les deux bases répondent, 503 sinon. Seuls des booléens par service sont retournés, sans erreur fournisseur ni chaîne de connexion.
- Vérifier aussi `/`, `/menus` et `/api/menus`. Une redirection vers la connexion Vercel ne constitue pas une réponse applicative réussie.

L'autorisation réseau Atlas depuis ce poste ne prouve pas l'accès depuis Vercel. Le contrôle doit être exécuté depuis la fonction hébergée ; aucune ouverture globale Atlas n'est appliquée pour le contourner. [Liste d'accès IP Atlas](https://www.mongodb.com/docs/atlas/security/ip-access-list/).

Le candidat est envoyé avec `vercel deploy --prod --skip-domain`, puis contrôlé avant `vercel promote`. La protection des déploiements reste en place ; la CLI authentifiée peut vérifier le candidat protégé. Cette livraison ponctuelle demandée par le propriétaire n'implémente pas le workflow futur de [CI-CD.md](CI-CD.md). Les PR dépendantes et les branches protégées sont conservées, sans fusion forcée.

## Limites

Le catalogue distant peut être vide : aucun compte ni menu fictif n'est initialisé en production. Les horaires distants ne sont pas renseignés. L'authentification, la commande, le worker d'outbox, les e-mails, le contact et la projection statistique restent à développer. Les textes légaux sont provisoires et les pages restent non indexables.

Les aperçus de PR ne reçoivent pas les identifiants de production. Une véritable préproduction avec bases et fournisseurs séparés, les sauvegardes et l'exercice de restauration restent à préparer. Aucun abonnement ni service payant n'est souscrit.
