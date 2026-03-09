# Cortex Hub

A self-hosted AI personal operating system. Local-first, privacy-focused, powered by Ollama.

## Features

- **AI Chat** — Streaming chat with tool calling, message editing, deletion, and regeneration
- **Persistent Memory** — Automatic memory extraction with embedding-based retrieval
- **Information Clusters** — Contextual memory grouping for different life areas
- **Money Tracking** — Transactions, budgets, bills, spending charts
- **Task Management** — Backlog and Kanban views with priorities and due dates
- **Health Tracking** — Meal logging, workout tracking, health goals
- **Vehicle Management** — Maintenance logs, fuel tracking, cost analysis
- **Contact CRM** — Contact management with interactions and follow-ups
- **Document Intelligence** — PDF parsing, receipt scanning (vision), RAG search
- **Push Notifications** — Via ntfy.sh integration
- **Web Search** — DuckDuckGo integration with URL summarization
- **Excel/CSV Export** — Export any module data, import spreadsheets
- **MCP Support** — Model Context Protocol server connections
- **Cron Scheduling** — Automated tasks with cron expressions
- **ComfyUI Integration** — Workflow management, image generation, parameter editing
- **Ollama Model Manager** — Pull, delete, and monitor models with VRAM stats
- **System Dashboard** — GPU, Ollama, and Cortex health monitoring
- **Calculator Tools** — Math evaluation, unit conversion, tip and percentage calculations
- **Dark Mode** — System-aware theme with manual toggle

## Requirements

- Node.js 18+
- [Ollama](https://ollama.ai) running locally

## Quick Start

```bash
# Clone and install
git clone <repo-url> cortex-hub
cd cortex-hub
npm install

# Configure
cp .env.example .env.local
# Edit .env.local with your password and settings

# Pull an Ollama model
ollama pull llama3

# Start
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your configured password.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CORTEX_PASSWORD` | `cortex` | Login password |
| `CORTEX_JWT_SECRET` | `cortex-secret-change-me` | JWT signing secret |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama API URL |
| `CORTEX_DEFAULT_MAIN_MODEL` | `llama3` | Default chat model |
| `CORTEX_DEFAULT_VISION_MODEL` | `llava` | Vision model for doc scanning |
| `CORTEX_DEFAULT_EMBEDDING_MODEL` | `nomic-embed-text` | Embedding model |
| `CORTEX_NTFY_URL` | `https://ntfy.sh` | ntfy server URL |
| `CORTEX_NTFY_TOPIC` | `cortex-hub` | ntfy topic |
| `COMFYUI_URL` | `http://localhost:8188` | ComfyUI API URL (optional) |
| `CORTEX_DB_PATH` | `./cortex.db` | SQLite database path |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **Database**: SQLite via better-sqlite3
- **LLM**: Ollama (local)
- **Charts**: Recharts
- **Auth**: bcrypt + JWT (httpOnly cookies)

## Project Structure

```
src/
├── app/              # Next.js pages and API routes
├── components/       # UI components
│   ├── chat/         # Chat interface
│   ├── dashboards/   # Module dashboards
│   ├── layout/       # App shell, sidebar, topbar
│   ├── settings/     # Settings tabs
│   ├── shared/       # Reusable components
│   └── ui/           # shadcn/ui primitives
├── contexts/         # React contexts
├── hooks/            # Custom hooks
└── lib/              # Core libraries
    ├── auth/         # Authentication
    ├── db/           # Database + migrations
    ├── docs/         # Document processing
    ├── export/       # Excel/CSV generation
    ├── llm/          # Ollama client
    ├── mcp/          # MCP protocol
    ├── memory/       # Memory system
    ├── notify/       # Push notifications
    ├── scheduler/    # Cron jobs
    ├── search/       # Web search
    ├── tools/        # Tool registry + handlers
    └── utils/        # Utilities
```

## License

MIT
