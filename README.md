# 🚀 AgentFlow: AI Startup Research Command Center

**AgentFlow** is a production-quality, multi-agent AI dashboard designed to help founders analyze startup ideas. It deploys a collaborative team of specialized AI agents that perform real-time market research, competitor analysis, and strategic planning, culminating in a professional, downloadable PDF report.

![Dashboard Preview](https://img.shields.io/badge/Agent-Orchestration-blueviolet)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-emerald)
![LangChain](https://img.shields.io/badge/LangChain-Enabled-blue)

---

## 🌟 Key Features

- **Multi-Agent Collaboration**: Orchestrated agents (Manager, Research, Market, Competitor, Strategy, Report) working in a sequential pipeline.
- **Shared Vector Memory**: Agents store and retrieve research data from a **ChromaDB** vector store, enabling cross-agent context sharing.
- **Real-time Streaming**: Full transparency into agent "thinking" and results via **Server-Sent Events (SSE)**.
- **Interactive Dashboard**:
  - **Agent Graph**: Live visualization of the active agent workflow using React Flow.
  - **Live Logs**: Real-time terminal-style logging of agent activities.
  - **Market Charts**: Data-driven insights visualized with Chart.js.
- **Automated Delivery**:
  - **PDF Generation**: Styled reports generated using ReportLab.
  - **Email Service**: Automated delivery of reports via Gmail SMTP.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Orchestration**: LangChain
- **LLMs**: OpenAI (Compatible with GitHub Models, Groq, etc.)
- **Search**: Tavily AI (Advanced Web Research)
- **Memory**: ChromaDB (Vector Database)
- **Reporting**: ReportLab (PDF) & SMTP (Email)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI/UX**: Tailwind CSS, Framer Motion, Lucide Icons
- **Visualization**: React Flow (Agent Graph), Chart.js (Analytics)
- **Streaming**: SSE (EventStream)

---

## 🏗️ Architecture: Multi-Agent RAG

AgentFlow follows a **Collaborative RAG** pattern:
1. **Manager Agent** decomposes the idea into research tasks.
2. **Research Agent** crawls the web (Tavily) and populates the **Vector Memory**.
3. **Specialized Agents** perform "Self-RAG" by querying the memory for relevant context.
4. **Report Agent** synthesizes the collective knowledge into a final business plan.

---

## 🚀 Getting Started

### 1. Backend Setup
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
```
Create a `.env` file in the `backend` folder:
```env
OPENAI_API_KEY=your_key
OPENAI_BASE_URL=your_base_url (optional)
TAVILY_API_KEY=your_tavily_key
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```
Run the server:
```powershell
uvicorn main:app --reload
```

### 2. Frontend Setup
```powershell
cd frontend
npm install
```
Create a `.env.local` file in the `frontend` folder:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```
Run the dashboard:
```powershell
npm run dev
```

---

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.

---

## 🤝 Contributing
Contributions are welcome! Feel free to open issues or submit pull requests.

Build with ❤️ for the Hackathon.
