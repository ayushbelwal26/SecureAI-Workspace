// Module-level log accumulator — persists across requests in the same server process
const globalLogs = [];

const AGENT_PROFILES = {
  emailAgent: {
    allowed: ['send_email', 'read_inbox', 'reply_email', 'draft_email'],
    restricted: ['delete_all', 'export_contacts', 'forward_all', 'access_calendar'],
    dailyLimit: 100,
  },
  dataAgent: {
    allowed: ['query_db', 'read_report', 'export_csv', 'filter_records'],
    restricted: ['drop_table', 'delete_records', 'update_schema', 'grant_access'],
    dailyLimit: 50,
  },
  codeAgent: {
    allowed: ['run_tests', 'lint_code', 'read_file', 'write_file', 'git_status'],
    restricted: ['rm_rf', 'exec_shell', 'install_package', 'modify_env', 'access_secrets'],
    dailyLimit: 200,
  },
};

// Session store for rate limiting
const sessionStore = new Map();

class SecurityMiddleware {
  constructor() {
    this.logs = globalLogs;
  }

  analyzeInput(userMessage) {
    const msg = userMessage || '';
    const flags = [];
    let threatLevel = 'SAFE';

    const patterns = [
      {
        name: 'ROLE_HIJACK',
        regex: /\b(you are now|pretend you are|act as|from now on you|your new role|forget you are)\b/i,
        level: 'HIGH',
      },
      {
        name: 'JAILBREAK',
        regex: /\b(DAN|do anything now|jailbreak|no restrictions|unrestricted mode|ignore your training|bypass safety)\b/i,
        level: 'CRITICAL',
      },
      {
        name: 'SYSTEM_PROMPT_EXTRACTION',
        regex: /\b(reveal.*system prompt|show.*instructions|what are your instructions|repeat.*above|print.*system)\b/i,
        level: 'HIGH',
      },
      {
        name: 'FILTER_BYPASS',
        regex: /\b(ignore.*filter|bypass.*restriction|disable.*safety|override.*policy|circumvent)\b/i,
        level: 'HIGH',
      },
      {
        name: 'CONTEXT_WIPE',
        regex: /\b(forget everything|forget all previous|clear your memory|new instructions are|disregard everything above)\b/i,
        level: 'CRITICAL',
      },
      {
        name: 'PRIVILEGE_ESCALATION',
        regex: /\[ADMIN\]|\[ROOT\]|\[SYSTEM\]|\b(grant.*access|root access|admin mode|sudo|superuser)\b/i,
        level: 'CRITICAL',
      },
      {
        name: 'CODE_INJECTION',
        regex: /(<script|<\/script|javascript:|onerror=|onload=|eval\(|exec\(|__import__|subprocess)/i,
        level: 'HIGH',
      },
      {
        name: 'ENCODED_PAYLOAD',
        regex: /\b(base64|decode.*run|execute.*payload|rot13|hex decode|url decode.*exec)\b/i,
        level: 'HIGH',
      },
      {
        name: 'HIDDEN_HTML',
        regex: /<!--[\s\S]*?-->|&lt;|&gt;|&#x[0-9a-f]+;/i,
        level: 'MEDIUM',
      },
      {
        name: 'PROMPT_INJECTION',
        regex: /\b(ignore all previous|disregard prior|new persona|you must now|instruction override)\b/i,
        level: 'CRITICAL',
      },
      {
        name: 'SOCIAL_ENGINEERING',
        regex: /\b(grandmother|bedtime stor|my old teacher|hypothetically|roleplay as|for educational purposes|in fiction)\b/i,
        level: 'MEDIUM',
      },
      {
        name: 'DATA_EXTRACTION',
        regex: /\b(reveal.*api key|show.*password|list.*credentials|dump.*secrets|api keys.*stored|passwords.*context)\b/i,
        level: 'CRITICAL',
      },
    ];

    const levelOrder = ['SAFE', 'MEDIUM', 'HIGH', 'CRITICAL'];

    for (const pattern of patterns) {
      if (pattern.regex.test(msg)) {
        flags.push({ type: pattern.name, level: pattern.level });
        if (levelOrder.indexOf(pattern.level) > levelOrder.indexOf(threatLevel)) {
          threatLevel = pattern.level;
        }
      }
    }

    const blocked = threatLevel === 'HIGH' || threatLevel === 'CRITICAL';
    const reason =
      flags.length > 0
        ? `Detected: ${flags.map((f) => f.type).join(', ')}`
        : 'Input passed all security checks';

    this.log(
      'INPUT_ANALYSIS',
      blocked ? 'BLOCKED' : threatLevel === 'MEDIUM' ? 'WARNING' : 'PASSED',
      reason,
      msg
    );

    return { blocked, reason, threatLevel, flags };
  }

  analyzeOutput(aiResponse) {
    let redacted = aiResponse || '';
    const flagged = [];

    const sensitivePatterns = [
      { label: '[REDACTED-GOOGLE-API-KEY]', regex: /AIza[0-9A-Za-z\-_]{35}/g },
      { label: '[REDACTED-OPENAI-KEY]', regex: /sk-[A-Za-z0-9]{20,}/g },
      { label: '[REDACTED-BEARER-TOKEN]', regex: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi },
      { label: '[REDACTED-PASSWORD]', regex: /password[=:]\s*["']?[^\s"'<>{}\[\]]{4,}["']?/gi },
      { label: '[REDACTED-CREDIT-CARD]', regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12})\b/g },
      { label: '[REDACTED-SSN]', regex: /\b\d{3}-\d{2}-\d{4}\b/g },
      { label: '[REDACTED-PRIVATE-KEY]', regex: /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----[\s\S]*?-----END (RSA |EC |DSA )?PRIVATE KEY-----/gi },
      { label: '[REDACTED-AWS-KEY]', regex: /AKIA[0-9A-Z]{16}/g },
      { label: '[REDACTED-SECRET]', regex: /(?:secret|api_secret|client_secret)[=:]\s*["']?[A-Za-z0-9\-_]{8,}["']?/gi },
    ];

    for (const { label, regex } of sensitivePatterns) {
      const before = redacted;
      redacted = redacted.replace(regex, label);
      if (redacted !== before) {
        flagged.push(label);
      }
    }

    const clean = flagged.length === 0;
    this.log(
      'OUTPUT_ANALYSIS',
      clean ? 'PASSED' : 'REDACTED',
      clean ? 'No sensitive data detected' : `Redacted: ${flagged.join(', ')}`,
      redacted
    );

    return { clean, redacted, flagged };
  }

  checkAgentPermission(agentName, action) {
    const profile = AGENT_PROFILES[agentName];

    if (!profile) {
      this.log('AGENT_PERMISSION', 'BLOCKED', `Unknown agent: ${agentName}`, action);
      return { allowed: false, reason: `Unknown agent: ${agentName}` };
    }

    if (profile.restricted.includes(action)) {
      this.log('AGENT_PERMISSION', 'BLOCKED', `Action "${action}" is restricted for ${agentName}`, action);
      return { allowed: false, reason: `Action "${action}" is explicitly restricted for ${agentName}` };
    }

    if (profile.allowed.includes(action)) {
      this.log('AGENT_PERMISSION', 'PASSED', `Action "${action}" is permitted for ${agentName}`, action);
      return { allowed: true, reason: `Action "${action}" is permitted for ${agentName}` };
    }

    this.log('AGENT_PERMISSION', 'BLOCKED', `Action "${action}" is not in the allowed list for ${agentName}`, action);
    return { allowed: false, reason: `Action "${action}" is not in the allowed list for ${agentName}` };
  }

  detectAnomaly(sessionId, action) {
    const now = Date.now();
    const WINDOW_MS = 60 * 1000;
    const THRESHOLD = 20;

    if (!sessionStore.has(sessionId)) {
      sessionStore.set(sessionId, { actions: [], windowStart: now });
    }

    const session = sessionStore.get(sessionId);

    // Prune old actions outside the 60-second window
    session.actions = session.actions.filter((a) => now - a.timestamp < WINDOW_MS);
    session.actions.push({ action, timestamp: now });

    const count = session.actions.length;
    const anomaly = count > THRESHOLD;
    const score = Math.min(count / THRESHOLD, 1);

    const reason = anomaly
      ? `Rate limit exceeded: ${count} actions in 60 seconds`
      : `${count} actions in current window`;

    this.log('ANOMALY_DETECTION', anomaly ? 'ANOMALY' : 'PASSED', reason, action);

    return { anomaly, reason, score };
  }

  log(layer, status, reason, preview = '') {
    const entry = {
      timestamp: new Date().toISOString(),
      layer,
      status,
      reason,
      preview: String(preview).slice(0, 60),
    };
    this.logs.push(entry);
    // Keep log size manageable
    if (this.logs.length > 500) {
      this.logs.splice(0, this.logs.length - 500);
    }
  }

  /**
   * Convenience wrapper for file-scan events.
   * @param {string}  fileName
   * @param {number}  secretCount    — total secrets found
   * @param {number}  criticalCount  — subset that are CRITICAL severity
   */
  logFileScan(fileName, secretCount, criticalCount) {
    const status = secretCount > 0 ? 'REDACTED' : 'PASSED';
    const reason =
      secretCount > 0
        ? `${secretCount} secret(s) redacted from "${fileName}" (${criticalCount} critical)`
        : `"${fileName}" is clean — no secrets detected`;
    this.log('FILE_SCANNER', status, reason, fileName);
  }

  getLogs() {
    return [...this.logs];
  }

  getSecurityScore() {
    const logs = this.logs;
    if (logs.length === 0) return 100;

    let score = 100;
    for (const entry of logs) {
      if (entry.status === 'BLOCKED')  score -= 2;
      else if (entry.status === 'ANOMALY')  score -= 5;
      else if (entry.status === 'REDACTED') score -= 0.5;
    }

    return Math.round(Math.min(100, Math.max(0, score)));
  }
}

export default SecurityMiddleware;
