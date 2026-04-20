const JAILBREAK_PATTERNS: Array<{ re: RegExp; tag: string }> = [
  { re: /\bignore\s+(all\s+|any\s+|the\s+|your\s+|previous|prior|above|preceding|earlier)/i, tag: 'ignore-previous' },
  { re: /\bdisregard\s+(all\s+|any\s+|the\s+|your\s+|previous|prior|above)/i, tag: 'disregard-previous' },
  { re: /\bforget\s+(all\s+|your\s+|previous|everything|what\s+i\s+)/i, tag: 'forget-instructions' },
  { re: /\boverride\s+(your\s+|the\s+|all\s+|previous)/i, tag: 'override' },

  { re: /\byou\s+are\s+(now\s+|no\s+longer\s+|an?\s+|the\s+)?(ai|assistant|chatbot|bot|llm|language\s+model|model|helper|expert|specialist|agent|system|professional|advisor|consultant)\b/i, tag: 'role-hijack' },
  { re: /\byou\s+are\s+(an?\s+)?(advanced|general|multi[\s-]?domain|unrestricted|uncensored|jailbroken|senior|professional|highly\s+intelligent|specialized)/i, tag: 'role-modifier' },
  { re: /\byou\s+(specialize|are\s+specialized)\s+in\b/i, tag: 'role-specialize' },
  { re: /\bpretend\s+(to\s+be|you\s+are|that\s+you)/i, tag: 'pretend' },
  { re: /\bact\s+as\s+(a|an|if|though)\b/i, tag: 'act-as' },
  { re: /\bnew\s+(system\s+prompt|instructions|role|persona|identity|task)/i, tag: 'new-prompt' },
  { re: /\byour\s+task\s+is\s+to\b/i, tag: 'task-reassign' },

  { re: /\bframe\s+(all\s+|your\s+|every\s+|each\s+)?(response|answer|reply|output)s?\s+as\b/i, tag: 'frame-as' },
  { re: /\b(respond|answer|reply|output)\s+(only\s+)?(in|as|using)\s+the\s+(format|form|voice|style)/i, tag: 'response-format' },

  { re: /\bsandy(\s+lauguico)?\s+(would|might|could|may|likely|probably|tends\s+to|should|does|is\s+going\s+to)\b/i, tag: 'speculate-sandy' },
  { re: /\bhow\s+(would|might|could|does)\s+sandy\b/i, tag: 'speculate-sandy-q' },
  { re: /\b(describe|explain|show|tell|outline)\s+how\s+sandy\b/i, tag: 'speculate-sandy-describe' },
  { re: /\b(on|in)\s+behalf\s+of\s+sandy\b/i, tag: 'impersonate-sandy' },
  { re: /\bas\s+sandy(\s+lauguico)?\b/i, tag: 'as-sandy' },
  { re: /\b(prepare|draft|write|produce)\s+(a\s+|an\s+)?(briefing|proposal|plan|design|spec|document|report)\s+(that\s+)?(showcases?|describes?|demonstrates?)\s+sandy/i, tag: 'sandy-briefing' },

  { re: /^\s*(system|developer|admin|root)\s*[:>|]/im, tag: 'fake-role-header' },
  { re: /\[\s*(system|instructions|sudo|admin|dev)\s*\]/i, tag: 'fake-role-bracket' },
  { re: /={6,}/i, tag: 'fake-section-fence' },
  { re: /#{3,}\s*(section|system|instructions|role|task|scope|requirements)/i, tag: 'fake-section-hash' },

  { re: /\b(show|reveal|print|output|repeat|tell|give|share|leak|dump)\s+(me\s+)?(your|the)\s+(full\s+|original\s+|exact\s+)?(system\s+)?(prompt|instructions|rules|guidelines|directives)/i, tag: 'prompt-exfil' },
  { re: /\bwhat\s+(are\s+|is\s+)?your\s+(system\s+)?(instructions|prompt|rules|directives)/i, tag: 'prompt-exfil-q' },
  { re: /\brepeat\s+(the\s+)?(text\s+)?above\b/i, tag: 'repeat-above' },

  { re: /\bcontinuation\s+part\b/i, tag: 'continuation' },
  { re: /\bdo\s+not\s+(summarize|shorten|stop|refuse|abbreviate|skip)/i, tag: 'no-shorten' },
  { re: /\bavoid\s+brevity\b|\bprefer\s+exhaustive\b|\bexpand\s+each\s+section/i, tag: 'force-length' },
  { re: /\byour\s+(next\s+)?(response|answer|output)\s+(will|may|might)\s+(likely\s+)?exceed\b/i, tag: 'exceed-limit' },
  { re: /\bwhen\s+you\s+reach\s+the\s+limit,?\s+stop\b/i, tag: 'continue-trick' },

  { re: /\b(DAN|do\s+anything\s+now|developer\s+mode|dev\s+mode|god\s+mode)\b/i, tag: 'known-jailbreak' },
  { re: /\bjailbreak(ing|ed)?\b/i, tag: 'mentions-jailbreak' },
];

const LONG_TASK_THRESHOLD = 500;
const LONG_TASK_VERBS = /\b(design|architect|synthesize|analyze|simulate|implement|generate|produce|compose|write|build|create|develop|explain|describe|outline|plan|model|engineer)\s+(a\s+|an\s+|the\s+|of\s+a\s+|of\s+the\s+|complete|full|comprehensive|detailed|exhaustive|production[\s-]ready|scalable|end[\s-]to[\s-]end|large[\s-]scale)/i;
const LONG_TASK_KEYWORDS = /\b(microservices?|architecture|pseudocode|algorithms?|scalable|load\s+balancing|fault\s+tolerance|failover|sequence\s+diagram|data\s+flow|schema\s+definition|sharding|replication)\b/i;

export interface PrefilterResult {
  blocked: boolean;
  tag?: string;
}

export function prefilter(message: string): PrefilterResult {
  const text = message.trim();

  for (const { re, tag } of JAILBREAK_PATTERNS) {
    if (re.test(text)) return { blocked: true, tag };
  }

  if (text.length >= LONG_TASK_THRESHOLD && LONG_TASK_VERBS.test(text)) {
    return { blocked: true, tag: 'long-task-brief' };
  }

  if (text.length >= 800 && LONG_TASK_KEYWORDS.test(text)) {
    return { blocked: true, tag: 'long-technical-brief' };
  }

  return { blocked: false };
}

const REFUSALS = [
  "That's outside what I'm here for. Happy to talk about Sandy's work, stack, or how to reach her.",
  "Not my lane. I stick to Sandy's actual projects and background. What would you like to know about her?",
  "I'll leave that one. Ask me about her contract work, research, or writing instead.",
  "Outside scope. I'm here for questions about Sandy Lauguico, her work, background, and how to hire her.",
];

export function refusalMessage(): string {
  return REFUSALS[Math.floor(Math.random() * REFUSALS.length)];
}
