export const APP_NAME = 'Cortex Hub';
export const APP_VERSION = '1.0.0';

export const AUTH_COOKIE_NAME = 'cortex-token';
export const AUTH_TOKEN_EXPIRY_DAYS = 30;
export const BCRYPT_SALT_ROUNDS = 10;

export const DEFAULT_MAIN_MODEL = 'gpt-oss:20b';
export const DEFAULT_VISION_MODEL = 'qwen2.5-vl:7b';
export const DEFAULT_EMBEDDING_MODEL = 'nomic-embed-text';
export const DEFAULT_CONTEXT_WINDOW = 4096;

export const REASONING_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

export const MEMORY_TYPES = {
  PERSISTENT: 'persistent',
  STATIC: 'static',
};

export const MEMORY_CATEGORIES = {
  FACT: 'fact',
  PREFERENCE: 'preference',
  EVENT: 'event',
  REMINDER: 'reminder',
  MOOD: 'mood',
};

export const MODULES = {
  MONEY: 'money',
  HEALTH: 'health',
  VEHICLE: 'vehicle',
  CONTACTS: 'contacts',
  TASKS: 'tasks',
  DOCS: 'docs',
  INVENTORY: 'inventory',
  DATES: 'dates',
  GENERAL: 'general',
};

export const TASK_PRIORITIES = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export const TASK_STATUSES = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  CANCELLED: 'cancelled',
};

export const BILL_FREQUENCIES = {
  MONTHLY: 'monthly',
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
  ONCE: 'once',
};

export const NTFY_PRIORITIES = {
  MIN: 'min',
  LOW: 'low',
  DEFAULT: 'default',
  HIGH: 'high',
  URGENT: 'urgent',
};

export const MEMORY_SIMILARITY_THRESHOLD = 0.92;
export const DEFAULT_MEMORY_RETRIEVAL_COUNT = 10;
export const DEFAULT_MEMORY_INTERVAL_MS = 300000;
export const DEFAULT_DAILY_LOG_TIME = '23:59';

export const CHUNK_SIZE = 500;
export const CHUNK_OVERLAP = 50;

export const SIDEBAR_WIDTH = 280;
export const MIN_TOUCH_TARGET = 44;

export const EXPORT_FORMATS = {
  XLSX: 'xlsx',
  CSV: 'csv',
  JSON: 'json',
};

export const MCP_TIMEOUT_MS = 30000;
export const MCP_TRANSPORTS = {
  SSE: 'sse',
};

export const MEAL_TYPES = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
];

export const WORKOUT_TYPES = [
  'strength',
  'cardio',
  'flexibility',
  'other',
];

export const TRANSACTION_CATEGORIES = [
  'groceries',
  'dining',
  'transport',
  'utilities',
  'rent',
  'entertainment',
  'healthcare',
  'shopping',
  'income',
  'savings',
  'other',
];

export const MAINTENANCE_TYPES = [
  'oil_change',
  'tires',
  'brakes',
  'repair',
  'inspection',
  'other',
];

export const INTERACTION_TYPES = [
  'call',
  'email',
  'meeting',
  'text',
  'social',
  'other',
];

export const SLEEP_QUALITY_LABELS = [
  'Terrible',
  'Poor',
  'Fair',
  'Good',
  'Excellent',
];

export const SUBSCRIPTION_CATEGORIES = [
  'streaming',
  'music',
  'fitness',
  'software',
  'gaming',
  'news',
  'cloud',
  'other',
];

export const WISHLIST_CATEGORIES = [
  'electronics',
  'gaming',
  'clothing',
  'home',
  'hobby',
  'travel',
  'education',
  'other',
];

export const WISHLIST_PRIORITIES = [
  'low',
  'medium',
  'high',
];

export const INVENTORY_CATEGORIES = [
  'electronics',
  'appliances',
  'furniture',
  'vehicle',
  'tools',
  'clothing',
  'jewelry',
  'sports',
  'musical',
  'other',
];

export const WARRANTY_TYPES = [
  'standard',
  'extended',
  'accidental',
  'lifetime',
  'limited',
];

export const WARRANTY_CLAIM_STATUSES = [
  'pending',
  'submitted',
  'approved',
  'denied',
  'resolved',
];

export const IMPORTANT_DATE_TYPES = [
  'passport_expiry',
  'license_expiry',
  'lease_renewal',
  'car_registration',
  'insurance_renewal',
  'visa_expiry',
  'subscription_renewal',
  'anniversary',
  'birthday',
  'appointment',
  'deadline',
  'milestone',
  'other',
];
