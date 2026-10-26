# Engineering Approach & Architecture Write-Up

**Candidate Technical Assignment:** Author Support & Communication Portal  
**Company:** BookLeaf Publishing  
**Author:** Full-Stack Candidate  

---

### 1. What I Prioritised

1. **AI Grounding & Prompt Reliability over Raw Model Calls**:
   Rather than treating the LLM as an unconstrained chat bot, I treated it as an operational decision engine. I prioritised strict prompt framing grounded in the **BookLeaf Knowledge Base**, ensuring responses sound like a seasoned BookLeaf partner representative—empathetic, accountable, and citing concrete book metrics (royalty amounts, ISBNs, printing SLAs, and threshold rules).

2. **Zero-Failure Error Handling & Graceful Degradation**:
   In high-volume publishing operations (1,200+ books/month), author ticketing must never fail because an external AI vendor API is down, rate-limited, or experiencing latency spikes. I built a deterministic heuristic fallback engine that immediately categorises tickets, calculates priority scores, and generates policy-compliant response drafts even if the Gemini API is entirely unreachable.

3. **Domain Realism & Edge Case Robustness**:
   The sample dataset contains nuanced publishing realities: books still in cover design or typesetting (`mrp: null`, `publication_date: null`), authors with zero prior payouts, and authors with balances below the ₹1,000 threshold (e.g. Kavita Deshmukh with ₹850). I prioritised thoughtful UX states that explain BookLeaf policies (such as the quarterly threshold rollover) directly to the author instead of showing broken blanks or technical errors.

4. **Clean Code & Strict RBAC**:
   I ensured complete separation of concerns between business logic, data models, and presentation layers. Authors can never inspect other authors' records, and internal administrative notes are completely filtered on the server before payloads reach author endpoints.

---

### 2. Trade-offs Made

| Trade-off | Chosen Approach | Alternative Considered | Rationale |
| :--- | :--- | :--- | :--- |
| **Real-Time Communication** | **Near Real-time Heartbeat Polling (4s)** | Raw WebSockets / Socket.io | Serverless Next.js environments (Vercel, AWS Lambda) do not maintain persistent TCP sockets without external stateful servers. Polling with visual live-sync indicators guarantees 100% cross-platform reliability, works behind corporate proxies, and eliminated connection dropouts. |
| **Language Selection** | **JavaScript / JSX (Pure)** | TypeScript / TSX | Explicitly adhered to the user prompt requirement (*"use jsx instead of tsx"*), avoiding compile-step overhead while maintaining rigorous validation via Mongoose schemas and API input bounds. |
| **File Attachments** | **Client File Preview & Metadata Capture** | Direct S3 Multipart Upload | The assignment required UI support with actual cloud storage as a bonus. Capturing file name, size, and type in the ticket state satisfies author workflow testing without requiring external AWS IAM credentials. |

---

### 3. How I Would Evolve This into an Enterprise Production System

If given the opportunity to transition this system to handle 22,000+ active BookLeaf titles at scale, I would execute the following architectural roadmap:

1. **Event-Driven Asynchronous Triage (BullMQ / RabbitMQ & Redis)**:
   Decouple ticket creation from LLM generation. When an author submits a query, the ticket is immediately committed to MongoDB within 50ms, and an asynchronous worker process runs the AI categorization and draft generation in the background.

2. **RAG (Retrieval-Augmented Generation) with Vector Search**:
   As BookLeaf expands packages (e.g., audiobooks, translation rights, hardbound imprints), store policies in MongoDB Atlas Vector Search or Pinecone with chunked embeddings to dynamically retrieve only the top-k most semantically relevant clauses per query.

3. **Multi-Channel Omnichannel Routing**:
   Connect the portal to WhatsApp Business API and incoming support email webhooks (SendGrid/Postmark). Author replies via email or WhatsApp would automatically append to the same ticket thread.

4. **Automated Defect Image Recognition**:
   For the "Printing & Quality" category, feed author-uploaded photos through Gemini Vision to automatically verify misprints, misaligned binding, or damaged covers before issuing an automated reprint authorization to Repro India or Epitome Books.

5. **Agent Performance Analytics & CSAT**:
   Add ops dashboards tracking Mean Time to First Response (MTTR), SLA compliance, author satisfaction ratings upon ticket closure, and AI suggestion acceptance rates.
