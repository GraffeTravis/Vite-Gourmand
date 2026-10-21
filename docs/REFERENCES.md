# Références et décisions

Références conservées dans le dossier parent, sans modification :

1. `../cahier_des_charges/cahier_des_charges_vite_et_gourmand_v1.2.pdf` : autorité fonctionnelle, technique et graphique ; remplace les versions précédentes.
2. `../cadrage_projet/cadrage_projet_vite_et_gourmand_v0.1.docx` et PDF : contexte.
3. `../conception_bdd/LIRE_MOI.md`, `LIRE_MOI_MCD.md`, MCD et MLD v0.1 du 15 octobre : proposition de données, non validation définitive.
4. `../design-desktop-reprise/NOTICE.md`, rapports et captures d'audit : parcours et limites du prototype. Les valeurs divergentes du HTML ne remplacent pas le chapitre 9 du CDC.

## Arbitrages conservés ouverts

- D01/D02 ont été validées le 20 octobre : prix par personne, remise sur le menu puis livraison, stock global en nombre de commandes, réservation à création et restitution unique. Voir le [registre actualisé](DECISIONS-A-VALIDER.md).
- Livraison automatique demandée et départ fixé au 36 rue de la Benauge, 33100 Bordeaux, implantation fictive. Tarif dans Bordeaux, trajet, fournisseur et arrondi restent à finaliser ; ne pas prendre les 20 km de démonstration comme fait réel.
- Horaires réels et sens des créneaux ; aucun horaire inventé.
- Matériel, preuve de notification et restitution, convention des 10 jours ouvrés, déclenchement des 600 €.
- Conservation des données, contenus légaux, coordonnées et service e-mail de production.
- Confirmation du maximum d'un avis par commande et du classement des plats.
- Provisionnement administrateur hors inscription publique ; aucune création automatique de compte privilégié ou mot de passe par défaut.

Le schéma de travail reprend la proposition v0.1, les décisions D01/D02 et les supports techniques de L1. Deux migrations de revue sont versionnées et testées sur bases jetables ; leur adoption dans la base de développement attend l'examen des autres points concernés. Les identifiants entiers, montants Decimal, instantanés et relations historiques restrictives sont préservés. L'[index portable](references/README.md) recense les documents sans en publier les originaux.

RM06 et RM07 sont suffisamment précises pour être implémentées et testées dès le socle : quantité au moins égale au minimum propre au menu ; remise de 10 % à partir de minimum + 5.
