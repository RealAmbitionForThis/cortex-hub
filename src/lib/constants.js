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

export const MEMORY_SIMILARITY_THRESHOLD = 0.92;
export const DEFAULT_MEMORY_RETRIEVAL_COUNT = 10;

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

export const PRIORITY_COLORS = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
};

export const DEFAULT_ACCENT_COLOR = '#6366f1';
export const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
export const DEFAULT_LLAMACPP_URL = 'http://localhost:8080';
export const DEFAULT_COMFYUI_URL = 'http://localhost:8188';
export const DEFAULT_NTFY_URL = 'https://ntfy.sh';
export const POLL_INTERVAL_MS = 30000;

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
