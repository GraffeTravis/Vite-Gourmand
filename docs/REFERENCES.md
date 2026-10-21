# Références et décisions

Références conservées dans le dossier parent, sans modification :

1. `../cahier_des_charges/cahier_des_charges_vite_et_gourmand_v1.2.pdf` : autorité fonctionnelle, technique et graphique ; remplace les versions précédentes.
2. `../cadrage_projet/cadrage_projet_vite_et_gourmand_v0.1.docx` et PDF : contexte.
3. `../conception_bdd/LIRE_MOI.md`, `LIRE_MOI_MCD.md`, MCD et MLD v0.1 du 15 octobre : proposition de données, non validation définitive.
4. `../design-desktop-reprise/NOTICE.md`, rapports et captures d'audit : parcours et limites du prototype. Les valeurs divergentes du HTML ne remplacent pas le chapitre 9 du CDC.

## Arbitrages conservés ouverts

- D01/D02 ont été validées le 20 octobre : prix par personne, remise sur le menu puis livraison, stock global en nombre de commandes, réservation à création et restitution unique. Voir le [registre actualisé](DECISIONS-A-VALIDER.md).
- D03 finalisée : livraison automatique, gratuite dans la commune de Bordeaux ; hors Bordeaux 5 € + 0,59 €/km sur le trajet aller en voiture le plus rapide depuis l'implantation fictive retenue, prix final arrondi au centime et confirmation bloquée en cas d'échec. Adaptateur fournisseur à réaliser en L4 ; ne pas prendre les 20 km de démonstration comme fait réel.
- D04 accueil : sept jours fournis pour le projet le 20 octobre et conservés dans le registre/journal ; créneaux de livraison encore ouverts. Aucun horaire n'est déduit arbitrairement d'une capture.
- Matériel, preuve de notification et restitution, convention des 10 jours ouvrés, déclenchement des 600 €.
- Conservation des données, contenus légaux, coordonnées et service e-mail de production.
- D06 validée : un avis par commande, catégorie globale du plat, publication vérifiée et archivage des menus liés. D13 validée : filtres combinés et minimum compatible avec le groupe.
- Provisionnement administrateur hors inscription publique ; aucune création automatique de compte privilégié ou mot de passe par défaut.

Le modèle reprend la proposition v0.1 et les décisions du registre. Quatre migrations additives sont testées ; le catalogue et les horaires sont activés localement. L'identité, les créneaux de livraison et le matériel restent à compléter dans leurs lots. Les identifiants entiers, montants Decimal, instantanés et relations historiques restrictives sont préservés. L'[index portable](references/README.md) recense les documents sans en publier les originaux.

RM06 et RM07 sont suffisamment précises pour être implémentées et testées dès le socle : quantité au moins égale au minimum propre au menu ; remise de 10 % à partir de minimum + 5.
