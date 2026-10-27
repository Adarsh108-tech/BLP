import { getRelevantKnowledgeBase } from './knowledgeBase.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PRIMARY_MODEL = 'gemini-3.5-flash';
const FALLBACK_MODEL = 'gemini-3.8-flash';

const CATEGORIES = [
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry',
];

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

/**
 * Execute Gemini REST API Call with timeout and fallback models
 */
async function callGemini(prompt, systemInstruction = '', maxTokens = 1000, isJson = false) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
  }

  const modelsToTry = [PRIMARY_MODEL, FALLBACK_MODEL];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const requestBody = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: maxTokens,
          ...(isJson ? { responseMimeType: 'application/json' } : {}),
        },
      };

      if (systemInstruction) {
        requestBody.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text.trim();
      }
      throw new Error('Empty response from model');
    } catch (err) {
      lastError = err;
      // Continue to next model if available
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

/**
 * Heuristic fallback classifier when AI API is unavailable/rate-limited
 */
function heuristicClassifyAndScore({ subject = '', description = '' }) {
  const combined = `${subject} ${description}`.toLowerCase();

  let category = 'General Inquiry';
  let priority = 'Medium';
  let reasoning = 'Classified via rule engine (AI fallback active)';

  if (
    combined.includes('royalt') ||
    combined.includes('payment') ||
    combined.includes('payout') ||
    combined.includes('earning') ||
    combined.includes('bank') ||
    combined.includes('money') ||
    combined.includes('rupees') ||
    combined.includes('₹')
  ) {
    category = 'Royalty & Payments';
    if (combined.includes('haven') || combined.includes('not received') || combined.includes('delayed') || combined.includes('6 months') || combined.includes('missing')) {
      priority = 'High';
      reasoning = 'Author reports delayed or unpaid royalties; financial escalation.';
    } else if (combined.includes('too low') || combined.includes('calculation')) {
      priority = 'Medium';
      reasoning = 'Author inquires about royalty calculation and sales breakdown.';
    }
  } else if (
    combined.includes('isbn') ||
    combined.includes('barcode') ||
    combined.includes('metadata') ||
    combined.includes('wrong book') ||
    combined.includes('imprint')
  ) {
    category = 'ISBN & Metadata Issues';
    priority = 'High';
    reasoning = 'ISBN or metadata mismatch detected; critical catalog data integrity.';
  } else if (
    combined.includes('print') ||
    combined.includes('quality') ||
    combined.includes('paper') ||
    combined.includes('blurry') ||
    combined.includes('binding') ||
    combined.includes('defect') ||
    combined.includes('damaged') ||
    combined.includes('copies')
  ) {
    category = 'Printing & Quality';
    priority = 'High';
    reasoning = 'Physical copy defect reported; requires print verification and possible reprint.';
  } else if (
    combined.includes('unavailable') ||
    combined.includes('out of stock') ||
    combined.includes('amazon') ||
    combined.includes('flipkart') ||
    combined.includes('distribution') ||
    combined.includes('listing')
  ) {
    category = 'Distribution & Availability';
    priority = 'Medium';
    reasoning = 'Retail channel availability or inventory sync inquiry.';
  } else if (
    combined.includes('typesetting') ||
    combined.includes('proofreading') ||
    combined.includes('cover') ||
    combined.includes('production') ||
    combined.includes('stage') ||
    combined.includes('status') ||
    combined.includes('when will')
  ) {
    category = 'Book Status & Production Updates';
    priority = 'Medium';
    reasoning = 'Inquiry about ongoing book production progress and stage timelines.';
  }

  // Critical checks
  if (combined.includes('legal') || combined.includes('sue') || combined.includes('fraud') || combined.includes('police') || combined.includes('urgent')) {
    priority = 'Critical';
  }

  return { category, priority, reasoning };
}

/**
 * 1. AI-Powered Auto-Classification & Priority Scoring
 */
export async function classifyAndScoreTicket({ subject, description, bookTitle = 'General', authorName = 'Author' }) {
  const systemInstruction = `You are the lead AI support triage system for BookLeaf Publishing.
Your task is to classify incoming author queries and assign an accurate priority score.

Allowed Categories (choose EXACTLY one):
1. Royalty & Payments
2. ISBN & Metadata Issues
3. Printing & Quality
4. Distribution & Availability
5. Book Status & Production Updates
6. General Inquiry

Allowed Priorities:
- Critical: Immediate risk, severe ISBN mismatch affecting sales, legal/urgent escalations.
- High: Financial discrepancies, unpaid royalties > 3 months, damaged/defective author copies.
- Medium: Standard production queries, distribution stock sync requests, general royalty questions.
- Low: Cosmetic requests (e.g. bio update, general info, future book queries).

Output format: You MUST return ONLY valid JSON matching this schema:
{
  "category": "string (one of the 6 allowed)",
  "priority": "string (Critical | High | Medium | Low)",
  "reasoning": "brief 1-sentence justification"
}`;

  const prompt = `Classify this author support query:
Author: ${authorName}
Book: ${bookTitle}
Subject: ${subject}
Description: ${description}`;

  try {
    const rawResponse = await callGemini(prompt, systemInstruction, 1000, true);
    // Parse JSON safely
    const cleanJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    const category = CATEGORIES.includes(parsed.category) ? parsed.category : 'General Inquiry';
    const priority = PRIORITIES.includes(parsed.priority) ? parsed.priority : 'Medium';
    const reasoning = parsed.reasoning || 'Classified by Gemini AI model';

    return { category, priority, reasoning };
  } catch (err) {
    console.warn('[AI Triage Fallback] Gemini API unavailable or parse failed:', err.message);
    return heuristicClassifyAndScore({ subject, description });
  }
}

/**
 * 2. AI-Drafted Response Generation (Knowledge Base & Book Context Aware)
 */
export async function generateDraftResponse({
  subject,
  description,
  category,
  authorName = 'Author',
  bookData = null,
  previousMessages = [],
}) {
  const relevantKB = getRelevantKnowledgeBase(category);

  let bookContextText = 'No specific book selected (General account query).';
  if (bookData) {
    bookContextText = `
Book Title: "${bookData.title}"
ISBN: ${bookData.isbn || 'Pending'}
Status: ${bookData.status}
Publication Date: ${bookData.publication_date || 'In Production'}
MRP: ₹${bookData.mrp || 'N/A'}
Total Copies Sold: ${bookData.total_copies_sold || 0}
Total Royalty Earned: ₹${bookData.total_royalty_earned || 0}
Royalty Paid: ₹${bookData.royalty_paid || 0}
Royalty Pending: ₹${bookData.royalty_pending || 0}
Last Payout Date: ${bookData.last_royalty_payout_date || 'None'}
Available Channels: ${(bookData.available_on || []).join(', ') || 'None'}
Print Partner: ${bookData.print_partner || 'In-House'}
`.trim();
  }

  const systemInstruction = `You are an expert, empathetic Senior Author Support Representative at BookLeaf Publishing.
Draft an official support reply to the author.

CRITICAL GUIDELINES:
1. Output ONLY the ready-to-send customer-facing message. Do NOT include planning notes, reasoning outlines, or section headers (such as "**Direct Acknowledgement**").
2. Tone: Warm, highly professional, collaborative, empathetic. Authors are creative partners.
3. Acknowledge the author's concern directly before presenting solutions.
4. Use ACTUAL specifics from their book data (royalty amounts, dates, ISBN, sales) where relevant.
5. If an issue is BookLeaf's responsibility (payout delays, printing defects, ISBN errors), own it sincerely—never deflect.
6. Provide concrete timelines (e.g. "within 24–48 business hours" or "5–7 business days for reprints").
7. Always end with a clear next step for both BookLeaf and the author.
8. Sign off as:
Warm regards,
BookLeaf Author Support Team

KNOWLEDGE BASE POLICIES:
${relevantKB}`;

  const prompt = `Author Details:
Name: ${authorName}

Current Book Context:
${bookContextText}

Author's Query:
Subject: ${subject}
Description: ${description}

Generate the final ready-to-send reply:`;

  try {
    const draft = await callGemini(prompt, systemInstruction, 800);
    return draft;
  } catch (err) {
    console.warn('[AI Draft Fallback] Gemini API unavailable:', err.message);
    // Intelligent fallback template based on category
    return generateFallbackDraft(authorName, category, bookData, subject);
  }
}

/**
 * Intelligent Fallback Response Template when AI API is offline
 */
function generateFallbackDraft(authorName, category, bookData, subject) {
  const bookName = bookData?.title ? `"${bookData.title}"` : 'your account';

  if (category === 'Royalty & Payments') {
    const pending = bookData?.royalty_pending ?? 0;
    const paid = bookData?.royalty_paid ?? 0;
    return `Dear ${authorName},

Thank you for reaching out to us regarding your royalties for ${bookName}. I understand that clarity on your earnings is essential, and I apologize for any concern this delay has caused.

According to our records:
- Total Royalty Earned to date: ₹${bookData?.total_royalty_earned ?? 0}
- Royalty Disbursed: ₹${paid}
- Royalty Pending: ₹${pending}

BookLeaf operates on an 80/20 royalty split, calculated on net profit (MRP minus printing, shipping, and sales channel commissions). Royalties are disbursed quarterly within 45 days of the quarter ending, subject to our ₹1,000 minimum threshold.

I have escalated your query to our finance department for a full line-by-line payout reconciliation. We will verify your linked bank account and provide you with an exact update within 48 hours.

Warm regards,
BookLeaf Author Support Team`;
  }

  if (category === 'ISBN & Metadata Issues') {
    return `Dear ${authorName},

Thank you for bringing this ISBN discrepancy to our attention regarding ${bookName}. We treat catalog and barcode accuracy with utmost priority.

I have immediately escalated this to our senior production and catalog team. We are cross-referencing your official ISBN registration records against the retail platform feeds.

We are actively investigating this and will have the catalog corrected or provide a confirmed resolution status within 48 hours.

Warm regards,
BookLeaf Author Support Team`;
  }

  if (category === 'Printing & Quality') {
    return `Dear ${authorName},

We are very sorry to hear that your author copies for ${bookName} did not meet our high print quality standards. As an author, holding your book should be a moment of pure pride, and we take print defects very seriously.

BookLeaf guarantees a free replacement reprint for any defective or damaged copies. Could you kindly reply with 2–3 clear photographs highlighting the print or binding issues? Once verified by our quality assurance team (within 24 hours), we will initiate a priority reprint with a turnaround of 5–7 business days.

Warm regards,
BookLeaf Author Support Team`;
  }

  if (category === 'Distribution & Availability') {
    return `Dear ${authorName},

Thank you for notifying us about the availability status of ${bookName}. 

When a title temporarily shows as unavailable on Amazon or Flipkart, it is typically caused by a retail inventory sync delay. Our distribution operations team is already triggering a catalog re-sync for your title across all designated channels.

Listings usually reflect live status within 24 to 48 hours. We will monitor the retail page and confirm once the buy box is restored.

Warm regards,
BookLeaf Author Support Team`;
  }

  return `Dear ${authorName},

Thank you for contacting BookLeaf Author Support regarding ${bookName}. We have received your query regarding "${subject}".

Our operations team is currently reviewing your request in accordance with our publishing guidelines. We will review all pertinent account details and get back to you with a comprehensive resolution within 48 hours.

If you have any supplementary details to share, please reply directly to this thread.

Warm regards,
BookLeaf Author Support Team`;
}
