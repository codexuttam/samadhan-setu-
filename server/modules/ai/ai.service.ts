import { config } from '../../config';
import { logger } from '../../lib/logger';
import { prisma } from '../../lib/prisma';
import { storage } from '../files/files.service';

const GEMINI_TIMEOUT_MS = 12_000;

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = GEMINI_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export interface TranscribeResult {
  text: string;
  categorySuggestion?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  summary?: string;
  isFallback?: boolean;
}

export interface TriageResult {
  suggestedDepartment?: string;
  suggestedCategory?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  urgencyReason?: string;
}

/**
 * Uses Gemini API to transcribe voice complaints and triage civic issues.
 * Works seamlessly with audio formats (WebM, WAV, MP3, OGG).
 */
export async function transcribeAudio(
  base64Audio: string,
  mimeType: string = 'audio/webm',
  language?: string,
): Promise<TranscribeResult> {
  const apiKey = config.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const systemPrompt = `You are an AI assistant for Samadhan Setu, a civic grievance portal in India.
Your task:
1. Accurately transcribe what the citizen said. They may speak in Hindi, English, Marathi, or mixed Hinglish.
2. Provide a clean summary of the grievance.
3. Suggest the most relevant civic category (e.g. Roads & Potholes, Water Supply, Garbage & Sanitation, Street Lighting, Drainage & Sewage, Public Safety).
4. Estimate priority: 'low', 'medium', 'high', or 'critical' (e.g., open deep manholes, sparking live wires, contaminated drinking water are critical).

Respond strictly with valid JSON with these keys:
{
  "text": "verbatim transcription",
  "summary": "1-2 sentence English summary",
  "categorySuggestion": "Category Name",
  "priority": "low" | "medium" | "high" | "critical"
}`;

      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: systemPrompt },
                {
                  inlineData: {
                    mimeType: mimeType.split(';')[0],
                    data: base64Audio,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const candidate = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          try {
            const parsed = JSON.parse(candidate);
            return {
              text: parsed.text || candidate,
              summary: parsed.summary,
              categorySuggestion: parsed.categorySuggestion,
              priority: (parsed.priority?.toLowerCase() as any) || 'medium',
            };
          } catch {
            return { text: candidate.trim() };
          }
        }
      } else {
        const errBody = await response.text();
        logger.warn('Gemini Audio Transcription returned non-200', { status: response.status, body: errBody });
      }
    } catch (err) {
      logger.error('Error invoking Gemini transcription API', { err: (err as Error).message });
    }
  }

  // Intelligent fallback for demo / test environments
  if (language === 'hi') {
    return {
      text: 'मुख्य बाज़ार चौराहे के पास सड़क पर बड़े गड्ढे हैं, जिससे यातायात का खतरा है।',
      summary: 'बाज़ार चौराहे के पास सड़क पर गड्ढों की शिकायत।',
      categorySuggestion: 'Roads & Footpaths',
      priority: 'high',
      isFallback: true,
    };
  }

  return {
    text: 'Road repair required: severe potholes causing traffic danger near market junction.',
    summary: 'Citizen reported road potholes causing safety risk.',
    categorySuggestion: 'Roads & Footpaths',
    priority: 'high',
    isFallback: true,
  };
}

const VALID_PRIORITIES = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

function ruleBasedTriage(text: string): TriageResult {
  const lower = text.toLowerCase();

  let suggestedCategory: string | undefined;
  let suggestedDepartment: string | undefined;

  if (/(pothole|road|footpath|flyover|गड्ढा|सड़क|फुटपाथ)/.test(lower)) {
    suggestedCategory = 'Roads & Potholes';
    suggestedDepartment = 'Public Works Department (PWD) / MCD';
  } else if (/(spark|wire|electric|shock|light|pole|करंट|तार|बिजली|स्ट्रीट लाइट|खंभा)/.test(lower)) {
    suggestedCategory = 'Street Lighting & Electrical';
    suggestedDepartment = 'BSES / Municipal Power Division';
  } else if (/(water|drain|sewage|sewer|manhole|flood|पानी|गंदा पानी|नाली|सीवर|मेनहोल|जलभराव)/.test(lower)) {
    suggestedCategory = 'Water Supply & Drainage';
    suggestedDepartment = 'Delhi Jal Board (DJB)';
  } else if (/(garbage|waste|trash|cleaning|dump|कूड़ा|कचरा|गंदगी|सफाई)/.test(lower)) {
    suggestedCategory = 'Garbage & Sanitation';
    suggestedDepartment = 'Municipal Corporation Sanitation Division';
  } else if (/(encroach|park|safety|अतिक्रमण|पार्क|सुरक्षा)/.test(lower)) {
    suggestedCategory = 'Public Safety & Parks';
    suggestedDepartment = 'Local Council / Enforcement';
  }

  // Fast-path rule-based checks for urgent hazards (English + Hindi/Hinglish)
  if (
    /(sparking|live wire|electric shock|manhole open|open manhole|gas leak|structural collapse|करंट|बिजली का तार|खुला मेनहोल|गैस लीक)/.test(
      lower,
    )
  ) {
    return {
      suggestedCategory: suggestedCategory ?? 'Public Safety & Hazards',
      suggestedDepartment,
      priority: 'CRITICAL',
      urgencyReason: 'Immediate public safety hazard detected.',
    };
  }

  if (/(dirty water|overflowing sewage|flood|गंदा पानी|सीवर|नाली|जलभराव)/.test(lower)) {
    return {
      suggestedCategory: suggestedCategory ?? 'Water Supply & Drainage',
      suggestedDepartment,
      priority: 'HIGH',
      urgencyReason: 'Health and sanitation contamination risk.',
    };
  }

  return {
    suggestedCategory,
    suggestedDepartment,
    priority: 'MEDIUM',
    urgencyReason: 'Standard civic resolution queue.',
  };
}

/**
 * Triage civic complaint text for emergency hazards and smart classification
 * across English, Hindi, and Hinglish.
 */
export async function triageComplaint(text: string): Promise<TriageResult> {
  const apiKey = config.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (apiKey && text.trim()) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const prompt = `You are a civic grievance triage classifier for Samadhan Setu (India).
Analyze the complaint (which may be in English, Hindi, or Hinglish) and respond strictly with JSON:
{
  "suggestedCategory": "Roads & Potholes" | "Water Supply & Drainage" | "Garbage & Sanitation" | "Street Lighting & Electrical" | "Public Safety & Parks" | "Other Civic Issue",
  "suggestedDepartment": "responsible department name",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "urgencyReason": "brief 1-sentence reason"
}
Open manholes, sparking live wires, gas leaks, and structural collapses MUST be CRITICAL.
Complaint: "${text.slice(0, 1500)}"`;

      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const candidate = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          const parsed = JSON.parse(candidate);
          const rawPriority = typeof parsed.priority === 'string' ? parsed.priority.toUpperCase() : '';
          return {
            suggestedCategory: typeof parsed.suggestedCategory === 'string' ? parsed.suggestedCategory : undefined,
            suggestedDepartment: typeof parsed.suggestedDepartment === 'string' ? parsed.suggestedDepartment : undefined,
            priority: (VALID_PRIORITIES.has(rawPriority) ? rawPriority : 'MEDIUM') as TriageResult['priority'],
            urgencyReason: typeof parsed.urgencyReason === 'string' ? parsed.urgencyReason : 'AI-classified civic grievance.',
          };
        }
      }
    } catch (err) {
      logger.warn('Gemini triage failed, falling back to multilingual rules', { err: (err as Error).message });
    }
  }

  return ruleBasedTriage(text);
}

export interface ResolutionVerificationResult {
  verifiedByAi: boolean;
  confidenceScore: number;
  isAuthentic: boolean;
  analysis: string;
  flags: string[];
}

export interface ImageInlineInput {
  data: string;
  mimeType: string;
}

async function loadTicketImagePart(ticketId: string, kind: 'CITIZEN_EVIDENCE' | 'COMPLETION_PROOF'): Promise<ImageInlineInput | null> {
  try {
    const att = await prisma.ticketAttachment.findFirst({
      where: { ticketId, kind, mimeType: { startsWith: 'image/' } },
      orderBy: { createdAt: 'desc' },
    });
    if (!att) return null;
    const buf = await storage.get(att.storageKey);
    return { data: buf.toString('base64'), mimeType: att.mimeType };
  } catch (err) {
    logger.warn('Could not load ticket attachment bytes for AI vision check', { ticketId, kind, err: (err as Error).message });
    return null;
  }
}

/**
 * AI-powered visual evidence inspector.
 * Passes real image bytes to Gemini Vision to verify that post-repair proof resolves the reported issue.
 */
export async function verifyResolutionEvidence(params: {
  ticketId?: string;
  issueDescription: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  beforeImageBase64?: ImageInlineInput;
  afterImageBase64?: ImageInlineInput;
}): Promise<ResolutionVerificationResult> {
  const apiKey = config.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  const beforeImg =
    params.beforeImageBase64 ?? (params.ticketId ? await loadTicketImagePart(params.ticketId, 'CITIZEN_EVIDENCE') : null);
  const afterImg =
    params.afterImageBase64 ?? (params.ticketId ? await loadTicketImagePart(params.ticketId, 'COMPLETION_PROOF') : null);

  if (apiKey && (beforeImg || afterImg)) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const prompt = `You are a municipal civil engineering auditor for Samadhan Setu.
A field officer has marked the following civic complaint as resolved:
Issue: "${params.issueDescription}".

Inspect the attached before/after photo evidence carefully:
1. Does the repair genuinely address the cited problem?
2. Estimate a confidence score from 0 to 100.
3. Provide a brief 1-2 sentence engineering assessment.
4. List key visual verification indicators or anomalies.

Respond strictly as JSON:
{
  "confidenceScore": 92,
  "isAuthentic": true,
  "analysis": "...",
  "flags": ["Surface bitumen compacted", "No standing water visible"]
}`;

      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [{ text: prompt }];
      if (beforeImg) {
        parts.push({ text: 'Before (citizen evidence):' });
        parts.push({ inlineData: { mimeType: beforeImg.mimeType.split(';')[0], data: beforeImg.data } });
      }
      if (afterImg) {
        parts.push({ text: 'After (officer completion proof):' });
        parts.push({ inlineData: { mimeType: afterImg.mimeType.split(';')[0], data: afterImg.data } });
      }

      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const candidate = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          const parsed = JSON.parse(candidate);
          return {
            verifiedByAi: true,
            confidenceScore: Math.min(100, Math.max(0, Number(parsed.confidenceScore) || 0)),
            isAuthentic: Boolean(parsed.isAuthentic),
            analysis: typeof parsed.analysis === 'string' ? parsed.analysis : 'Visual inspection completed.',
            flags: Array.isArray(parsed.flags) ? parsed.flags : ['VISUAL_INSPECTION_COMPLETE'],
          };
        }
      } else {
        const errBody = await response.text();
        logger.warn('Gemini verification returned non-200', { status: response.status, body: errBody });
      }
    } catch (err) {
      logger.error('Gemini verification analysis failed', { err: (err as Error).message });
    }
  }

  // Honest fallback when Gemini key or real image bytes are unavailable
  return {
    verifiedByAi: false,
    confidenceScore: 0,
    isAuthentic: false,
    analysis: 'Automated AI visual verification is unavailable (missing Gemini key or image bytes). Manual supervisor review is required.',
    flags: ['MANUAL_REVIEW_REQUIRED'],
  };
}

export interface ConciergeChatResult {
  reply: string;
  prefill?: {
    title?: string;
    description?: string;
    categoryId?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    department?: string;
  };
  suggestions: string[];
}

/**
 * AI Civic Concierge ("Samadhan Sahayak")
 * Answers civic inquiries, explains department routing (MCD, DJB, PWD, BSES),
 * and prepares structured prefill payloads for instant grievance filing.
 */
export async function chatCivicConcierge(params: {
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  message: string;
  language?: string;
}): Promise<ConciergeChatResult> {
  const apiKey = config.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const { message, messages = [] } = params;

  if (apiKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const systemPrompt = `You are "Samadhan Sahayak (समाधान सहायक)", the official AI Civic Concierge for Samadhan Setu, a municipal grievance platform in India (Delhi/NCR and pan-India municipalities).
Your duties:
1. Assist citizens in English, Hindi, or Hinglish with warmth, professionalism, and civic precision.
2. Direct civic grievances to the correct authority:
   - Roads, potholes, footpaths, flyovers -> PWD (arterial) or MCD (colony roads) -> categoryId: "roads_potholes"
   - Water supply, drinking water contamination, sewer leaks, open manholes -> Delhi Jal Board (DJB) -> categoryId: "water_drainage"
   - Garbage piles, waste dumping, public sanitation, street cleaning -> MCD -> categoryId: "garbage_sanitation"
   - Broken streetlights, hanging power cables, transformer sparks -> BSES / Tata Power / Discoms -> categoryId: "street_lights"
   - Encroachments, parks, open hazards -> DDA / Delhi Police / Local Council -> categoryId: "public_safety"
3. If the citizen's prompt describes a civic issue, extract a prefill object with:
   - title: concise title (e.g. "Deep Pothole at Sector 14 Crossing")
   - description: clean descriptive summary
   - categoryId: exactly one of ["roads_potholes", "street_lights", "water_drainage", "garbage_sanitation", "public_safety", "other_issue"]
   - priority: "low" | "medium" | "high" | "critical" (dangerous hazards like open manholes or live sparking wires MUST be "critical")
   - department: Name of responsible authority (e.g. "Municipal Corporation of Delhi (MCD)")
4. Always suggest 2 to 3 relevant quick follow-up questions or actions in the "suggestions" array.

Respond strictly as JSON:
{
  "reply": "Your bilingual or English response explaining how to resolve this and what department takes action.",
  "prefill": {
    "title": "...",
    "description": "...",
    "categoryId": "roads_potholes",
    "priority": "high",
    "department": "MCD"
  },
  "suggestions": ["File this complaint now", "Check average SLA resolution time", "Is this an emergency hazard?"]
}`;

      // Build conversation history contents
      const conversationContents = [
        ...messages.slice(-6).map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        {
          role: 'user',
          parts: [{ text: `System instruction: ${systemPrompt}\n\nCitizen Query: "${message}"` }],
        },
      ];

      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: conversationContents,
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const candidate = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          const parsed = JSON.parse(candidate);
          return {
            reply: parsed.reply || 'Namaste! I am here to guide your civic grievance to the right department.',
            prefill: parsed.prefill,
            suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : ['File this complaint now', 'Check SLA rules'],
          };
        }
      }
    } catch (err) {
      logger.error('Gemini Civic Concierge API error', { err: (err as Error).message });
    }
  }

  // High-fidelity bilingual rule-based fallback
  const lower = message.toLowerCase();
  const isHi = params.language === 'hi' || /[\u0900-\u097F]/.test(message);

  if (/(pothole|road|footpath|flyover|गड्ढ|सड़क|फुटपाथ)/.test(lower)) {
    const isSevere = /(accident|deep|huge|बड़ा|गहरा|दुर्घटना)/.test(lower);
    return {
      reply: isHi
        ? 'नमस्ते! मुख्य सड़कों के गड्ढों की मरम्मत लोक निर्माण विभाग (PWD) और कॉलोनी सड़कों की जिम्मेदारी नगर निगम (MCD) की होती है। नागरिक चार्टर के अनुसार गड्ढों की मरम्मत 48 घंटे के SLA में अनिवार्य है। क्या मैं आपका शिकायत फ़ॉर्म पहले से भर दूँ?'
        : 'Namaste! Road damage and potholes fall under the Public Works Department (PWD) for main arterial roads or MCD for residential colonies. Under the Citizen Charter, pothole repairs have a mandatory 48-hour SLA deadline. Would you like me to pre-fill your complaint ticket?',
      prefill: {
        title: isHi ? 'सड़क क्षति एवं गड्ढा मरम्मत आवश्यक' : 'Road Damage & Pothole Repair Required',
        description: message,
        categoryId: 'roads_potholes',
        priority: isSevere ? 'high' : 'medium',
        department: 'Public Works Department (PWD) / MCD',
      },
      suggestions: isHi
        ? ['शिकायत फ़ॉर्म भरें', 'सड़कों के लिए SLA नियम क्या हैं?', 'दूसरी समस्या दर्ज करें']
        : ['Pre-fill Grievance Form', 'What is the SLA for roads?', 'Report another issue'],
    };
  }

  if (/(water|drain|sewage|sewer|manhole|पानी|जल|नाली|सीवर|मेनहोल|जलभराव)/.test(lower)) {
    const isCritical = /(manhole|contamination|dirty|खुला मेनहोल|मेनहोल|गंदा पानी|दूषित)/.test(lower);
    return {
      reply: isHi
        ? 'नमस्ते! पानी की पाइपलाइन लीकेज, सीवर ओवरफ्लो और दूषित पेयजल की समस्याएं दिल्ली जल बोर्ड (DJB) देखता है। खुले मेनहोल को 24 घंटे की आपात SLA प्राथमिकता दी जाती है। मैं अभी आपका शिकायत फ़ॉर्म तैयार कर सकता हूँ।'
        : 'Namaste! Water pipeline leaks, sewer overflows, and contaminated tap water are managed by the Delhi Jal Board (DJB). Open manholes are treated as critical public safety hazards with emergency 24h SLA. I can pre-fill your complaint right away.',
      prefill: {
        title: isCritical
          ? isHi
            ? 'अति आवश्यक: जल एवं सीवर सुरक्षा खतरा'
            : 'Critical Water & Sewage Hazard'
          : isHi
          ? 'पेयजल आपूर्ति एवं जल निकासी समस्या'
          : 'Water Supply & Drainage Issue',
        description: message,
        categoryId: 'water_drainage',
        priority: isCritical ? 'critical' : 'high',
        department: 'Delhi Jal Board (DJB)',
      },
      suggestions: isHi
        ? ['शिकायत फ़ॉर्म भरें', 'आपात एस्केलेशन कैसे काम करता है?', 'मेरा वार्ड जांचें']
        : ['Pre-fill Grievance Form', 'How does emergency escalation work?', 'Check my ward jurisdiction'],
    };
  }

  if (/(light|wire|electric|pole|lamp|स्ट्रीट लाइट|लाइट|बिजली|तार|खंभा|करंट)/.test(lower)) {
    const isHazard = /(spark|wire|shock|करंट|तार|चिंगारी)/.test(lower);
    return {
      reply: isHi
        ? 'नमस्ते! स्ट्रीट लाइट की देखभाल MCD और बिजली वितरण कंपनियाँ (BSES / Tata Power) करती हैं। ' +
          (isHazard
            ? '⚠️ बिजली के तार या चिंगारी को आपात सुरक्षा संकट मानकर तुरंत भेजा जाता है।'
            : 'सामान्य स्ट्रीट लाइट खराबी 48 से 72 घंटे में ठीक की जाती है।')
        : 'Namaste! Street lighting infrastructure is maintained jointly by MCD and power distribution utilities (BSES / Tata Power). ' +
          (isHazard
            ? '⚠️ Sparking wires are classified as an emergency safety issue dispatched immediately.'
            : 'Standard streetlight outages are resolved within 48 to 72 hours.'),
      prefill: {
        title: isHazard
          ? isHi
            ? 'आपातकालीन: बिजली तार / करंट का खतरा'
            : 'Emergency: Sparking Electrical Hazard'
          : isHi
          ? 'खराब स्ट्रीट लाइट की रिपोर्ट'
          : 'Non-functional Street Light Report',
        description: message,
        categoryId: 'street_lights',
        priority: isHazard ? 'critical' : 'medium',
        department: 'BSES / Municipal Power Division',
      },
      suggestions: isHi
        ? ['शिकायत फ़ॉर्म भरें', 'आपातकालीन बिजली हेल्पलाइन', 'वार्ड स्थिति देखें']
        : ['Pre-fill Grievance Form', 'Emergency Discom Helpline', 'Check Ward Status'],
    };
  }

  if (/(garbage|waste|trash|cleaning|sanitation|कूड़ा|कचरा|गंदगी|सफाई)/.test(lower)) {
    return {
      reply: isHi
        ? 'नमस्ते! कचरा संग्रहण और सार्वजनिक स्वच्छता नगर निगम (MCD) के अधीन आती है। स्वच्छता दिशानिर्देशों के तहत कचरा ढेर हटाने का लक्ष्य 24 घंटे है। नीचे टैप करके अपने वार्ड स्वच्छता निरीक्षक को सीधे रिपोर्ट करें।'
        : 'Namaste! Municipal sanitation and daily solid waste collection are handled by your Municipal Corporation (MCD). Under the Swachhata guidelines, unattended garbage dumps have a 24-hour clearance target. Click below to file this directly with your ward sanitary inspector.',
      prefill: {
        title: isHi ? 'कचरा जमाव एवं सफाई अनुरोध' : 'Garbage Pileup & Sanitation Clearance Request',
        description: message,
        categoryId: 'garbage_sanitation',
        priority: 'medium',
        department: 'Municipal Corporation Sanitation Division',
      },
      suggestions: isHi
        ? ['शिकायत फ़ॉर्म भरें', 'वार्ड सफाई समय देखें', 'अवैध कचरा ढेर की रिपोर्ट करें']
        : ['Pre-fill Grievance Form', 'View Ward Sanitation Schedule', 'Report nearby illegal dump'],
    };
  }

  return {
    reply: isHi
      ? 'नमस्ते! मैं समाधान सहायक हूँ, आपका AI नागरिक मार्गदर्शक। आप टूटी सड़क, खराब स्ट्रीट लाइट, गंदा पानी या कचरे जैसी कोई भी समस्या हिंदी या अंग्रेज़ी में बता सकते हैं—मैं सही विभाग, SLA समय और शिकायत फ़ॉर्म तुरंत तैयार कर दूँगा।'
      : 'Namaste! I am Samadhan Sahayak (समाधान सहायक), your AI civic concierge. You can describe any civic problem (e.g. broken roads, dark streets, leaking pipes, garbage heaps) in Hindi, English, or Hinglish, and I will identify the responsible authority, check the SLA, and pre-fill your grievance form for you.',
    suggestions: isHi
      ? [
          'मेट्रो स्टेशन के पास बड़ा गड्ढा है',
          'नल में गंदा पानी आ रहा है',
          'गली की स्ट्रीट लाइट बंद है',
          'सोसायटी के बाहर कचरा जमा है',
        ]
      : [
          'Report large pothole near metro station',
          'Water supply is dirty / contaminated',
          'Streetlights not working on 5th cross',
          'Uncollected garbage dump outside society',
        ],
  };
}


