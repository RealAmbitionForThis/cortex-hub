export function runMigrations(db) {
  createCoreTables(db);
  createModuleTables(db);
  createSystemTables(db);
  createIndexes(db);
}

function createIndexes(db) {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(memory_type);
    CREATE INDEX IF NOT EXISTS idx_memories_module ON memories(module);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
    CREATE INDEX IF NOT EXISTS idx_bills_next_due ON bills(next_due);
    CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);
    CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date);
    CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
    CREATE INDEX IF NOT EXISTS idx_schedules_enabled ON schedules(enabled);
    CREATE INDEX IF NOT EXISTS idx_doc_chunks_document ON document_chunks(document_id);
    CREATE INDEX IF NOT EXISTS idx_cluster_memories_cluster ON cluster_memories(cluster_id);
    CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle ON fuel_logs(vehicle_id);
    CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON maintenance_logs(vehicle_id);
    CREATE INDEX IF NOT EXISTS idx_interactions_contact ON contact_interactions(contact_id);
  `);
}

function createCoreTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      system_prompt TEXT,
      icon TEXT DEFAULT '📂',
      color TEXT DEFAULT '#6366f1',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT,
      model TEXT NOT NULL,
      cluster_id TEXT,
      project_id TEXT,
      system_prompt_override TEXT,
      reasoning_level TEXT DEFAULT 'medium',
      parent_conversation_id TEXT,
      pinned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      tool_calls TEXT,
      tool_call_id TEXT,
      reasoning_level TEXT,
      edited INTEGER DEFAULT 0,
      original_content TEXT,
      version INTEGER DEFAULT 1,
      parent_message_id TEXT,
      tokens_used INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      memory_type TEXT NOT NULL,
      category TEXT NOT NULL,
      module TEXT,
      content TEXT NOT NULL,
      metadata TEXT,
      embedding BLOB,
      confidence REAL DEFAULT 1.0,
      protected INTEGER DEFAULT 0,
      source_message_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_logs (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      summary TEXT NOT NULL,
      topics TEXT,
      modules_touched TEXT,
      message_count INTEGER,
      tool_calls_count INTEGER,
      mood TEXT,
      highlights TEXT,
      embedding BLOB,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

function createModuleTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clusters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      system_prompt_addition TEXT,
      icon TEXT DEFAULT '📁',
      color TEXT DEFAULT '#6366f1',
      active INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cluster_memories (
      id TEXT PRIMARY KEY,
      cluster_id TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      embedding BLOB,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (cluster_id) REFERENCES clusters(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'text',
      content TEXT,
      file_path TEXT,
      metadata TEXT,
      embedding BLOB,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cluster_documents (
      id TEXT PRIMARY KEY,
      cluster_id TEXT NOT NULL,
      document_id TEXT NOT NULL,
      FOREIGN KEY (cluster_id) REFERENCES clusters(id) ON DELETE CASCADE,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS document_chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      embedding BLOB,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL DEFAULT (date('now')),
      recurring INTEGER DEFAULT 0,
      source TEXT DEFAULT 'manual',
      document_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL UNIQUE,
      monthly_limit REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      frequency TEXT NOT NULL,
      due_day INTEGER,
      next_due TEXT NOT NULL,
      category TEXT,
      auto_pay INTEGER DEFAULT 0,
      notify_days_before INTEGER DEFAULT 3,
      paid_this_cycle INTEGER DEFAULT 0,
      last_paid TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS meals (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      calories INTEGER,
      protein REAL,
      carbs REAL,
      fat REAL,
      meal_type TEXT,
      date TEXT NOT NULL DEFAULT (date('now')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      exercises TEXT,
      duration_minutes INTEGER,
      notes TEXT,
      date TEXT NOT NULL DEFAULT (date('now')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS health_goals (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      target REAL NOT NULL,
      unit TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      current_mileage INTEGER,
      vin TEXT,
      nickname TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS maintenance_logs (
      id TEXT PRIMARY KEY,
      vehicle_id TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      cost REAL,
      mileage INTEGER,
      shop TEXT,
      date TEXT NOT NULL DEFAULT (date('now')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS fuel_logs (
      id TEXT PRIMARY KEY,
      vehicle_id TEXT NOT NULL,
      gallons REAL NOT NULL,
      cost_per_gallon REAL,
      total_cost REAL,
      mileage INTEGER,
      date TEXT NOT NULL DEFAULT (date('now')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comfyui_workflows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      workflow_json TEXT NOT NULL,
      parameters TEXT,
      thumbnail_path TEXT,
      tags TEXT,
      use_count INTEGER DEFAULT 0,
      last_used TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS comfyui_generations (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      prompt_id TEXT NOT NULL,
      input_params TEXT,
      output_images TEXT,
      status TEXT DEFAULT 'queued',
      progress REAL DEFAULT 0,
      execution_time_seconds REAL,
      error TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (workflow_id) REFERENCES comfyui_workflows(id) ON DELETE CASCADE
    );
  `);
}

function createSystemTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT,
      role TEXT,
      phone TEXT,
      email TEXT,
      tags TEXT,
      notes TEXT,
      birthday TEXT,
      anniversary TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contact_interactions (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL,
      type TEXT NOT NULL,
      notes TEXT,
      date TEXT NOT NULL DEFAULT (date('now')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'todo',
      module TEXT,
      due_date TEXT,
      completed_at TEXT,
      tags TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cron_expression TEXT NOT NULL,
      action TEXT NOT NULL,
      params TEXT,
      enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS exports (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      format TEXT NOT NULL,
      module TEXT NOT NULL,
      row_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scheduled_exports (
      id TEXT PRIMARY KEY,
      module TEXT NOT NULL,
      format TEXT NOT NULL DEFAULT 'xlsx',
      cron_expression TEXT NOT NULL,
      filters TEXT,
      output_dir TEXT,
      enabled INTEGER DEFAULT 1,
      last_run TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS mcp_servers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT,
      enabled INTEGER DEFAULT 1,
      config TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS mcp_tools (
      id TEXT PRIMARY KEY,
      server_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      input_schema TEXT,
      enabled INTEGER DEFAULT 1,
      FOREIGN KEY (server_id) REFERENCES mcp_servers(id) ON DELETE CASCADE
    );
  `);
}
