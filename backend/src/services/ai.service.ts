import { Injectable, BadRequestException, Optional } from '@nestjs/common';
import { Priority, AIPredictionResult } from '../types';
import { DbService } from './db.service';

/**
 * Filter and remove internal safety/status metadata tags (e.g. "User Safety: safe")
 * while preserving the actual generated civic complaint description.
 */
function sanitizeAiDescription(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';

  let cleaned = rawText;

  // 1. Remove bracketed / parenthetical safety tags
  cleaned = cleaned.replace(/\[\s*(?:user\s+)?safety\s*:[^\]]+\]/gi, '');
  cleaned = cleaned.replace(/\(\s*(?:user\s+)?safety\s*:[^\)]+\)/gi, '');

  // 2. Filter line by line to remove metadata lines
  const lines = cleaned.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    const isSafetyLine = /^(?:[*_~`#>\s-]*)(?:user\s+)?safety(?:[\s_*-]*(?:assessment|rating|status|check|evaluation|result))?(?:[*_~`#>\s-]*):(?:[*_~`#>\s-]*)(?:safe|pass|none|low|acceptable|true|yes|clean|ok|n\/a)\.?(?:[*_~`#>\s-]*)$/i.test(trimmed);
    return !isSafetyLine;
  });

  cleaned = filteredLines.join('\n').trim();

  // 3. Remove inline safety prefix if present at start of a paragraph/sentence
  cleaned = cleaned.replace(/^(?:[*_~`#>\s-]*)(?:user\s+)?safety(?:[\s_*-]*(?:assessment|rating|status|check|evaluation|result))?(?:[*_~`#>\s-]*):(?:[*_~`#>\s-]*)(?:safe|pass|none|low|acceptable|true|yes|clean|ok|n\/a)\.?(?:[*_~`#>\s-]*)[\s,.-]*/i, '');

  // 4. Remove any trailing safety note at the end of the text
  cleaned = cleaned.replace(/\s*(?:[*_~`#>\s-]*)(?:user\s+)?safety(?:[\s_*-]*(?:assessment|rating|status|check|evaluation|result))?(?:[*_~`#>\s-]*):(?:[*_~`#>\s-]*)(?:safe|pass|none|low|acceptable|true|yes|clean|ok|n\/a)\.?(?:[*_~`#>\s-]*)$/i, '');

  // 5. Normalize multiple blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned || rawText.trim();
}

@Injectable()
export class AIService {
  constructor(@Optional() private readonly db?: DbService) {}

  private departmentKeywords: Record<string, { code: string; name: string; sla: number; keywords: string[] }> = {
    ROADS_ASPHALT: {
      code: 'ROADS_ASPHALT',
      name: 'Roads & Asphalt',
      sla: 48,
      keywords: [
        'pothole', 'road', 'asphalt', 'tar', 'crack', 'pavement', 'bridge', 'speedbreaker',
        'footpath', 'divider', 'bitumen', 'gravel', 'cave-in', 'crater', 'sidewalk', 'manhole cover broken'
      ],
    },
    WATER_SUPPLY: {
      code: 'WATER_SUPPLY',
      name: 'Water Supply',
      sla: 24,
      keywords: [
        'water', 'pipe', 'leak', 'pipeline', 'drinking water', 'tanker', 'pressure', 'dirty water',
        'contamination', 'tap', 'borewell', 'seepage', 'no water', 'burst pipe', 'water supply'
      ],
    },
    SANITATION_HEALTH: {
      code: 'SANITATION_HEALTH',
      name: 'Sanitation & Health',
      sla: 24,
      keywords: [
        'garbage', 'waste', 'trash', 'smell', 'sweeping', 'clean', 'dump', 'dustbin', 'litter',
        'mosquito', 'bleaching', 'drain', 'overflow', 'sewer', 'debris', 'dead animal', 'stench',
        'drainage', 'gutter', 'clogged drain', 'solid waste', 'sanitation'
      ],
    },
    STREET_LIGHTING: {
      code: 'STREET_LIGHTING',
      name: 'Street Lighting',
      sla: 12,
      keywords: [
        'light', 'streetlight', 'lamp', 'dark', 'wire', 'pole', 'electric', 'spark', 'transformer',
        'power', 'current', 'led', 'bulb', 'illumination', 'street light', 'no light', 'flickering lamp'
      ],
    }
  };

  /**
   * Analyze complaint with Gemini AI if GEMINI_API_KEY is available, or fallback to rule-based NLP classifier.
   * Restricts output strictly to the 4 authorized municipal departments.
   * Does NOT default to Sanitation & Health.
   */
  async analyzeComplaint(title: string, description: string, hasImages: boolean, imageBase64OrUrl?: string): Promise<AIPredictionResult> {
    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey && geminiKey.trim() !== '') {
      try {
        const prompt = `You are a Municipal Civic Grievance AI classifier for Municipal Administration & Urban Development.
Classify the following civic complaint strictly into ONE of these four departments:
1. Roads & Asphalt
2. Water Supply
3. Sanitation & Health
4. Street Lighting

CRITICAL INSTRUCTION:
Identify the PRIMARY CIVIC GRIEVANCE from the Title, Description, and Image.
Do NOT classify based on background scenery or surrounding environment. For example:
- If a broken dustbin, garbage, or blocked drain is on a road, the primary grievance is "Sanitation & Health", NOT "Roads & Asphalt".
- If a water pipe is leaking or water is overflowing on a road/street, the primary grievance is "Water Supply", NOT "Roads & Asphalt".
- If a streetlight, lamp, or pole is broken on a road, the primary grievance is "Street Lighting", NOT "Roads & Asphalt".
- Only classify as "Roads & Asphalt" if the physical road surface, pavement, footpath, or pothole itself is the primary defect.

If the complaint does not contain enough information to classify into any of these four, set "department" to "UNCLASSIFIED".

Complaint Title: ${title}
Complaint Description: ${description}

Respond ONLY with a valid JSON object in this exact format:
{
  "department": "Roads & Asphalt" | "Water Supply" | "Sanitation & Health" | "Street Lighting" | "UNCLASSIFIED",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY",
  "confidenceScore": 0.0 to 1.0,
  "reasoning": "brief explanation"
}`;

        let requestBody: any = {
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        };

        if (imageBase64OrUrl && imageBase64OrUrl.startsWith('data:image')) {
          const match = imageBase64OrUrl.match(/^data:(.+);base64,(.+)$/);
          if (match) {
            requestBody.contents[0].parts.unshift({
              inlineData: {
                mimeType: match[1],
                data: match[2]
              }
            });
          }
        }

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey.trim()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          }
        );

        if (geminiRes.ok) {
          const resJson = await geminiRes.json();
          const candidateText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            const parsed = JSON.parse(candidateText);
            const deptMapping: Record<string, string> = {
              'Roads & Asphalt': 'ROADS_ASPHALT',
              'Water Supply': 'WATER_SUPPLY',
              'Sanitation & Health': 'SANITATION_HEALTH',
              'Street Lighting': 'STREET_LIGHTING'
            };

            const deptCode = deptMapping[parsed.department];
            if (deptCode && this.departmentKeywords[deptCode]) {
              const deptInfo = this.departmentKeywords[deptCode];
              const confidence = Math.min(0.99, Math.max(0.65, parsed.confidenceScore || 0.88));

              let estimatedHours = deptInfo.sla;
              const priority = (parsed.priority as Priority) || Priority.MEDIUM;
              if (priority === Priority.EMERGENCY) estimatedHours = Math.max(6, Math.floor(deptInfo.sla * 0.25));
              if (priority === Priority.HIGH) estimatedHours = Math.max(12, Math.floor(deptInfo.sla * 0.5));

              return {
                departmentCode: deptInfo.code,
                departmentName: deptInfo.name,
                confidenceScore: parseFloat(confidence.toFixed(2)),
                priority,
                estimatedHours,
                duplicateMatchRatio: 0.0,
                similarComplaintIds: [],
                summary: `Gemini AI: ${parsed.reasoning || `Classified under ${deptInfo.name}`}`,
              };
            }
          }
        }
      } catch (err) {
        console.warn('Gemini API call failed, using deterministic NLP classifier:', err);
      }
    }

    // Deterministic Rule-Based Grievance-Centric NLP classifier
    const normTitle = (title || '').toLowerCase().trim();
    const normDesc = (description || '').toLowerCase().trim();
    const fullText = `${normTitle} ${normDesc}`.trim();

    if (!fullText || fullText.length < 3) {
      return {
        departmentCode: 'UNCLASSIFIED',
        departmentName: 'Classification unavailable',
        confidenceScore: 0,
        priority: Priority.MEDIUM,
        estimatedHours: 48,
        duplicateMatchRatio: 0.0,
        similarComplaintIds: [],
        summary: 'Please provide more details in the title or description for AI classification.',
      };
    }

    // High-specificity primary defect keywords vs low-specificity environmental context words
    const primaryKeywords: Record<string, string[]> = {
      SANITATION_HEALTH: [
        'garbage', 'waste', 'trash', 'dustbin', 'dust bin', 'dump', 'litter', 'drain', 'gutter',
        'sewer', 'sewage', 'clogged drain', 'overflowing drain', 'mosquito', 'dead animal', 'stench',
        'smell', 'sweeping', 'clean', 'debris', 'solid waste', 'sanitation', 'dirty drain'
      ],
      WATER_SUPPLY: [
        'pipeline', 'leak', 'leaking', 'burst pipe', 'pipe burst', 'drinking water', 'dirty water',
        'water supply', 'contamination', 'tap', 'borewell', 'seepage', 'no water', 'tanker',
        'valve', 'water pressure', 'pipeline leak'
      ],
      STREET_LIGHTING: [
        'streetlight', 'street light', 'lamp', 'pole', 'electric pole', 'bulb', 'led', 'wire',
        'wiring', 'spark', 'transformer', 'dark street', 'no light', 'illumination', 'flickering',
        'street lamp', 'lamp post'
      ],
      ROADS_ASPHALT: [
        'pothole', 'potholes', 'crater', 'asphalt', 'bitumen', 'tar', 'speedbreaker', 'cave-in',
        'road crack', 'broken road', 'damaged road', 'road repair', 'manhole cover broken',
        'footpath broken', 'divider broken', 'road sink'
      ]
    };

    const contextKeywords: Record<string, string[]> = {
      ROADS_ASPHALT: ['road', 'street', 'pavement', 'footpath', 'divider', 'bitumen', 'gravel', 'bridge', 'sidewalk'],
      WATER_SUPPLY: ['water', 'pipe'],
      SANITATION_HEALTH: ['drainage'],
      STREET_LIGHTING: ['light', 'power', 'current']
    };

    const scores: Record<string, number> = {
      ROADS_ASPHALT: 0,
      WATER_SUPPLY: 0,
      SANITATION_HEALTH: 0,
      STREET_LIGHTING: 0
    };

    // 1. Score Primary Defect Keywords (Heavy weight: 5 for Title, 3 for Description)
    for (const [dept, kws] of Object.entries(primaryKeywords)) {
      for (const kw of kws) {
        if (normTitle.includes(kw)) {
          scores[dept] += 5;
        }
        if (normDesc.includes(kw)) {
          scores[dept] += 3;
        }
      }
    }

    // 2. Score Context Keywords (Only adds 1 point, and does not override if another department has primary defect keywords)
    const hasAnyPrimarySanitationOrWaterOrLight =
      scores.SANITATION_HEALTH > 0 || scores.WATER_SUPPLY > 0 || scores.STREET_LIGHTING > 0;

    for (const [dept, kws] of Object.entries(contextKeywords)) {
      for (const kw of kws) {
        // If the context is 'road' or 'street' but title specifically mentions garbage, water leak, or street light, do not add road context points
        if (dept === 'ROADS_ASPHALT' && hasAnyPrimarySanitationOrWaterOrLight && (kw === 'road' || kw === 'street' || kw === 'footpath')) {
          continue;
        }
        if (normTitle.includes(kw)) {
          scores[dept] += 1;
        }
        if (normDesc.includes(kw)) {
          scores[dept] += 1;
        }
      }
    }

    let matchedCode: string | null = null;
    let highestScore = 0;

    for (const [dept, score] of Object.entries(scores)) {
      if (score > highestScore) {
        highestScore = score;
        matchedCode = dept;
      }
    }

    // If no keyword matches, do NOT default to Sanitation & Health!
    if (!matchedCode || highestScore === 0) {
      return {
        departmentCode: 'UNCLASSIFIED',
        departmentName: 'Classification unavailable',
        confidenceScore: 0.0,
        priority: Priority.MEDIUM,
        estimatedHours: 48,
        duplicateMatchRatio: 0.0,
        similarComplaintIds: [],
        summary: 'Unable to confidently classify into the 4 municipal departments. Please provide more specific details.',
      };
    }

    const deptInfo = this.departmentKeywords[matchedCode];

    // Priority Assessment
    let priority = Priority.MEDIUM;
    if (fullText.includes('urgent') || fullText.includes('hazard') || fullText.includes('spark') || fullText.includes('emergency') || fullText.includes('open manhole')) {
      priority = Priority.EMERGENCY;
    } else if (fullText.includes('severe') || fullText.includes('blocked') || fullText.includes('overflowing') || fullText.includes('broken')) {
      priority = Priority.HIGH;
    } else if (fullText.includes('minor') || fullText.includes('painting') || fullText.includes('regular')) {
      priority = Priority.LOW;
    }

    // Confidence Score Calculation
    const confidenceScore = Math.min(0.98, Math.max(0.75, 0.75 + highestScore * 0.04 + (hasImages ? 0.06 : 0.0)));

    let estimatedHours = deptInfo.sla;
    if (priority === Priority.EMERGENCY) estimatedHours = Math.max(6, Math.floor(deptInfo.sla * 0.25));
    if (priority === Priority.HIGH) estimatedHours = Math.max(12, Math.floor(deptInfo.sla * 0.5));

    return {
      departmentCode: deptInfo.code,
      departmentName: deptInfo.name,
      confidenceScore: parseFloat(confidenceScore.toFixed(2)),
      priority,
      estimatedHours,
      duplicateMatchRatio: 0.0,
      similarComplaintIds: [],
      summary: `NLP Classification identified issue related to ${deptInfo.name} with ${Math.round(confidenceScore * 100)}% confidence. Recommended SLA target: ${estimatedHours} hours.`,
    };
  }

  /**
   * Generate concise complaint description from uploaded image using OpenRouter API
   */
  async generateDescriptionFromImage(image: string): Promise<string> {
    if (!image || image.trim() === '') {
      throw new BadRequestException('Please upload an image first.');
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey || openRouterKey.trim() === '') {
      throw new BadRequestException(
        'OpenRouter AI is not configured on the server. Please set OPENROUTER_API_KEY in backend .env to enable AI description generation.'
      );
    }

    if (openRouterKey.includes('...')) {
      throw new BadRequestException(
        'OPENROUTER_API_KEY in backend/.env is truncated (contains "..."). Please provide the complete OpenRouter API key.'
      );
    }

    try {
      const prompt = `You are a municipal civic grievance assistant for Municipal Administration & Urban Development. Your primary objective is to identify the single PRIMARY CIVIC PROBLEM reported in this photo for municipal action.

Focus strictly on the actual civic defect across these 4 municipal departments:
1. Roads & Asphalt (potholes, cracks, broken asphalt, damaged pavement, damaged manhole cover)
2. Water Supply (pipeline leaks/bursts, leaking joints, dirty water, broken taps/valves)
3. Sanitation & Health (garbage accumulation, overflowing dustbins, dumped waste, blocked drains/gutters)
4. Street Lighting (damaged/broken light fixtures, rusted lamp housing, damaged poles, exposed wiring)

CRITICAL RULES:
- Identify the PRIMARY civic grievance. Ask: "What is the actual civic problem the citizen is reporting?"
- Focus ONLY on the relevant municipal asset and specific visible physical defect.
- DO NOT describe unrelated surroundings, scenery, background roads (unless the road itself is the problem), buildings, vehicles, parked cars, trees, people, weather, or non-defective objects.
- Suggest a targeted repair or inspection action ONLY when justified by the visible defect.
- Format: 1 to 3 concise, factual, grievance-focused sentences.
- Do NOT mention AI, models, computer vision, or internal reasoning.

Output only the concise, grievance-focused complaint description.`;

      const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterKey.trim()}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Smart Civic Connect',
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: image,
                  },
                },
              ],
            },
          ],
        }),
      });

      if (!openRouterRes.ok) {
        const err = await openRouterRes.json().catch(() => ({}));
        const rawErrMsg = err.error?.message || `HTTP ${openRouterRes.status}`;
        
        if (openRouterRes.status === 401 || rawErrMsg.toLowerCase().includes('user not found') || rawErrMsg.toLowerCase().includes('api key')) {
          throw new Error(`OpenRouter API key rejected by OpenRouter (${rawErrMsg}). Please verify OPENROUTER_API_KEY in backend/.env.`);
        }
        
        throw new Error(rawErrMsg);
      }

      const resJson = await openRouterRes.json();
      const generatedText = resJson.choices?.[0]?.message?.content;

      if (!generatedText) {
        throw new Error('No description returned by AI service');
      }

      return sanitizeAiDescription(generatedText);
    } catch (err: any) {
      throw new BadRequestException(`AI Description failed: ${err.message}`);
    }
  }

  /**
   * PrajaSevak AI Assistant Response Generator
   * Supports bilingual responses ('EN' | 'TE') with distinct intent-mapped routing, dynamic DB lookup, and specific follow-up actions.
   */
  async generateChatbotResponse(userMessage: string, language: string = 'EN'): Promise<{ response: string; intent: string; quickReplies?: string[] }> {
    const rawMsg = (userMessage || '').trim();
    const msg = rawMsg.toLowerCase();
    const isTelugu = language.toUpperCase() === 'TE' || /[\u0C00-\u0C7F]/.test(userMessage);

    // 1. Complaint ID / Code pattern detection (e.g. COMP-AP-2026-1024, COMP-1234, UUID, or starts with COMP-)
    const complaintIdRegex = /\b(COMP-[A-Za-z0-9-]+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i;
    const extractedId = rawMsg.match(complaintIdRegex)?.[0] || (msg.startsWith('comp-') || msg.startsWith('comp') ? rawMsg : null);

    if (extractedId && this.db) {
      try {
        const complaint = await this.db.complaint.findFirst({
          where: {
            OR: [
              { complaintNo: { equals: extractedId, mode: 'insensitive' } },
              { id: extractedId },
            ],
          },
          include: { department: true },
        });

        if (complaint) {
          const deptName = complaint.department?.name || complaint.category || 'Municipal Department';
          if (isTelugu) {
            return {
              intent: 'TRACK_COMPLAINT_FOUND',
              response: `ఫిర్యాదు వివరాలు లభించాయి:\n• ఫిర్యాదు సంఖ్య: ${complaint.complaintNo}\n• శీర్షిక: ${complaint.title}\n• విభాగం: ${deptName}\n• ప్రస్తుత స్థితి: ${complaint.status}\n• ప్రాధాన్యత: ${complaint.priority}\n• పరిష్కార లక్ష్య సమయం: ${complaint.estimatedHours} గంటలు\n\nమీరు పూర్తి స్థితి మరియు ధృవీకరించిన ఫోటోలను పౌరుల డ్యాష్‌బోర్డ్‌లో చూడవచ్చు.`,
              quickReplies: ['మరో ఫిర్యాదు తనిఖీ', 'కొత్త సమస్య నమోదు', 'లక్ష్య సమయాలు (SLA)'],
            };
          }
          return {
            intent: 'TRACK_COMPLAINT_FOUND',
            response: `Complaint Record Found:\n• Complaint ID: ${complaint.complaintNo}\n• Title: ${complaint.title}\n• Department: ${deptName}\n• Current Status: ${complaint.status}\n• Priority: ${complaint.priority}\n• SLA Target: ${complaint.estimatedHours} Hours\n\nYou can track full live progress and verification proof photos in your Citizen Dashboard under 'My Complaints'.`,
            quickReplies: ['Check Another Complaint', 'Report New Issue', 'Check SLA Hours'],
          };
        } else {
          if (isTelugu) {
            return {
              intent: 'TRACK_COMPLAINT_NOT_FOUND',
              response: `'${extractedId}' సంఖ్యతో ఎటువంటి యాక్టివ్ ఫిర్యాదు లభించలేదు. దయచేసి మీ SMS రసీదులోని సంఖ్యను సరిచూసుకోండి లేదా డ్యాష్‌బోర్డ్‌లోని 'ఫిర్యాదులు' విభాగాన్ని తనిఖీ చేయండి.`,
              quickReplies: ['నా ఫిర్యాదులు', 'కొత్త సమస్య నమోదు', 'అత్యవసర హెల్ప్‌లైన్'],
            };
          }
          return {
            intent: 'TRACK_COMPLAINT_NOT_FOUND',
            response: `I could not find an active complaint with ID '${extractedId}'. Please verify your Complaint ID from your SMS acknowledgment receipt or check the 'My Complaints' section in your citizen dashboard.`,
            quickReplies: ['Check My Complaints', 'Report New Issue', 'Emergency Helpline'],
          };
        }
      } catch (err) {
        console.warn('DB lookup error in chatbot:', err);
      }
    }

    // 2. Intent: CHECK_SLA
    if (
      msg.includes('sla') ||
      msg.includes('hours') ||
      msg.includes('timeline') ||
      msg.includes('timelines') ||
      msg.includes('how long') ||
      msg.includes('resolution time') ||
      msg.includes('లక్ష్య సమయాలు') ||
      msg.includes('సమయం') ||
      msg.includes('గంటలు') ||
      msg.includes('పరిష్కార సమయం')
    ) {
      if (isTelugu) {
        return {
          intent: 'CHECK_SLA',
          response: `మున్సిపల్ విభాగాల ప్రామాణిక పరిష్కార లక్ష్య సమయాలు (SLA):\n• రోడ్లు & ఇంజనీరింగ్ (Roads & Asphalt) — 48 గంటలు\n• తాగునీటి సరఫరా (Water Supply) — 24 గంటలు\n• పారిశుధ్యం & ఆరోగ్యం (Sanitation & Health) — 24 గంటలు\n• వీధి దీపాలు (Street Lighting) — 12 గంటలు\n\nసమస్య తీవ్రత మరియు అత్యవసర ప్రాధాన్యతను బట్టి పరిష్కార సమయం మారవచ్చు.`,
          quickReplies: ['కొత్త సమస్య నమోదు', 'ఫిర్యాదు స్థితి', 'మున్సిపల్ విభాగాలు'],
        };
      }
      return {
        intent: 'CHECK_SLA',
        response: `Here are the current expected service timelines (SLAs) for municipal departments:\n• Roads & Asphalt — 48 hours\n• Water Supply — 24 hours\n• Sanitation & Health — 24 hours\n• Street Lighting — 12 hours\n\nThe actual resolution time may vary depending on the severity and nature of the complaint.`,
        quickReplies: ['Report New Issue', 'Track Existing Complaint', 'Ask Another Question'],
      };
    }

    // 3. Intent: TRACK_COMPLAINT (Prompt for Complaint ID)
    if (
      msg.includes('track') ||
      msg.includes('status') ||
      msg.includes('existing complaint') ||
      msg.includes('check status') ||
      msg.includes('స్థితి') ||
      msg.includes('ట్రాక్') ||
      msg.includes('కంప్లైంట్ స్థితి')
    ) {
      if (isTelugu) {
        return {
          intent: 'TRACK_COMPLAINT',
          response: 'ఖచ్చితంగా. దయచేసి మీ ఫిర్యాదు సంఖ్యను నమోదు చేయండి, నేను దాని ప్రస్తుత స్థితిని తనిఖీ చేస్తాను.',
          quickReplies: ['నా ఫిర్యాదులు', 'కొత్త సమస్య నమోదు', 'అత్యవసర హెల్ప్‌లైన్'],
        };
      }
      return {
        intent: 'TRACK_COMPLAINT',
        response: 'Sure. Please enter your Complaint ID, and I can help you check its current status.',
        quickReplies: ['Check My Complaints', 'Report New Issue', 'Emergency Helpline'],
      };
    }

    // 4. Intent: EMERGENCY_HELPLINE
    if (
      msg.includes('emergency') ||
      msg.includes('helpline') ||
      msg.includes('hotline') ||
      msg.includes('అత్యవసర') ||
      msg.includes('హెల్ప్‌లైన్')
    ) {
      if (isTelugu) {
        return {
          intent: 'EMERGENCY_HELPLINE',
          response: `అత్యవసర సేవల కోసం సంప్రదించండి:\n• 112 — జాతీయ అత్యవసర హెల్ప్‌లైన్\n• 100 — పోలీస్\n• 101 — అగ్నిమాపక సేవలు\n• 108 — వైద్య అంబులెన్స్ సేవలు`,
          quickReplies: ['కొత్త సమస్య నమోదు', 'లక్ష్య సమయాలు (SLA)', 'మున్సిపల్ విభాగాలు'],
        };
      }
      return {
        intent: 'EMERGENCY_HELPLINE',
        response: `For immediate life-threatening emergencies, contact the appropriate emergency service:\n• 112 — National Emergency Helpline\n• 100 — Police\n• 101 — Fire Services\n• 108 — Medical Ambulance Emergency`,
        quickReplies: ['Report New Issue', 'Check SLA Hours', 'Municipal Department Contacts'],
      };
    }

    // 5. Intent: MUNICIPAL_DEPARTMENT_CONTACTS
    if (
      msg.includes('contact') ||
      msg.includes('department') ||
      msg.includes('directory') ||
      msg.includes('officer') ||
      msg.includes('మున్సిపల్ విభాగాలు') ||
      msg.includes('విభాగ') ||
      msg.includes('అధికారులు') ||
      msg.includes('పరిచయ')
    ) {
      if (isTelugu) {
        return {
          intent: 'DEPARTMENT_CONTACTS',
          response: `మున్సిపల్ విభాగాలు మరియు అవి పరిష్కరించే సమస్యల వివరాలు:\n\n• రోడ్లు & ఇంజనీరింగ్ (Roads & Asphalt) — రోడ్ల గుంతలు, పాడైన ఫుట్‌పాత్‌లు, రోడ్డు మరమ్మతులు\n• తాగునీటి సరఫరా (Water Supply) — పైప్‌లైన్ లీకేజీలు, నీటి కొరత, కలుషిత నీరు\n• పారిశుధ్యం & ఆరోగ్యం (Sanitation & Health) — చెత్త నిల్వలు, నిండిన డస్ట్‌బిన్లు, మురుగు కాలువలు\n• వీధి దీపాలు (Street Lighting) — వెలగని వీధి దీపాలు, విద్యుత్ స్తంభాల మరమ్మతులు`,
          quickReplies: ['కొత్త సమస్య నమోదు', 'లక్ష్య సమయాలు (SLA)', 'అత్యవసర హెల్ప్‌లైన్'],
        };
      }
      return {
        intent: 'DEPARTMENT_CONTACTS',
        response: `I can help you identify the concerned municipal department for your issue:\n\n• Roads & Asphalt — Road damage, potholes, and road-related problems\n• Water Supply — Water supply and leakage issues\n• Sanitation & Health — Garbage, sanitation and drainage-related issues\n• Street Lighting — Streetlight and electrical civic issues`,
        quickReplies: ['Report New Issue', 'Check SLA Hours', 'Emergency Helpline'],
      };
    }

    // 6. Intent: REPORT_NEW_ISSUE / FILE_GRIEVANCE
    if (
      msg.includes('report') ||
      msg.includes('file') ||
      msg.includes('lodge') ||
      msg.includes('new issue') ||
      msg.includes('grievance') ||
      msg.includes('ఫిర్యాదు') ||
      msg.includes('రిపోర్ట్') ||
      msg.includes('నమోదు')
    ) {
      if (isTelugu) {
        return {
          intent: 'REPORT_ISSUE',
          response: 'కొత్త పౌర సమస్యను నమోదు చేయడానికి, ప్రభావిత మున్సిపల్ విభాగాన్ని ఎంచుకుని, సమస్యను వివరించి, ఫోటో అందుబాటులో ఉంటే అప్‌లోడ్ చేసి, ఖచ్చితమైన లొకేషన్‌తో సమర్పించండి.',
          quickReplies: ['ఫిర్యాదు నమోదు ఫారమ్', 'లక్ష్య సమయాలు (SLA)', 'మున్సిపల్ విభాగాలు'],
        };
      }
      return {
        intent: 'REPORT_ISSUE',
        response: 'To report a new civic issue, select the affected department/category, describe the issue, upload a photo if available, and allow location detection so the complaint can be submitted with its location.',
        quickReplies: ['Go to Report Form', 'Check SLA Hours', 'Municipal Department Contacts'],
      };
    }

    // 7. Category specific queries: Potholes / Roads
    if (msg.includes('pothole') || msg.includes('road') || msg.includes('asphalt') || msg.includes('గుంత') || msg.includes('రోడ్డు')) {
      if (isTelugu) {
        return {
          intent: 'ROADS_QUERY',
          response: 'రోడ్ల గుంతలు లేదా పాడైన రోడ్లపై ఫిర్యాదు చేయడానికి "ఫిర్యాదు నమోదు" ద్వారా ఫోటోను అప్‌లోడ్ చేయండి. మా AI రోడ్స్ & ఆస్ఫాల్ట్ విభాగానికి 48 గంటల SLA తో కేటాయిస్తుంది.',
          quickReplies: ['ఫిర్యాదు నమోదు ఫారమ్', 'లక్ష్య సమయాలు (SLA)', 'మున్సిపల్ విభాగాలు'],
        };
      }
      return {
        intent: 'ROADS_QUERY',
        response: 'To report a pothole or road defect, navigate to "Report Grievance", upload a photo of the road, and our AI will route it to Roads & Asphalt with an enforced 48-Hour SLA.',
        quickReplies: ['Go to Report Form', 'Check SLA Hours', 'Municipal Department Contacts'],
      };
    }

    // 8. Category specific queries: Water
    if (msg.includes('water') || msg.includes('leak') || msg.includes('pipeline') || msg.includes('tap') || msg.includes('నీరు') || msg.includes('పైపు') || msg.includes('తాగునీరు')) {
      if (isTelugu) {
        return {
          intent: 'WATER_QUERY',
          response: 'తాగునీటి సరఫరా మరియు పైప్‌లైన్ లీకేజీ సమస్యలను వాటర్ సప్లై విభాగం 24 గంటల ప్రామాణిక SLA తో పరిష్కరిస్తుంది. అత్యవసర లీకేజీల కోసం రిపోర్ట్ ఫారమ్‌ను ఉపయోగించండి.',
          quickReplies: ['ఫిర్యాదు నమోదు ఫారమ్', 'లక్ష్య సమయాలు (SLA)', 'అత్యవసర హెల్ప్‌లైన్'],
        };
      }
      return {
        intent: 'WATER_QUERY',
        response: 'Water Supply issues (leakages, low pressure, dirty water) are handled by the Water Supply Department with a 24-Hour resolution SLA.',
        quickReplies: ['Go to Report Form', 'Check SLA Hours', 'Emergency Helpline'],
      };
    }

    // 9. Category specific queries: Garbage / Sanitation
    if (msg.includes('garbage') || msg.includes('waste') || msg.includes('trash') || msg.includes('drain') || msg.includes('gutter') || msg.includes('dustbin') || msg.includes('చెత్త') || msg.includes('మురుగు')) {
      if (isTelugu) {
        return {
          intent: 'SANITATION_QUERY',
          response: 'చెత్త నిల్వలు, డస్ట్‌బిన్ల ఓవర్‌ఫ్లో లేదా మురుగు కాలువల సమస్యల కోసం "పారిశుధ్యం & ఆరోగ్యం" విభాగం కింద ఫిర్యాదు చేయండి. 24 గంటల SLA తో శానిటేషన్ బృందం చర్యలు తీసుకుంటుంది.',
          quickReplies: ['ఫిర్యాదు నమోదు ఫారమ్', 'లక్ష్య సమయాలు (SLA)', 'అత్యవసర హెల్ప్‌లైన్'],
        };
      }
      return {
        intent: 'SANITATION_QUERY',
        response: 'For garbage accumulation, overflowing bins, or clogged drains, submit a grievance under Sanitation & Health. The field team operates with a 24-Hour SLA target.',
        quickReplies: ['Go to Report Form', 'Check SLA Hours', 'Emergency Helpline'],
      };
    }

    // 10. Category specific queries: Streetlight / Lighting
    if (msg.includes('light') || msg.includes('lamp') || msg.includes('pole') || msg.includes('electric') || msg.includes('దీపం') || msg.includes('కరెంట్') || msg.includes('స్తంభం')) {
      if (isTelugu) {
        return {
          intent: 'LIGHTING_QUERY',
          response: 'వీధి దీపాలు వెలగకపోవడం లేదా విద్యుత్ స్తంభాల మరమ్మతులను స్ట్రీట్ లైటింగ్ విభాగం 12 గంటల త్వరిత SLA తో పరిష్కరిస్తుంది.',
          quickReplies: ['ఫిర్యాదు నమోదు ఫారమ్', 'లక్ష్య సమయాలు (SLA)', 'అత్యవసర హెల్ప్‌లైన్'],
        };
      }
      return {
        intent: 'LIGHTING_QUERY',
        response: 'Street Lighting complaints (broken lamps, dark streets, loose wiring) carry an enforced 12-Hour SLA for rapid resolution.',
        quickReplies: ['Go to Report Form', 'Check SLA Hours', 'Emergency Helpline'],
      };
    }

    // 11. Greetings
    if (msg === 'hi' || msg === 'hello' || msg === 'hey' || msg === 'namaste' || msg === 'నమస్కారం' || msg === 'హలో') {
      if (isTelugu) {
        return {
          intent: 'GREETING',
          response: 'నమస్కారం! నేను ప్రజాసేవక్, మీ మున్సిపల్ పౌర సేవల అసిస్టెంట్‌ని. ఈరోజు నేను మీకు ఎలా సహాయపడగలను?',
          quickReplies: ['కొత్త సమస్య నమోదు', 'లక్ష్య సమయాలు (SLA)', 'ఫిర్యాదు స్థితి', 'మున్సిపల్ విభాగాలు', 'అత్యవసర హెల్ప్‌లైన్'],
        };
      }
      return {
        intent: 'GREETING',
        response: 'Namaste! I am PrajaSevak, your Municipal Civic Assistant. How can I assist you with civic services today?',
        quickReplies: ['Report New Issue', 'Check SLA Hours', 'Track Existing Complaint', 'Municipal Department Contacts', 'Emergency Helpline'],
      };
    }

    // 12. General fallback
    if (isTelugu) {
      return {
        intent: 'GENERAL_CIVIC_HELP',
        response: 'నమస్కారం! నేను ప్రజాసేవక్, మీ మున్సిపల్ పౌర సేవల అసిస్టెంట్‌ని. ఈరోజు నేను మీకు ఎలా సహాయపడగలను?',
        quickReplies: ['కొత్త సమస్య నమోదు', 'లక్ష్య సమయాలు (SLA)', 'ఫిర్యాదు స్థితి', 'మున్సిపల్ విభాగాలు', 'అత్యవసర హెల్ప్‌లైన్'],
      };
    }

    return {
      intent: 'GENERAL_CIVIC_HELP',
      response: 'Namaste! I am PrajaSevak, your Municipal Civic Assistant. How can I assist you with civic services today?',
      quickReplies: ['Report New Issue', 'Check SLA Hours', 'Track Existing Complaint', 'Municipal Department Contacts', 'Emergency Helpline'],
    };
  }
}
