# Intégration du moteur agentique M2 dans WorkFlow HR

## Architecture

Le frontend RH conserve ses pages; l'entrée **Assistant agentique** ouvre le planificateur M2. Les routes agentiques exigent un JWT et réservent planification, exécution, exports et catalogue MCP au rôle RH. Les comptes fournis sont des comptes de démonstration.

```text
React (AgenticWorkspace)
  ├─ FastAPI : plan, validation, dry-run, exécution, historique, rejeu, RAG
  ├─ LangGraph : exécution ordonnée et résultats d'étapes
  ├─ Client MCP stdio ── protocole MCP ── serveur FastMCP
  │    ├─ outils historiques de données
  │    └─ outils RH : employés, statistiques salariales, export, notification
  ├─ MongoDB : employés/congés de l'application RH (lecture par les outils RH)
  └─ PostgreSQL : plans versionnés, exécutions et chunks RAG; SQLite en mode local sans DATABASE_URL
```

Le LLM ne reçoit pas le droit d'exécuter directement les actions. `/workflows/plan` produit un `WorkflowPlan` validé par Pydantic et le validateur métier. Le dry-run présente les actions sans appeler les outils de mutation. L'exécution passe ensuite par LangGraph, qui délègue aux outils au moyen du client MCP.

## Parcours RH

Exemple : « Analyse la masse salariale du département IT et applique une prime de 5 %. »

1. Le planner LLM structuré est utilisé si `OPENAI_API_KEY` existe; sinon le planner heuristique local crée le plan.
2. FastAPI vérifie le schéma, les paramètres et le graphe de dépendances.
3. Le dry-run montre l'ordre et les effets prévus; aucun export ou message n'est déclenché.
4. L'exécution LangGraph appelle `read_employee_records` puis `compute_salary_statistics` via MCP.
5. Le plan et le résultat peuvent être sauvegardés dans PostgreSQL; l'idempotence, les versions et le rejeu sont exposés par l'API et l'interface.

## Données et limites du prototype

- Les outils RH lisent `employees` et `leave_requests` dans MongoDB quand `MONGODB_URI` est configuré. Hors ligne, ils utilisent `INITIAL_DATA`. Le filtre de département compare les identifiants et noms normalisés, pas une sous-chaîne ambiguë.
- Les salaires présents dans les seeds sont des données de démonstration.
- L'export de paie écrit un CSV ou JSON uniquement sous `backend/output/`; les chemins qui sortent de `output/` sont refusés. En dry-run, zéro octet n'est écrit.
- L'export de paie écrit réellement les lignes de sortie fournies dans un CSV/JSON sous `backend/output/`. Le dry-run ne crée aucun fichier. Les montants affichés sont une simulation de calcul, pas un versement ni une modification du salaire en base.
- Les notifications utilisent SMTP seulement si `SMTP_HOST`, `SMTP_FROM` et un destinataire (`recipient` ou `HR_NOTIFICATION_TO`) sont définis. Sinon l'outil retourne `skipped`, et le moteur marque l'étape en échec au lieu de prétendre que le message est parti. Aucun email réel n'a été expédié lors des vérifications.
- Les chunks RAG sont conservés dans PostgreSQL/SQLite avec leurs vecteurs JSON. Sans `OPENAI_API_KEY`, l'indexation et la recherche restent TF-IDF locales; avec clé, `text-embedding-3-small` et `gpt-4o-mini` sont utilisés par défaut. Les documents RH intégrés sont des exemples et ne remplacent pas les politiques officielles.
- Le client MCP démarre un serveur stdio pour la découverte ou chaque appel d'outil. C'est un prototype simple; un serveur MCP persistant est préférable pour réduire la latence en production.
- Le login vérifie les mots de passe hashés PBKDF2 si `password_hash` existe. Les mots de passe en clair des comptes seed sont acceptés uniquement si `AUTH_DEV_MODE=true`. Configure un `JWT_SECRET` aléatoire d'au moins 32 octets et `AUTH_DEV_MODE=false` avant tout déploiement; remplace les comptes démo et ajoute les migrations de schéma avant mise en production.
- Les nouvelles routes agentiques ont des contrôles JWT/RH; les anciennes routes `/api/*` de l'application RH ne sont pas encore protégées uniformément côté serveur. Le dépôt reste un prototype de démonstration et ne doit pas être exposé avec des données RH réelles avant la sécurisation de ces routes historiques.

## Lancement

Depuis ce dossier :

```powershell
docker compose up --build
```

L'interface est servie sur `http://localhost:3000` et l'API sur `http://localhost:5000/docs`. Nginx relaye les routes `/api`, `/workflows`, `/mcp` et `/rag` vers FastAPI. Docker Compose démarre PostgreSQL et configure `DATABASE_URL`; hors Docker, l'API utilise SQLite si `DATABASE_URL` est absent. Le frontend local se lance depuis `frontend/` avec `npm run dev` (API par défaut sur `http://localhost:8000`). Les variables SMTP, clé OpenAI et MongoDB sont optionnelles et doivent être fournies dans l'environnement local, jamais commitées.

## Routes M2 intégrées

- `POST /workflows/plan`, `POST /workflows/validate`, `POST /workflows/dry-run`
- `POST /workflows/runs`, `GET /workflows/runs`, `POST /workflows/runs/{run_id}/replay`
- `POST /workflows/save`, `GET /workflows/{name}/versions`
- `GET /mcp/tools`
- `POST /rag/query`, `POST /rag/ingest`, `GET /rag/documents`
