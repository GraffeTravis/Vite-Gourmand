# Préparation Vercel — 21 octobre 2026

Le porteur du projet a créé [travis22/vitegourmand](https://vercel.com/travis22/vitegourmand) et relié le dépôt GitHub. Il confirme que seul le projet Vercel est créé : PostgreSQL, MongoDB et le service d'e-mails restent à préparer. Aucun fournisseur payant n'est souscrit par cette reprise.

## Constat vérifié

Le [déploiement Preview de la branche catalogue](https://vercel.com/travis22/vitegourmand/Dpvf8V52DtKPoKYMBd9p9tLYJW1y) reçoit bien le commit `9fa80eb`, installe les dépendances et génère Prisma. La compilation s'arrête ensuite sur les noms de variables manquantes : `APP_URL`, `DATABASE_URL`, `MONGODB_URI`, `MONGODB_DATABASE`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`. Aucune valeur secrète n'est affichée par cette validation.

L'adresse initiale fournie, `https://vitegourmand-p4864uth0-travis22.vercel.app`, redirige un visiteur non authentifié vers la connexion Vercel. Ce retour HTTP ne prouve pas que l'application est accessible. Ne pas désactiver la protection du déploiement pour résoudre une erreur de configuration.

La CI GitHub utilise ses propres services jetables et réussit indépendamment de cet échec Vercel. J1, la recette de préproduction et le retour applicatif restent à démontrer.

## Paramètres à préparer dans Vercel

Les valeurs réelles restent dans les paramètres d'environnement Vercel ; ne pas les publier dans Git, une PR ou le chat. Les exemples locaux de `.env.example` ne doivent pas être copiés vers la cible distante.

| Variable | Source attendue |
| --- | --- |
| `APP_ENV` | `preview` pour la préproduction, `production` pour la future cible de production, avec services séparés |
| `APP_URL` | Origine HTTPS stable de la cible, sans chemin, paramètres ni identifiants |
| `DATABASE_URL` | Connexion PostgreSQL distante du compte applicatif ; utiliser les paramètres TLS du fournisseur et prévoir une connexion de migration distincte si nécessaire |
| `MONGODB_URI` | Connexion MongoDB distante propre à la cible |
| `MONGODB_DATABASE` | Nom de base analytique réservé à la cible |
| `SMTP_HOST`, `SMTP_PORT` | Serveur et port du fournisseur transactionnel ou de test distant |
| `SMTP_FROM` | Expéditeur autorisé par le fournisseur, jamais le domaine local `.test` |
| `SMTP_USER`, `SMTP_PASSWORD` | Identifiants du fournisseur si requis, renseignés ensemble et gardés secrets |

Le code actuel exige ces paramètres au build distant et au démarrage. Il n'existe aucun repli vers les bases Docker, Mailpit ou une distance de livraison fictive. L'absence d'un service n'est pas contournée par une URL inventée.

## Suite de préparation

1. Choisir les services et leur budget avec le propriétaire ; isoler préproduction, production et tests, ainsi que les destinataires d'e-mails.
2. Renseigner les paramètres dans les environnements Vercel concernés ; vérifier la version Node utilisée, alignée sur Node 24 de la CI.
3. Mettre en place le workflow de livraison après CI décrit dans [CI-CD.md](CI-CD.md). La liaison Git actuelle déclenche automatiquement des builds et n'attend pas cette porte de livraison.
4. Vérifier la connectivité et appliquer les migrations versionnées sur la seule base de préproduction désignée. Aucun reset distant ni migration automatique au démarrage du serveur.
5. Contrôler les parcours sur le commit exact déployé, les contenus de démonstration, les envois de test et le retour applicatif. Conserver les sauvegardes et l'exercice de restauration comme preuves séparées.

L'authentification, la commande, le worker d'outbox et la projection statistique restent les lots suivants ; créer leurs tables ou renseigner une connexion ne les rend pas fonctionnels.
