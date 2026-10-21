# Raccordement Neon et Atlas — 21 octobre 2026

Le propriétaire a créé PostgreSQL sur Neon et un cluster Atlas Free. Les identifiants sont conservés uniquement dans les fichiers `.env*` exclus de Git. Le contexte `.neon` est aussi exclu ; `neon.ts` reste une déclaration générique sans secret, avec PostgreSQL seul.

## Réalisation et preuves

- CLI officiel Neon 8.10.3 installé. L'initialisation standard a échoué sur l'extension GitHub Copilot CLI après avoir installé celle de Codex. Reprise avec `--no-agent-setup` : contexte et `neon.ts` créés sans relancer les installations d'éditeurs.
- Une première connexion a expiré après 60 secondes ; la seconde a réussi. Le plan de la branche `production` ne prévoit aucun changement ; `neon deploy` réussit et récupère `DATABASE_URL`, `DATABASE_URL_UNPOOLED` et `NEON_BRANCH` dans `.env`.
- Connexions applicatives Prisma/PostgreSQL et MongoDB testées en lecture. TLS réseau et certificat Neon vérifiés ; mode `verify-full` explicite dans les connexions locales récupérées. Le résultat `pg_stat_ssl` du serveur derrière le proxy Neon ne représente pas à lui seul le chiffrement entre ce poste et le proxy.
- Quatre migrations versionnées appliquées sur une branche Neon de contrôle isolée, puis réappliquées sans opération supplémentaire. Cette branche a été créée avec expiration sous 24 heures, puis supprimée après les vérifications. Aucun reset et aucune copie de données client : le parent ne comportait aucune table publique au contrôle initial.
- Aller-retour d'écriture/lecture PostgreSQL dans une table temporaire, supprimée à la fin de la transaction ; aller-retour MongoDB dans une base `vg_setup_check_*`, suivi de la suppression du seul document de contrôle. Le premier nom de base dépassait la limite de 38 caractères renvoyée par Atlas ; un nom plus court fonctionne.
- Après accord explicite du propriétaire, les quatre migrations ont été appliquées à `production`, puis réappliquées sans changement. Le seed a été exécuté deux fois. Contrôle en lecture : 22 tables métier, quatre migrations terminées, trois rôles, huit statuts, zéro compte et zéro menu. Aucun compte privilégié ni contenu de démonstration créé.
- `npm run build` réussit avec la configuration locale finale. Serveur compilé lancé d'abord avec les connexions de contrôle, puis avec Neon `production` en lecture : `/api/health`, `/api/menus`, `/menus` et `/` répondent 200 ; catalogue SQL vide et structure JSON vérifiée. Serveurs temporaires arrêtés.
- 78 tests unitaires, 31 tests PostgreSQL locaux et 12 parcours Chromium bureau/mobile réussis ; lint et types stricts passent. L'audit des dépendances de production ne signale aucune vulnérabilité. Les cinq alertes élevées de la chaîne de développement restent un point historique distinct.

Extraits non sensibles des sorties :

```text
No changes — branch production already matches the policy.
Utilized services: Postgres
Pulled 3 Neon variables into .env

All migrations have been successfully applied.
No pending migrations to apply.

PostgreSQL: ecriture et lecture transactionnelles OK, table temporaire supprimee
PostgreSQL via Prisma: OK
MongoDB: ecriture et lecture OK, document de controle supprime
MongoDB via connecteur applicatif: OK

Compiled successfully
HTTP /api/health: 200
HTTP /api/menus: 200
HTTP /menus: 200
HTTP /: 200

production: 22 tables metier, 4 migrations, 3 roles, 8 statuts, 0 compte, 0 menu
```

Le contrôle automatique avait d'abord refusé les écritures sur `production` faute d'accord explicite. La copie isolée a permis de préparer les preuves avant de demander cet accord. Après réception de la confirmation, la cible `production` a été migrée et vérifiée séparément ; elle n'a subi aucun essai d'écriture de données de contrôle. Les essais d'écriture restent limités aux environnements isolés.

## Adaptations du code

- Prisma et le pilote `pg` sont conservés, conformément aux instructions Neon pour une application Next.js sur Vercel. Le pool est partagé, borné à cinq connexions, avec délai de connexion de dix secondes et fermeture des connexions inutilisées après cinq secondes. `attachDatabasePool` est appelé sur Vercel pour les clients PostgreSQL et MongoDB.
- Prisma Migrate choisit `DATABASE_URL_UNPOOLED` lorsqu'elle existe ; l'application utilise `DATABASE_URL`, mutualisée. Le lanceur des tests remplace explicitement les deux variables par sa base jetable locale : une URL Neon présente dans `.env` ne doit jamais détourner les migrations des tests.
- La vérification HTTP a révélé un `P2028` au démarrage de la transaction du catalogue sur la connexion distante. Le même délai a affecté la première initialisation des référentiels. L'attente des transactions est désormais bornée à dix secondes et leur durée à quinze secondes dans le client applicatif et le seed ; le catalogue retourne ensuite 200 et le seed réussit puis se rejoue.
- `npm run services:check` vérifie les connexions en lecture via les vrais connecteurs. `--roundtrip` exige `APP_ENV=test`, une cible SQL locale ou une branche `vg-setup-check-*`, et une base MongoDB `vg_setup_check_*` de longueur adaptée. L'option ne sert pas à écrire dans les bases métier.

Les fichiers `.env.before-neon`, `.env.neon-check` et `.env.services-check` sont privés et ignorés. Le premier conserve la configuration locale précédant Neon ; les deux autres, utilisés pour les contrôles isolés, ont été supprimés après vérification. La branche Neon temporaire et la base Atlas temporaire vide ont aussi été supprimées ; seule la branche Neon `production` subsiste au contrôle final.

## Atlas et suite Vercel

La capture du propriétaire contenait le mot de passe de l'utilisateur Atlas. Il faut le renouveler dans Atlas puis actualiser le fichier local et les éventuels secrets d'hébergement. Aucun identifiant n'est recopié dans ce document ni dans les sorties de vérification.

L'accès réseau autorisé pour ce poste ne vaut pas accès depuis Vercel. La politique réseau de l'hébergement, un compte Atlas limité à la base utile, les secrets Vercel et le service d'e-mails restent à préparer. Ne pas ouvrir l'accès réseau ni inventer des paramètres SMTP pour contourner un build distant.

Le rattachement des deux bases ne livre pas l'authentification, le worker d'outbox ou la projection statistique. Ces fonctionnalités restent les lots L3 et L8.

Sources techniques : [pilotes et connexions Neon](https://neon.com/docs/connect/choose-connection), [pooling Vercel](https://vercel.com/kb/guide/connection-pooling-with-functions), [utilisateurs Atlas](https://www.mongodb.com/docs/atlas/security-add-mongodb-users/).
