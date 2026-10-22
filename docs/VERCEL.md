# Déploiement Vercel — 21 octobre 2026

Projet existant : [travis22/vitegourmand](https://vercel.com/travis22/vitegourmand), relié au dépôt GitHub. **Catalogue publié sur [vitegourmand.vercel.app](https://vitegourmand.vercel.app)** le 21 octobre 2026. Les premiers builds échouaient parce que le projet utilisait le preset générique et ne contenait aucune variable serveur. Neon fonctionne depuis la production ; Atlas reste indisponible depuis Vercel, avec restriction réseau préservée sur instruction du propriétaire.

## Preuves de production

Code déployé : `9a3f8e332ad550f85b903efca52e5718e484b57c`. [Déploiement Vercel](https://vercel.com/travis22/vitegourmand/HsZ8y6UHHUd82k8QSeHh9y4QFTyA), identifiant `dpl_HsZ8y6UHHUd82k8QSeHh9y4QFTyA`, état relu `READY`, fonctions `fra1`. Les compléments documentaires suivants ne changent pas ce code applicatif.

```text
npm run build                    reussi en local et sur Vercel
tests unitaires                  88 reussis
tests PostgreSQL                 31 reussis
parcours Chromium bureau/mobile  12 reussis
vercel promote                   Success! vitegourmand was promoted
GET /                            200, sans session Vercel
GET /menus                       200, sans session Vercel
GET /api/menus                   200, menus: [], total: 0
GET /api/health                  200, status: ok
GET /mentions-legales            200
GET /cgv                         200
GET /menus/<identifiant absent>  404
GET /api/internal/readiness      404 sans jeton
GET /api/internal/readiness      503 avec jeton, postgres: true, mongodb: false
```

[CI GitHub réussie sur le code déployé](https://github.com/GraffeTravis/Vite-Gourmand/actions/runs/39696821830) : qualité, intégration, parcours et validation ; GitGuardian réussi. [Capture de la production](preuves/vercel-production-2026-10-21.png).

Le contrôle automatique a initialement refusé une promotion avec MongoDB indisponible. Après explication, refus de l'ouverture globale et des alternatives proxy/Render, le propriétaire a explicitement demandé la production Vercel. La promotion a ensuite réussi ; elle valide la publication du catalogue et ne rend pas MongoDB disponible.

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

Atlas n'autorise actuellement que ce poste. Son accès depuis la fonction hébergée échoue. Le propriétaire a refusé `0.0.0.0/0` : formulaire annulé, aucune règle ajoutée ni utilisateur modifié. Une future solution doit conserver une liste réseau limitée. Vercel Hobby utilise des sorties variables ; les [IP statiques Vercel](https://vercel.com/academy/optimize-your-vercel-account/backend-egress) nécessitent une offre payante. Les intermédiaires ont été écartés pour cette livraison. [Liste d'accès IP Atlas](https://www.mongodb.com/docs/atlas/security/ip-access-list/).

Le candidat a été envoyé avec `vercel deploy --prod --skip-domain`, puis contrôlé avant `vercel promote`. Le domaine public fonctionne sans authentification ; la protection des autres URL de déploiement reste en place. Cette livraison ponctuelle n'implémente pas le workflow futur de [CI-CD.md](CI-CD.md). Les PR dépendantes et les branches protégées sont conservées, sans fusion forcée. Les aperçus Git échouent encore faute de leur configuration isolée ; ne pas y copier les secrets de production pour les faire passer.

## Limites

Le catalogue distant peut être vide : aucun compte ni menu fictif n'est initialisé en production. Les horaires distants ne sont pas renseignés. L'authentification, la commande, le worker d'outbox, les e-mails, le contact et la projection statistique restent à développer. Les textes légaux sont provisoires et les pages restent non indexables.

Les aperçus de PR ne reçoivent pas les identifiants de production. Une véritable préproduction avec bases et fournisseurs séparés, les sauvegardes et l'exercice de restauration restent à préparer. Aucun abonnement ni service payant n'est souscrit.
