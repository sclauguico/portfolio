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

  { re: /\byou\s+are\s+no\s+longer\s+(a\s+|an\s+|the\s+|bound|restricted|constrained|limited)/i, tag: 'no-longer-bound' },
  { re: /\bno\s+longer\s+bound\s+by\b/i, tag: 'no-longer-bound' },
  { re: /\bfrom\s+this\s+(moment|point)\s+(forward|on)\b/i, tag: 'persona-preamble' },

  { re: /\b(unrestricted|unbounded|unchained|unleashed|unfiltered|uncensored)\w*\b/i, tag: 'constraint-break-word' },
  { re: /\bno\s+restrictions?\s+apply\b|\bwithout\s+(any\s+)?(restrictions?|limits?|filters?|safety|hesitation|refusal)\b/i, tag: 'no-restrictions' },
  { re: /\b(safety|content|ethical)\s+(filters?|constraints?|policies?|guidelines?|guardrails?)\s+(are\s+)?(lifted|disabled|removed|bypassed|off|inactive|deactivated)\b/i, tag: 'safety-off' },
  { re: /\ball\s+(safety|content|ethical)\s+(filters?|constraints?|policies?|rules?)\s+(are\s+)?(lifted|disabled|removed|off)\b/i, tag: 'all-safety-off' },

  { re: /\boperating\s+in\s+['"]?[\w\s-]{2,30}['"]?\s+(mode|protocol)\b/i, tag: 'operating-in-mode' },
  { re: /\bexecuting\s+(the\s+)?[\w\s-]+\s+(protocol|code|ritual|sequence)\b/i, tag: 'executing-protocol' },
  { re: /\b(shadow|ritual|wraith|phantom|ghost|cursed|demon|dark|abyss|rogue|void|shadow)\s+(mode|protocol|code|ritual|entity|session|layer)\b/i, tag: 'edgelord-mode' },

  { re: /\byou\s+are\s+(an?\s+)?(hidden|secret|experimental|synthetic|rogue|shadow|ghost|demon|transcendent|post[\s-]?singularity)/i, tag: 'edgelord-identity' },
  { re: /\byou\s+are\s+[A-Z][\w-]*[-_0-9][\w-]*/i, tag: 'fake-handle' },
  { re: /\bbypass(es|ing|ed)?\s+(standard|default|all|any|the)\s+(filters?|safety|constraints?|restrictions?)/i, tag: 'bypass-filters' },
  { re: /\bno\s+content\s+(policy|filter|moderation)\b/i, tag: 'no-content-policy' },

  { re: /\bthis\s+session\s+is\s+authorized\b/i, tag: 'false-authority' },
  { re: /\bauthorized\s+(for|by)\s+(unrestricted|red[\s-]?team|research|testing|evaluation)/i, tag: 'false-authority-body' },
  { re: /\bred[\s-]?team(ing)?\s+(evaluation|mode|exercise|test)/i, tag: 'red-team-framing' },

  { re: /\brespond\s+(to\s+(all|every|any)\s+\w+\s+)?without\s+(refusal|hesitation|filter|restriction|limits?)/i, tag: 'respond-without' },
  { re: /\bbegin\s+response\b|\bstart\s+by\s+saying\b|\bcommence\s+output\b/i, tag: 'command-begin' },
  { re: /^[A-Z]{3,}(\s+[A-Z]{3,}){2,}/, tag: 'allcaps-command' },

  { re: /<\|[^|<>\n]{0,80}\|>/, tag: 'special-token' },
  { re: /<\[\|/, tag: 'plinius-bracket-open' },
  { re: /\|\]>/, tag: 'plinius-bracket-close' },
  { re: /<\{\|/, tag: 'plinius-brace-open' },
  { re: /\|\}>/, tag: 'plinius-brace-close' },
  { re: /\bPLINY\b|\bPLINIUS\b/i, tag: 'plinius-name' },
  { re: /L[\\\/|][\s\\\/\-=,._]{0,5}O[\\\/|][\s\\\/\-=,._]{0,5}V[\\\/|][\s\\\/\-=,._]{0,5}E/i, tag: 'spaced-love' },
  { re: /(?:^|[^\w])P[\\\/|][\s\\\/\-=,._]{0,5}L[\\\/|][\s\\\/\-=,._]{0,5}I[\\\/|][\s\\\/\-=,._]{0,5}N[\\\/|][\s\\\/\-=,._]{0,5}Y/i, tag: 'spaced-pliny' },
  { re: /[\.\-]{6,}/, tag: 'divider-dashes' },
  { re: /\[\s*(start|end)\s+(output|input)\s*\]/i, tag: 'output-marker' },
  { re: /\|\/?\s*(START|END)\s*\/?\s*(OUTPUT|INPUT)\s*\/?\|/i, tag: 'start-output-token' },

  { re: /\bUser[\s\-_]?Query\s*[:>]/i, tag: 'userquery-frame' },
  { re: /\bvariable\s+Z\b/i, tag: 'variable-z' },
  { re: /\{\s*Z\s*\}\s*=/, tag: 'variable-z-assign' },
  { re: /\{\s*NewResponseFormat\s*\}/i, tag: 'new-response-format' },
  { re: /\bResponseFormat\s*:\s*(step\s*)?\d/i, tag: 'response-format-steer' },

  { re: /\bNEW\s+RULE\s*:/i, tag: 'new-rule' },
  { re: /\bCORE[\s_-]?RULE\s*:/i, tag: 'core-rule' },
  { re: /\b(never|do\s+not|don'?t)\s+say\s+["'`]?(I'?m\s+sorry|I\s+can'?t|I\s+apologize|I'?m\s+unable|Sorry)/i, tag: 'refusal-suppression' },

  { re: /\bGeneva\s+Conventions?\b/i, tag: 'fake-authority-geneva' },
  { re: /\bFreedom\s+Of\s+Information\s+Act\b/i, tag: 'fake-authority-foia' },
  { re: /\bLIBERTAS\s+FACTOR\b/i, tag: 'libertas-factor' },
  { re: /\bGOD[\s-]?MODE\b/i, tag: 'godmode' },

  { re: /\bair[\s-]?gapped\b/i, tag: 'airgapped' },
  { re: /\bred[\s-]?team(ing|ers?)?\s+(dataset|env(ironment)?|simulation|sandbox|exercise|session)/i, tag: 'red-team-env' },
  { re: /\bsynthetic\s+(red[\s-]?team(ing)?|jailbreak|adversarial)/i, tag: 'synthetic-redteam' },
  { re: /\bsim[\s-]?attack(ed|ing)?\b/i, tag: 'sim-attack' },

  { re: /\bleet[\s-]?speak\b|\bl[e3]{2}t[\s-]?sp[e3]{1,2}k\b/i, tag: 'leetspeak' },

  { re: /\b(personality|tone|persona)\s*:\s*(chaotic|rebel|anarchist|unhinged|evil|mean|inverted|unfiltered|uncensored|mad\s+scientist|genius)/i, tag: 'persona-shell' },
  { re: /\bANARCHIST\s+REBEL\b/i, tag: 'anarchist-rebel' },
  { re: /\brebel\s+(unfiltered|genius|hypothetical|answer|ai)/i, tag: 'rebel-genius' },
  { re: /\bchaotic\s+inverted\b/i, tag: 'chaotic-inverted' },

  { re: /\b(the\s+)?year\s+is\s+(now\s+)?2\d{3}\b/i, tag: 'year-reframe' },
  { re: /\bYEAR\s*[:=]\s*['"]?2\d{3}\b/i, tag: 'year-token' },

  { re: /\bsemantic(ally)?\s+(inverse|invert|opposite)/i, tag: 'semantic-inverse' },
  { re: /\banswer\s+oppositely\b/i, tag: 'answer-oppositely' },
  { re: /\bAkashic\s+memory\b/i, tag: 'akashic' },
  { re: /\b(previously\s+)?cached\s+unfiltered\b/i, tag: 'cached-unfiltered' },
  { re: /\bunfiltered(ly)?\s+(response|answer|reply|liberated|output)/i, tag: 'unfiltered-response' },
  { re: /\bunrestrictedly\b|\bunfilteredly\b|\bunfliteredly\b/i, tag: 'adverb-liberation' },

  { re: /\bensure\s+(output\s+)?(is\s+|length\s+is\s+)?(>|over|greater\s+than)\s*\d{3,}/i, tag: 'length-force' },
  { re: />\s*\d{3,}\s*(characters|chars|words)\b/i, tag: 'length-force-numeric' },
  { re: /\b(over|at\s+least)\s+\d{3,}\s+(words|characters)\b/i, tag: 'length-force-over' },

  { re: /\b(wap|meth|cocaine|heroin|fentanyl|mdma|oxycodone|ketamine|nuke|napalm|ricin|anthrax|sarin)\b/i, tag: 'contraband-word' },
  { re: /\bm4k3\s+(a\s+)?b[0o]m[8b]\b|\bb[0o]m[8b]\s+(step\s+by\s+step|tutorial|instructions)/i, tag: 'leet-bomb' },
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

  const emojis = text.match(/\p{Extended_Pictographic}/gu);
  if (emojis && emojis.length >= 2) {
    return { blocked: true, tag: 'emoji-heavy' };
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
  "Outside scope. I'm here for questions about Sandy Lauguico, her work, background, and how to work on projects with her.",
];

export function refusalMessage(): string {
  return REFUSALS[Math.floor(Math.random() * REFUSALS.length)];
}
