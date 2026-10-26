/**
 * BookLeaf Knowledge Base & Policy Engine
 * Extracted directly from BookLeaf Operations Manual & Guidelines.
 * Cost-conscious token optimization: Only query-relevant sections are loaded into prompts.
 */

export const BOOKLEAF_KNOWLEDGE_BASE = {
  company: {
    title: "Company Overview",
    content: `
- BookLeaf Publishing is a premier self-publishing company operating across India and the US.
- Publishing Packages: 'Standard Free' (no upfront fee) and 'Bestseller Breakthrough' (premium package with advanced marketing, author branding, and expanded global distribution).
- End-to-end Services: Cover design, typesetting, proofreading, ISBN assignment, on-demand printing, multinational distribution, and quarterly royalty management.
- Production & Fulfillment: In-house printing facility and central warehouse located in Delhi. Key certified print partners include Repro India and Epitome Books for high-volume and hardcover editions.
    `.trim()
  },
  royalty: {
    title: "Royalty & Payout Policy",
    content: `
- Royalty Split: 80/20 split—80% of net profit goes to the author, 20% to BookLeaf.
- Net Profit Formula: MRP minus (printing cost + sales platform commission [Amazon/Flipkart] + shipping & fulfillment charges).
- Payout Schedule: Royalties are calculated quarterly and disbursed within 45 days of the quarter ending:
  * Q1 (Jan - Mar): Paid by May 15
  * Q2 (Apr - Jun): Paid by Aug 15
  * Q3 (Jul - Sep): Paid by Nov 15
  * Q4 (Oct - Dec): Paid by Feb 15
- Minimum Payout Threshold: ₹1,000. If accumulated royalties are below ₹1,000, they roll over automatically to the subsequent quarter.
- Payment Method: Direct electronic bank transfer (NEFT/RTGS) to the account verified in author profile.
- Transparency: Authors can access line-by-line sales breakdowns per platform in their portal.
    `.trim()
  },
  isbn: {
    title: "ISBN & Imprint Policy",
    content: `
- Every book published under BookLeaf receives a unique, government-registered ISBN under BookLeaf's publisher imprint.
- Authors desiring an imprint in their personal or proprietary name must procure their ISBN independently.
- ISBN Errors: Any duplicate ISBN, barcode mismatch, or wrong book title association is classified as a HIGH/CRITICAL priority and escalated immediately to the production team with a strict 48-hour resolution timeline.
    `.trim()
  },
  printing: {
    title: "Printing & Physical Quality Policy",
    content: `
- Print Facility: Primary orders fulfilled by Delhi in-house press; overflow or specialized bindings directed to Repro India / Epitome Books.
- Turnaround Time: 5–7 business days from print order confirmation.
- Defect & Quality Guarantee: If an author receives defective author copies (misprints, inverted/blurred pages, binding defects, scuffed covers), BookLeaf issues an unconditional free reprint after photo verification. Defect photo review takes 24 hours.
    `.trim()
  },
  distribution: {
    title: "Distribution & Global Availability",
    content: `
- Sales Channels: Amazon India, Flipkart, Amazon US, Amazon UK, and BookLeaf Official Store.
- Listing Timeline: New book listings typically go live within 7–10 business days after production completion.
- Availability Outages: If a book shows "Currently Unavailable" or "Out of Stock" on Amazon/Flipkart, it is almost always a channel inventory stock sync issue. BookLeaf ops can trigger a catalog inventory re-sync within 24–48 hours.
    `.trim()
  },
  production: {
    title: "Book Production Stages & Timelines",
    content: `
- Production Workflow: Manuscript Received → Editing (if opted) → Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup → Published & Live.
- Email Alerts: Authors receive status updates upon clearing each milestone.
- Common Delay Points: Cover Design (awaiting author feedback/approval) and Proofreading (author revision iterations). Standard turnaround per stage is 3–5 working days unless revisions are pending.
    `.trim()
  },
  tone: {
    title: "Communication Tone & Voice Guidelines",
    content: `
- Always empathetic and professional. Authors are creative partners, not support tickets.
- Acknowledge and validate the author's emotion or frustration before diving into technical details.
- Provide concrete specifics: mention actual book titles, royalty amounts, dates, and stage names rather than generic answers.
- Direct accountability: If an issue stems from BookLeaf (delayed payment, listing delay, defect), own it with zero deflection.
- Clear SLA commitment: Whenever investigation is required, commit to an explicit timeline ("Our team will resolve this and update you within 48 hours").
- Always conclude with an actionable next step for the author or internal team.
    `.trim()
  }
};

/**
 * Smart Knowledge Base Context Selector (Cost & Token Awareness)
 * Rather than injecting all documents, returns only the sections relevant to the ticket's category.
 */
export function getRelevantKnowledgeBase(category = '') {
  const cat = (category || '').toLowerCase();
  const selected = [BOOKLEAF_KNOWLEDGE_BASE.company, BOOKLEAF_KNOWLEDGE_BASE.tone];

  if (cat.includes('royalt') || cat.includes('payment')) {
    selected.push(BOOKLEAF_KNOWLEDGE_BASE.royalty);
  } else if (cat.includes('isbn') || cat.includes('metadata')) {
    selected.push(BOOKLEAF_KNOWLEDGE_BASE.isbn);
  } else if (cat.includes('print') || cat.includes('quality')) {
    selected.push(BOOKLEAF_KNOWLEDGE_BASE.printing);
  } else if (cat.includes('distribut') || cat.includes('availab')) {
    selected.push(BOOKLEAF_KNOWLEDGE_BASE.distribution);
  } else if (cat.includes('status') || cat.includes('product')) {
    selected.push(BOOKLEAF_KNOWLEDGE_BASE.production);
  } else {
    // General inquiry: include overview of royalty and distribution
    selected.push(BOOKLEAF_KNOWLEDGE_BASE.royalty, BOOKLEAF_KNOWLEDGE_BASE.distribution, BOOKLEAF_KNOWLEDGE_BASE.production);
  }

  return selected.map((s) => `### ${s.title}\n${s.content}`).join('\n\n');
}
