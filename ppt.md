---
description: Pitch Deck Content for AI for Bharat Hackathon
---

# SLIDE 1: Title Slide
**Project Title**: AgentFlow: AI Startup Research Command Center
**Team Name**: [Your Team Name]
**Institution**: [Your College/Institution]
**Team Leader**: Deepak (or your name)

# SLIDE 2: Track & Solution Summary
**Problem Statement**: 
Entrepreneurs and early-stage founders spend weeks manually researching markets, scraping competitor data, and structuring business plans—leading to delayed launches, biased research, and missed opportunities.

**Proposed Solution**: 
AgentFlow is an automated, multi-agent AI dashboard. It orchestrates a team of specialized AI agents (Research, Market, Competitor, Strategy) that autonomously crawl the web, synthesize insights, and generate a production-ready, downloadable business plan in under 90 seconds.

# SLIDE 3: Product Idea and Key Features
**Core Product Idea**: A "CEO in a Box" that instantly researches and validates startup ideas.

**Key Features**:
*   **Multi-Agent Orchestration**: Specialized agents collaborating iteratively.
*   **Real-time Streaming (SSE)**: Live terminal-style thought processes keeping users in the loop.
*   **Vector Memory System**: Agents share persistent context using Supabase pgvector and OpenAI embeddings.
*   **Automated Reporting**: Instant PDF generation and email delivery.
*   **Cloud History**: Users can log in (Magic Link) to access, edit, and paginate their past research reports.

# SLIDE 4: Architecture Diagram 
*(Note: Use React Flow or a drawing tool to visualize this flow)*

**High-Level Flow**:
1. User inputs Startup Idea → **FastAPI Backend**
2. **Manager Agent** decomposes the idea.
3. **Research Agent** uses **Tavily AI** to crawl the live web.
4. Data is embedded via **OpenAI** and stored in **Supabase pgvector**.
5. **Market, Competitor, and Strategy Agents** perform "Self-RAG" against the memory.
6. **Report Agent** (powered by **Groq Llama 3**) synthesizes the final JSON.
7. Backend pushes events via **SSE** to **Next.js** frontend and saves PDF to **Supabase Storage**.

# SLIDE 5: Technology Stack and Services used
*   **Frontend**: Next.js 14, Tailwind CSS, Chart.js, React Flow
*   **Backend**: FastAPI, Python, Server-Sent Events (SSE)
*   **AI Orchestration**: LangChain
*   **LLMs**: Groq (Llama 3 70B for blazing-fast generation) & OpenAI (for precise embeddings)
*   **Database & Memory**: Supabase (PostgreSQL, pgvector, Edge Storage, Row Level Security)
*   **Web Toolkit**: Tavily AI Search API

# SLIDE 6: Use Cases
**Practical Usability & Impact in North East India**:
*   **Empowering Local Artisans & Farmers**: Helping rural entrepreneurs generate complete GTM (Go-To-Market) strategies for indigenous products (e.g., Bamboo crafts, Organic Tea) without needing expensive consultants.
*   **Student Innovators**: Providing university incubators with an instant validation tool to stress-test student ideas.
*   **Regional Startups**: Analyzing localized market gaps and competitor saturation in Tier 2/3 cities instantly.

# SLIDE 7: Show Stoppers
**On-ground Deployment Challenges & Mitigation**:
1.  **Challenge**: LLM Rate limits and High Latency.
    **Measure**: Migrated generation layer from OpenAI to Groq's Llama-3-70b, reducing report generation time from 3 minutes to under 60 seconds.
2.  **Challenge**: Context Loss across multiple agents.
    **Measure**: Implemented persistent shared memory using Supabase pgvector so agents can query each other's findings.
3.  **Challenge**: Data Privacy.
    **Measure**: Implemented strict Row Level Security (RLS) in Supabase. Backend uses secure Service Role Keys; public access is denied to raw agent memory.

# SLIDE 8: Business Model
*   **Freemium Model**: 3 free reports/month.
*   **Pro Subscription (B2C)**: $15/month for unlimited reports, deep financial modeling, and PDF exports.
*   **Enterprise API (B2B)**: Pay-per-use API for incubators and VCs to plug AgentFlow into their own vetting pipelines.
*   **Marketing Strategy**: Target university E-Cells, Indie Hackers, and Product Hunt launches. Focus on "Validate your idea over your lunch break" messaging.

# SLIDE 9: Future Prospects
*   **Scaling**: Transition to Kubernetes for horizontal scaling of the FastAPI worker queues during high traffic.
*   **Product Extensions**: 
    - Automated Pitch Deck Generator (exporting directly to PowerPoint).
    - Financial Projections Agent (connecting to live economic APIs).
*   **Social/Economic Impact**: Democratizing access to elite-level business strategy, lowering the barrier to entry for founders from developing regions.

# SLIDE 10: Prototype Demo (Optional)
*   **Live Link**: https://agentflowpro.vercel.app/
*   **GitHub**: https://github.com/SahilAdvani/AgentFlow
*   **Walkthrough**:
    1. Enter "Eco-friendly Bamboo Toothbrushes in Assam".
    2. Watch the live Agent Graph and Streaming Terminal.
    3. View the generated PDF and History Dashboard.
