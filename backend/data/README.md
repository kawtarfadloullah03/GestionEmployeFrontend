# Données de démonstration et source publique

## Paie publique de Norfolk

`norfolk_public_payroll_summary.csv` est une photographie agrégée du jeu officiel **Employee Salaries** publié par la Ville de Norfolk, Virginie. L’import ne conserve ni noms, ni identifiants, ni salaires individuels. Il regroupe les lignes par service et poste et exclut les groupes de moins de trois personnes. Les montants sont en USD et les sommes portent seulement sur les groupes conservés; elles ne représentent donc pas la masse salariale totale de la Ville.

- Source officielle : https://data.norfolk.gov/Government/Employee-Salaries/4fsk-z8s8
- API officielle : https://data.norfolk.gov/resource/4fsk-z8s8.json
- Date de photographie : inscrite dans chaque ligne (`snapshot_date`).
- Script reproductible : `backend/scripts/import_public_payroll_snapshot.py`.

Le fichier ne constitue pas un barème ni une politique salariale applicable à une autre organisation ou à la France. Il sert à démontrer l’analyse d’un jeu de données réel, public et agrégé.

## Plan de rémunération FY2027

`norfolk_compensation_plan_fy2027.pdf` et son extraction texte sont des documents publics officiels de la Ville de Norfolk, effectifs au 1er juillet 2026. `norfolk_compensation_bands_fy2027.csv` contient les classes d’emploi et leurs bornes salariales publiées; il ne contient pas de fiches individuelles.

- Document officiel : https://norfolk.gov/DocumentCenter/View/88656/City-of-Norfolk-FY2026-Compensation-Plan?bidId=
- Extraction reproductible : `backend/scripts/build_public_compensation_reference.py`.

Les données RH incluses dans `backend/seed_data.py` servent uniquement à la démonstration locale et à l’authentification de démonstration. Elles ne sont pas des salariés ni des rémunérations réels. L’application ne doit pas les présenter comme les données de la Ville de Norfolk.
