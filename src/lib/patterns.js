/**
 * Canonical secret-detection pattern catalog.
 * Used by both the server-side /api/scan-file route and (mirrored inline) FileUpload.js.
 *
 * Each entry:
 *   id          — stable machine key
 *   name        — human label shown in the UI
 *   severity    — 'CRITICAL' | 'HIGH' | 'MEDIUM'
 *   regex       — detection pattern (re-instantiated per scan to reset lastIndex)
 *   redaction   — placeholder text that replaces the match
 *   why         — one-sentence explanation shown in the pattern catalog GET response
 */
export const SECRET_PATTERNS = [
  {
    id:        'google_api_key',
    name:      'Google API Key',
    severity:  'CRITICAL',
    regex:     /AIza[0-9A-Za-z\-_]{10,}/g,
    redaction: '[GOOGLE_API_KEY_REDACTED]',
    why:       'Exposes Google Cloud services; can incur large billing charges.',
  },
  {
    id:        'openai_key',
    name:      'OpenAI API Key',
    severity:  'CRITICAL',
    regex:     /sk-[A-Za-z0-9]{20,}/g,
    redaction: '[OPENAI_KEY_REDACTED]',
    why:       'Grants full OpenAI API access including GPT-4 and fine-tuning.',
  },
  {
    id:        'aws_access_key',
    name:      'AWS Access Key',
    severity:  'CRITICAL',
    regex:     /AKIA[0-9A-Z]{16}/g,
    redaction: '[AWS_KEY_REDACTED]',
    why:       'AWS root-level key that can control any cloud resource in the account.',
  },
  {
    id:        'stripe_secret_live',
    name:      'Stripe Live Secret Key',
    severity:  'CRITICAL',
    regex:     /sk_live_[a-zA-Z0-9]{8,}/g,
    redaction: '[STRIPE_LIVE_KEY_REDACTED]',
    why:       'Live Stripe key; exposes real payment processing and customer data.',
  },
  {
    id:        'stripe_secret_test',
    name:      'Stripe Test Secret Key',
    severity:  'HIGH',
    regex:     /sk_test_[a-zA-Z0-9]{8,}/g,
    redaction: '[STRIPE_TEST_KEY_REDACTED]',
    why:       'Test Stripe key; can still be used to probe API structure.',
  },
  {
    id:        'private_key',
    name:      'Private Key (PEM)',
    severity:  'CRITICAL',
    regex:     /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----[\s\S]*?-----END (RSA |EC |DSA )?PRIVATE KEY-----/g,
    redaction: '[PRIVATE_KEY_REDACTED]',
    why:       'Cryptographic private key; enables impersonation and data decryption.',
  },
  {
    id:        'database_url',
    name:      'Database URL',
    severity:  'CRITICAL',
    regex:     /mongodb(\+srv)?:\/\/[^\s]+|postgresql:\/\/[^\s]+|mysql:\/\/[^\s]+/gi,
    redaction: '[DB_URL_REDACTED]',
    why:       'Full DB connection string including credentials and host.',
  },
  {
    id:        'jwt_secret',
    name:      'JWT Secret',
    severity:  'HIGH',
    regex:     /jwt[_-]?secret[\s:=]+\S+/gi,
    redaction: '[JWT_SECRET_REDACTED]',
    why:       'Allows forging signed JWTs, bypassing authentication entirely.',
  },
  {
    id:        'bearer_token',
    name:      'Bearer Token',
    severity:  'HIGH',
    regex:     /Bearer [a-zA-Z0-9\-._~+/]+=*/g,
    redaction: '[AUTH_TOKEN_REDACTED]',
    why:       'Active auth token that can replay authenticated API requests.',
  },
  {
    id:        'password_literal',
    name:      'Password (literal)',
    severity:  'HIGH',
    regex:     /password[\s:=]+\S+/gi,
    redaction: '[PASSWORD_REDACTED]',
    why:       'Plain-text password assignment leaked in config or source code.',
  },
  {
    id:        'api_key_generic',
    name:      'Generic API Key',
    severity:  'MEDIUM',
    regex:     /API_KEY[\s:=]+\S+/gi,
    redaction: '[API_KEY_REDACTED]',
    why:       'Generic key assignment; actual risk depends on the target service.',
  },
  {
    id:        'internal_ip',
    name:      'Internal IP Address',
    severity:  'MEDIUM',
    regex:     /\b10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+\b/g,
    redaction: '[INTERNAL_IP_REDACTED]',
    why:       'Exposes private network topology that aids lateral movement.',
  },
  {
    id:        'credit_card',
    name:      'Credit Card Number',
    severity:  'CRITICAL',
    regex:     /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    redaction: '[CARD_NUMBER_REDACTED]',
    why:       'PAN data; exposure violates PCI-DSS and risks financial fraud.',
  },
  {
    id:        'ssn',
    name:      'Social Security Number',
    severity:  'CRITICAL',
    regex:     /\b\d{3}-\d{2}-\d{4}\b/g,
    redaction: '[SSN_REDACTED]',
    why:       'US SSN; identity theft enabler and HIPAA/FERPA violation risk.',
  },
];

/** Severity levels ranked lowest → highest for comparison. */
export const SEVERITY_RANK = { MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

/** IDs considered "critical" for criticalCount tallying. */
export const CRITICAL_IDS = new Set(
  SECRET_PATTERNS.filter((p) => p.severity === 'CRITICAL').map((p) => p.id)
);
