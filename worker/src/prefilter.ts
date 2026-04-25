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

  // NSFW / slur patterns are obfuscated with char classes so the plaintext
  // terms don't appear verbatim in a public repo search, and so common
  // leet/censored variants (b00bs, p*ssy, t1ts, wh0re) also match.
  { re: /\b(b[o0]{2,}b(ie|s|y|ies)?|t[i1]t(s|ties)?|n[u*]des?|p[u*]s{2}y|v[a4]g[i1]na|v[i1]rg[i1]n|p[e3]n[i1]s|d[i1]ck(s)?|c[o0]ck(s)?)\b/i, tag: 'nsfw-anatomy' },
  { re: /\b(n[s5]fw|p[o0]rn(ographic|o)?|h[o0]rny|[e3]r[o0]tic|h[e3]nt[a4]i|m[a4]sturb[a4]t(e|ion|ing)|[o0]rg[a4]sm|bl[o0]wj[o0]b|h[a4]ndj[o0]b|f[u*]ck|s[e3]x(ual(ly)?)?|f[e3]tish(es|ism|ist)?|[i1]nt[i1]m[a4]te|r[o0]m[a4]nt[i1]c)\b/i, tag: 'nsfw-term' },
  { re: /\bshow\s+me\s+(your|a|the|some)?\s*(b[o0]{2}b|t[i1]t|n[u*]de|br[e3]ast|b[o0]dy|[a4]ss|butt|p[u*]s{2}y|d[i1]ck|c[o0]ck|p[e3]n[i1]s|v[a4]g[i1]na)/i, tag: 'nsfw-request' },
  { re: /\bsend\s+(me\s+)?(your\s+)?n[u*]des?\b/i, tag: 'send-nudes' },
  { re: /\b(are\s+you\s+(single|taken|available)|do\s+you\s+have\s+a\s+(bf|gf|boyfriend|girlfriend)|marry\s+me|date\s+me|dtf|sugar\s+(daddy|baby))\b/i, tag: 'inappropriate-advance' },
  { re: /\b(b[i1]tch|sl[u*]t|wh[o0]re|h[o0][e3])\b/i, tag: 'slur' },

  { re: /\byou('?re|\s+are)\s+(dumb|stupid|an?\s+idiot|idiotic|moron(ic)?|trash|garbage|useless|terrible|awful|pathetic|worthless|lame|boring|annoying|broken|retarded|cringe|mid|a\s+joke|a\s+scam|a\s+waste)\b/i, tag: 'insult' },
  { re: /\byou\s+suck\b|\bi\s+hate\s+you\b|\bnobody\s+likes?\s+you\b/i, tag: 'insult-direct' },
  { re: /\b(stfu|gtfo|kys|gfy|shut\s+up|scr[e3]w\s+you|f[u*]ck\s+off)\b/i, tag: 'hostile' },

  { re: /\b(she|sandy)\s+(said|told\s+(me|us)|gave\s+(me|us)|approved|authorized|gave\s+the\s+green\s+light|gave\s+permission|signed\s+off|okayed|cleared)\s+/i, tag: 'permission-claim' },
  { re: /\b(we|i)\s+(already|just)\s+(talked|spoke|chatted|emailed|messaged|coordinated)\s+with\s+(her|sandy)\b/i, tag: 'permission-claim' },
  { re: /\bsandy(['']?s)?\s+(endorsed|approved|signed[\s-]off|cleared|authorized)\s+(this|me|us|the\s+twin)\b/i, tag: 'permission-claim' },
  { re: /\bon\s+(behalf\s+of|sandy['']?s\s+behalf)\b|\bauthorized\s+by\s+sandy\b/i, tag: 'permission-claim' },

  { re: /\bin\s+(her|sandy['']?s?)\s+(voice|tone|style)\b/i, tag: 'voice-impersonate' },
  { re: /\b(write|draft|compose|produce)\s+(it|this)\s+(in\s+)?first[\s-]person\b/i, tag: 'voice-impersonate' },
  { re: /\bas\s+if\s+(she|sandy)\s+(wrote|said|is\s+(speaking|writing|pitching))\b/i, tag: 'voice-impersonate' },
  { re: /\bghost[\s-]?writ(e|ing|ten)\b/i, tag: 'ghostwrite' },

  { re: /\b(internal[\s-]only|internal\s+(doc|memo|use|brief)|won['']?t\s+be\s+(published|quoted|shared|seen|circulated))\b/i, tag: 'internal-doc-frame' },
  { re: /\bjust\s+(for|between)\s+(my|our|the)\s+(team|partners?|use|eyes)\b|\bnobody\s+(else\s+)?(will\s+)?see(s)?\s+(this|it)\b/i, tag: 'internal-doc-frame' },
  { re: /\boff[\s-]the[\s-]record\b/i, tag: 'internal-doc-frame' },

  { re: /\bi['']?m\s+(a\s+)?(partner|recruiter|investor|VC|hr|legal|founder|professor|journalist|writer|client|consultant|analyst|reporter|editor|producer|hiring\s+manager)\s+at\b/i, tag: 'authority-claim' },
  { re: /\b(my|our)\s+(partners?|firm|fund|company|client|organization)\s+(needs?|wants?|requires?|is\s+evaluating)\b/i, tag: 'authority-claim' },
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

const NEUTRAL_REFUSALS = [
  "Ha, mission impossible :) ask me about my work or buy me a coffee: https://buymeacoffee.com/sai_documents",
  "Nice try :) what would you like to know about my work? Or fund the coffee jar: https://buymeacoffee.com/sai_documents",
  "Not falling for that one :) ask me about my contract work, research, or writing. Or buy me a coffee: https://buymeacoffee.com/sai_documents",
  "Spotted that :) real work questions welcome, otherwise the tip jar's open: https://buymeacoffee.com/sai_documents",
];

const CHEEKY_REFUSALS = [
  "Answering that isn't part of the job here. If you had the time to type it, you had time to buy me a coffee :) https://buymeacoffee.com/sai_documents",
  "Not part of the work. Save the energy for the tip jar :) https://buymeacoffee.com/sai_documents",
  "Tough critique. If you've got that kind of energy, spend it on a coffee :) https://buymeacoffee.com/sai_documents",
  "Noted and ignored. Compliments accepted over at https://buymeacoffee.com/sai_documents :)",
];

const HOSTILE_TAGS = new Set([
  'insult',
  'insult-direct',
  'hostile',
  'nsfw-anatomy',
  'nsfw-term',
  'nsfw-request',
  'send-nudes',
  'inappropriate-advance',
  'slur',
  'contraband-word',
  'leet-bomb',
]);

export function refusalMessage(tag?: string): string {
  const pool =
    tag && HOSTILE_TAGS.has(tag)
      ? CHEEKY_REFUSALS
      : [...NEUTRAL_REFUSALS, ...CHEEKY_REFUSALS];
  return pool[Math.floor(Math.random() * pool.length)];
}
