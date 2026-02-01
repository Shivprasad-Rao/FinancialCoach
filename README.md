# Smart Financial Coach
---
Submission for Case Study
YouTube Link: *https://youtu.be/YDKVGIP0_Mw*
---

## 1. Executive Summary

**Smart Financial Coach** is an AI-driven personal finance platform designed to address the lack of financial visibility among young adults and freelancers. By leveraging Generative AI and statistical modeling, the system transforms opaque transaction data into actionable, personalized insights.

Key differentiators include:

* **Zero-Config Visualization:** Instant graphical analysis of bank CSV exports.
* **Persona-Driven Coaching:** An integrated LLM (Google Gemini) provides financial advice with a distinct, engaging personality.
* **Automated Intelligence:** Deterministic algorithms detect "gray charges" (unwanted subscriptions) and forecast spending trends without manual user input.

---

## 2. System Architecture

The application follows a **Monolithic Layered Architecture**, optimized for rapid development, type safety, and maintainability.

### 2.1 High-Level Design

The system is divided into three logical tiers:

1. **Presentation Layer (Frontend):** React-based SPA consuming RESTful APIs.
2. **Application Layer (Backend):** Node.js/Express server handling business logic, orchestration, and AI integration.
3. **Data Layer (Persistence):** Local SQLite database with a structured relational schema.

### 2.2 Technology Stack

| Domain | Technology | Justification |
| :--- | :--- | :--- |
| **Languages** | **TypeScript** | Ensures end-to-end type safety and interface sharing (`types.ts`). |
| | **SQL** | Standardized data manipulation for complex reporting queries. |
| **Frontend** | **React 19 + Vite** | High-performance component rendering and fast build times. |
| | **Tailwind + shadcn/ui** | Rapid development of accessible, premium UI components. |
| | **Recharts** | Declarative data visualization library. |
| **Backend** | **Node.js + Express** | Event-driven architecture suitable for I/O-heavy operations. |
| | **Better-SQLite3** | High-performance, synchronous SQLite driver for reliable local storage. |
| **AI/ML** | **Google Gemini SDK** | Native integration for Generative AI capabilities. |

### 2.3 Key Design Patterns

* **Controller-Service-Repository:** The backend enforces strict separation of concerns. Controllers handle HTTP transport, Services encapsulate business logic (e.g., `geminiService`, `mlService`), and the Data layer handles SQL execution.
* **Circuit Breaker:** Implemented within the AI Service to detect API failures (rate limits, 500s) and automatically switch to a local "Mock Strategy," preserving system availability.
* **Dependency Injection:** Services are loosely coupled to allow for easier unit testing and mocking of external providers.

---

## 3. Component Design & Implementation

### 3.1 LLM Integration Strategy

The system uses **Google Gemini (`gemini-flash-latest`)** as an analytical engine rather than a simple chatbot.

* **Data Aggregation:** The backend pre-calculates hard statistics (anomalies, budget variances) deterministically to prevent "hallucinations."
* **One-Shot Context Window:** All relevant user context is assembled into a single JSON payload. A complex system prompt instructs the LLM to analyze this context and return a structured JSON response containing:
  * *Insights:* An array of specific financial highlights.
  * *Advice:* A narrative paragraph in the specific "Financial Coach" persona.
* **Caching Strategy:** To mitigate latency and cost, AI responses are cached in memory (TTL: 10 minutes) keyed by the transaction hash.

### 3.2 Machine Learning Algorithms

The platform utilizes a **Hybrid Intelligence** model:

* **Forecasting (OLS Linear Regression):**
  * *Input:* 6-month historical spending totals.
  * *Output:* Next month prediction, trend direction ($\Delta$), and $R^2$ confidence.
* **Anomaly Detection (Z-Score):**
  * *Input:* Category-level monthly spending.
  * *Logic:* Flag transactions where $x > \mu + 2\sigma$.
* **Subscription Detection (Heuristic):**
  * *Logic:* Analyzes inter-transaction arrival times using Coefficient of Variation ($CV < 0.25$) to identify periodic payments.
* **Burn Rate Analysis:**
  * *Logic:* Real-time velocity tracking ($daily\_spend * days\_in\_month$) to project end-of-month standing.

---

## 4. Security & Compliance

The application implements "Defense in Depth" principles:

1. **Authentication:** Stateless JSON Web Tokens (JWT) for secure API access.
2. **Input Validation:** `Zod` schemas validate all incoming request bodies, preventing SQL injection and XSS at the gate.
3. **Data Protection:** Passwords are hashed using `bcrypt` (salt rounds: 10) before storage.
4. **Network Security:** `Helmet` middleware enforces secure HTTP headers (HSTS, No-Sniff, XSS-Protection). API endpoints are protected by `express-rate-limit` to mitigate DDoS vectors.
5. **Configuration Management:** All sensitive credentials (API Keys, Secrets) are isolated in `.env` files, strictly following the 12-Factor App methodology.

---

## 5. Engineering Standards

### 5.1 Error Handling

* **Global Exception Handling:** A centralized middleware captures uncaught exceptions, logging them and returning sanitized 500 JSON responses to the client.
* **Graceful Degradation:** The UI is designed to function partially even if specific subsystems (like the AI engine) are unavailable.

### 5.2 Performance Optimization

* **Consolidated I/O:** The "Single-Shot" prompting strategy reduces network round-trips by fetching all AI insights in one request.
* **Asynchronous Loading:** The Dashboard utilizes a "Hybrid Loading" pattern, displaying instant statistical data immediately while streaming AI insights in the background.

### 5.3 Data Integrity

* **Dirty Data Management:** A robust CSV Parsing Service includes relative-date inference logic to handle inconsistent transaction dates and non-chronological uploads.

---

## 6. Future Roadmap

### 6.1 Phase 1: Advanced Analytics Core

* **Objective:** Decouple ML services.
* **Implementation:** Migrate ML logic to a Python/FastAPI microservice to leverage **PyTorch**. Implement **LSTMs/RNNs** for superior time-series forecasting.

### 6.2 Phase 2: Interactive Intelligence

* **Objective:** Enable natural language querying.
* **Implementation:** Deploy a **Retrieval-Augmented Generation (RAG)** pipeline using LangChain to allow Text-to-SQL capabilities (e.g., "Show me my Uber spending from last year").

### 6.3 Phase 3: Frictionless Onboarding

* **Objective:** Automated Data Entry.
* **Implementation:** Integrate Multimodal AI (Gemini Vision) to provide **OCR functionality**, allowing users to upload raw PDF bank statements for automated ETL processing.

---
