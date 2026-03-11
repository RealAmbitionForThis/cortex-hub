# Cortex Hub

A self-hosted AI personal operating system. Local-first, privacy-focused, powered by Ollama or llama-server.

## Features

### AI Chat
- Streaming chat with SSE (Server-Sent Events)
- Tool calling with automatic multi-round execution (up to 10 rounds)
- Thinking/reasoning support — model-family-aware (Qwen 3, DeepSeek, GPT-OSS, Kimi/K2, Command R)
- Pre-analysis pass — optional LLM pre-processing to predict needed tools and pre-fetch data
- Message editing, deletion, and regeneration
- Per-conversation system prompt overrides
- Token usage tracking (prompt/completion tokens, tokens/sec)
- Stop button for streaming responses

### Memory System
- Automatic memory extraction from conversations
- Embedding-based semantic retrieval (cosine similarity)
- Protected memories (never-delete)
- Memory clusters — organize by life area (work, health, finances, etc.)
- Confidence scoring and deduplication
- Daily summary logs with mood tracking

### Modules
- **Money** — Transactions, budgets, bills, subscriptions, payroll, savings pods, wishlist, spending charts
- **Tasks** — Backlog and Kanban views with priorities, due dates, overdue tracking
- **Health** — Meal logging, workout tracking, sleep logs with mood correlation, health goals
- **Contacts** — CRM with interaction history, tags, follow-up reminders
- **Documents** — PDF parsing, RAG search with embeddings, vision scanning (receipts, business cards)
- **Vehicle** — Maintenance logs, fuel tracking, cost analysis
- **Inventory** — Items with warranty tracking, insurance, warranty claims
- **Wishlist** — Target prices, savings pods with contribution tracking
- **Important Dates** — Passports, birthdays, milestones, reminders

### Integrations
- **Ollama** — Local LLM backend with model management (pull, delete, VRAM stats)
- **llama-server** — llama.cpp backend with auto-detection of chat templates
- **ComfyUI** — Workflow management, image generation, parameter editing
- **MCP** — Model Context Protocol server connections for external tools
- **DuckDuckGo** — Web search with URL summarization
- **ntfy.sh** — Push notifications

### Utilities
- Excel/CSV export and import for any module
- Cron scheduling — automated tasks with cron expressions
- Calculator tools — math evaluation, unit conversion, tip calculation
- Projects — namespace conversations with custom system prompts
- Dark mode — system-aware theme with manual toggle
- System dashboard — GPU, backend, and database health monitoring

## Requirements

- Node.js 18+
- [Ollama](https://ollama.ai) or [llama-server](https://github.com/ggml-org/llama.cpp) running locally

## Quick Start

```bash
# Clone and install
git clone <repo-url> cortex-hub
cd cortex-hub
npm install

# Configure
cp .env.example .env.local
# Edit .env.local — set CORTEX_PASSWORD and CORTEX_JWT_SECRET at minimum

# Pull a model (if using Ollama)
ollama pull gpt-oss:20b

# Start
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your configured password.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CORTEX_PASSWORD` | `changeme` | Login password |
| `CORTEX_JWT_SECRET` | `default-dev-secret...` | JWT signing secret (32+ chars recommended) |
| `CORTEX_BACKEND` | `ollama` | Backend type: `ollama` or `llamacpp` |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama API endpoint |
| `LLAMACPP_URL` | `http://localhost:8080` | llama-server endpoint |
| `CORTEX_EMBEDDING_URL` | *(none)* | Fallback embedding endpoint (when llama.cpp lacks embedding) |
| `CORTEX_DEFAULT_MAIN_MODEL` | `gpt-oss:20b` | Default chat model |
| `CORTEX_DEFAULT_VISION_MODEL` | `qwen2.5-vl:7b` | Vision model for document scanning |
| `CORTEX_DEFAULT_EMBEDDING_MODEL` | `nomic-embed-text` | Embedding model |
| `CORTEX_MEMORY_INTERVAL_MS` | `300000` | Memory analysis interval (ms) |
| `CORTEX_MEMORY_RETRIEVAL_COUNT` | `10` | Memories fetched per chat |
| `CORTEX_DAILY_LOG_TIME` | `23:59` | Daily summary generation time |
| `CORTEX_NTFY_URL` | `https://ntfy.sh` | ntfy server URL |
| `CORTEX_NTFY_TOPIC` | `cortex-hub` | ntfy topic |
| `COMFYUI_URL` | `http://localhost:8188` | ComfyUI API URL (optional) |
| `CORTEX_DB_PATH` | `./cortex.db` | SQLite database path |
| `CORTEX_EXPORT_DIR` | `./exports` | Export output directory |
| `PORT` | `3000` | Server port |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: shadcn/ui + Tailwind CSS + Lucide icons
- **Database**: SQLite via better-sqlite3 (WAL mode)
- **LLM**: Ollama / llama-server (HTTP API, no SDK dependency)
- **Auth**: bcryptjs + JWT (jose, httpOnly cookies)
- **Charts**: Recharts
- **Export**: xlsx, pdf-parse
- **Scheduling**: node-cron + cronstrue
- **Markdown**: react-markdown + remark-gfm

## Project Structure

```
src/
├── app/                    # Next.js pages and API routes
│   ├── api/
│   │   ├── auth/           # Login/logout (JWT)
│   │   ├── chat/           # Chat streaming + message CRUD + regenerate
│   │   ├── conversations/  # Conversation list and detail
│   │   ├── projects/       # Projects with system prompts
│   │   ├── memories/       # Memory CRUD
│   │   ├── clusters/       # Memory cluster management
│   │   ├── money/          # Transactions, budgets
│   │   ├── bills/          # Bills and subscriptions
│   │   ├── tasks/          # Task management
│   │   ├── health/         # Meals, workouts, sleep, goals
│   │   ├── contacts/       # Contact CRM
│   │   ├── documents/      # Upload, RAG search, vision scan
│   │   ├── vehicle/        # Vehicle maintenance and fuel
│   │   ├── inventory/      # Items and warranty claims
│   │   ├── wishlist/       # Wishlist and savings pods
│   │   ├── important-dates/# Date tracking
│   │   ├── ollama/         # Ollama status and model management
│   │   ├── llamacpp/       # llama-server browse, launch, configs
│   │   ├── comfyui/        # Workflows, generation, status
│   │   ├── mcp/            # MCP server management
│   │   ├── settings/       # App settings (key-value)
│   │   ├── schedules/      # Cron job management
│   │   ├── exports/        # Export and import
│   │   ├── notify/         # Push notifications
│   │   ├── upload/         # File uploads
│   │   ├── backend/status/ # Backend connectivity check
│   │   ├── system/status/  # System health dashboard
│   │   └── models/         # Model listing
│   ├── login/              # Login page
│   ├── settings/           # Settings page
│   ├── money/              # Money dashboard
│   ├── tasks/              # Task board
│   ├── health/             # Health tracker
│   ├── contacts/           # Contact CRM
│   ├── documents/          # Document library
│   ├── vehicle/            # Vehicle manager
│   ├── inventory/          # Inventory tracker
│   ├── wishlist/           # Wishlist + savings pods
│   ├── important-dates/    # Date tracker
│   ├── memories/           # Memory viewer
│   ├── projects/           # Project list
│   ├── exports/            # Export history
│   ├── comfyui/            # ComfyUI workflows
│   └── page.jsx            # Chat home (main interface)
│
├── components/
│   ├── chat/               # ChatWindow, MessageBubble, ToolCallDisplay,
│   │                       # ClusterSwitcher, ReasoningLevelPicker, AnalyzerPanel,
│   │                       # ProjectSelector, SystemPromptEditor, ToolToggle,
│   │                       # TokenAnalytics, DebugPanel
│   ├── dashboards/         # SpendingChart, BudgetProgress, BillsUpcoming,
│   │                       # TaskBacklog, TaskKanban, DocumentSearch,
│   │                       # ContactsList, ExportHistory
│   ├── layout/             # AppShell, Sidebar, TopBar, MobileSidebar
│   ├── settings/           # ModelConfig, MemorySettings, ClusterManager,
│   │                       # BackendSettings, OllamaModelManager, LlamaServerLauncher,
│   │                       # McpServerManager, CronManager, NotificationSettings,
│   │                       # ComfyUISettings, DataManagement, AppearanceSettings
│   ├── shared/             # DataTable, StatCard, EmptyState, FileUpload,
│   │                       # ConfirmDialog, LoadingSpinner, StatusDot, SystemDashboard
│   └── ui/                 # shadcn/ui primitives (button, dialog, tabs, etc.)
│
├── contexts/               # React contexts
├── hooks/
│   ├── useChat.js          # Chat state, SSE streaming, message CRUD
│   ├── useSettings.js      # Settings fetch/cache/update
│   ├── useAuth.js          # Logout handler
│   ├── useMemories.js      # Memory CRUD with embeddings
│   ├── useTheme.js         # Dark/light/system theme
│   ├── useBackendStatus.js # Backend health polling
│   └── useExports.js       # Export triggers and history
│
└── lib/
    ├── api/response.js     # success(), error(), notFound(), badRequest()
    ├── auth/               # Password hashing (bcrypt), JWT creation (jose)
    ├── db/                 # SQLite init (WAL, FK), migrations, updateRow utility
    ├── llm/
    │   ├── provider.js     # Routes to Ollama or llama-cpp
    │   ├── client.js       # Ollama API client
    │   ├── llamacpp.js     # llama-server API client
    │   ├── streaming.js    # SSE stream parser
    │   ├── prompts.js      # System prompt builder
    │   ├── thinking.js     # Model-family reasoning params
    │   ├── urls.js         # Endpoint URL resolvers
    │   └── models.js       # Model status checks
    ├── memory/
    │   ├── retrieval.js    # Semantic memory search
    │   ├── embeddings.js   # Text-to-vector, cosine similarity
    │   ├── analyzer.js     # Memory extraction from chat
    │   ├── dedup.js        # Memory deduplication
    │   └── daily-log.js    # Daily summary generation
    ├── docs/               # PDF parser, vision scanner, RAG indexing
    ├── tools/
    │   ├── registry.js     # Central tool registry + execution
    │   └── [module]/       # Tool definitions per module:
    │       calc, cluster, comfyui, contacts, dates, docs,
    │       export, health, inventory, memory, money, notify,
    │       schedule, search, tasks, vehicle
    ├── analysis/           # Pre-analysis processing
    ├── prompts/            # Analysis prompt builder
    ├── comfyui/            # ComfyUI client, workflow manager
    ├── mcp/                # MCP client, transport, registry
    ├── notify/             # ntfy.sh integration
    ├── scheduler/          # Cron job runner + built-in jobs
    ├── search/             # DuckDuckGo web search
    ├── export/             # Excel/CSV generation + CSV import
    ├── constants.js        # App-wide constants and defaults
    └── utils/              # Date, format, validation, cron-parser
```

## AI Tool System

The chat interface exposes 16 tool namespaces that the LLM can call autonomously:

| Namespace | Description |
|-----------|-------------|
| `money.*` | Transactions, balance, spending, budgets, bills, subscriptions, payroll |
| `tasks.*` | Create, list, complete, update tasks; backlog and overdue views |
| `health.*` | Log meals/workouts/sleep, get stats, set goals |
| `contacts.*` | Add contacts, log interactions, upcoming follow-ups |
| `docs.*` | Upload documents, RAG search, retrieve chunks |
| `vehicle.*` | Log maintenance/fuel, get cost analysis |
| `inventory.*` | Track items, warranties, insurance claims |
| `dates.*` | Add/query important dates and deadlines |
| `memory.*` | Add/search persistent memories |
| `cluster.*` | Manage memory clusters |
| `notify.*` | Send push notifications via ntfy.sh |
| `search.*` | Web search via DuckDuckGo |
| `export.*` | Export module data to CSV/Excel |
| `schedule.*` | Create/manage cron jobs |
| `calc.*` | Math evaluation, unit conversion, tip calculator |
| `comfyui.*` | Queue image generation workflows |

## Database

SQLite with WAL mode and foreign keys enabled. Auto-migrates on first run. Tables include:

- **Core**: `settings`, `projects`, `conversations`, `messages`, `memories`, `daily_logs`
- **Clusters**: `clusters`, `cluster_memories`
- **Documents**: `documents`, `document_chunks`, `project_documents`
- **Money**: `transactions`, `budgets`, `bills`, `wishlist_items`, `savings_pods`, `pod_contributions`
- **Life**: `tasks`, `contacts`, `contact_interactions`, `meals`, `workouts`, `health_goals`, `sleep_logs`
- **Assets**: `vehicles`, `maintenance_logs`, `fuel_logs`, `inventory_items`, `warranty_claims`
- **System**: `important_dates`, `notifications`, `schedules`, `comfyui_workflows`, `comfyui_generations`

## Scripts

```bash
npm run dev      # Start dev server (port 3000)
npm run build    # Build for production
npm run start    # Run production server
npm run lint     # ESLint check
```

## License

MIT
