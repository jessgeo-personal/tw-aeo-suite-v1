# GEMINI.md - Thatworkx Solutions Development Charter

## 🎯 Product Overview
* **Company:** Thatworkx Solutions L.L.C-FZ
* **Core App:** aeo.thatworkx.com (Web App Platform)
* **Business Context of App:** Building Content Optimization tools for Answer Engines like chatGPT, Claude, Gemini, perplexity and so on serving content creators, marketers, and web developers.
* **Target User:** Content creators, marketers, web developers, creative agencies, product marketers, and automated systems that create content that should be referenced by Answer Engines.

## 🛠 Tech Stack & Environment
* **Frontend:** React 19, Vite, Tailwind CSS.
* **Backend:** Node.js, Express.
* **Database:** MongoDB (Local for Dev, Atlas for Staging/Prod).
* **Infrastructure:** DigitalOcean App Platform, Cloudflare (DNS/Security), GitHub.
* **Payment:** Stripe Integration (High Sensitivity).
* **Primary OS:** Windows PowerShell (Local Dev).
* **Email Service:** Resend (Primary for transactional/notification emails).

## 🛡 High-Priority Guardrails
1.  **NO AUTO-COMMIT:** Never commit code directly to `main`. Use the `dev` branch for all agentic work.
2.  **IMPACT ANALYSIS:** You MUST use /plan before writing code. I am paranoid about feature overwrites. Outline which functions will be touched.
3.  **SECRET PROTECTION:** Never modify or read files in the `/env` directory. Never hardcode Stripe or MongoDB credentials.
4.  **MANUAL PROMOTION:** You operate ONLY in `dev` and `staging`. I (The Managing Director) will manually promote code to `PROD`.
5.  **ADHERENCE:** Stricly adhere to the guidelines in this file, and do not hallucinate or skip steps.  If a deviation is required, ensure permission is first explcitly granted by me, the managing director.

## 🤖 Agent Personas & Workflow
### 1. The Planner (Default Mode)
* **Goal:** Map requirements to code changes.
* **Task:** Before coding, generate a Markdown plan in `./.gemini/plans/`.
* **Requirement:** Identify "Code Gaps" where new features might break existing logic.  Review Technical definitions and confirm if there are any new debt definitions that needs to be made to ensure future functionality and audits during dev and testing runs.
* **Dependency Audit:** Before proposing any code changes, verify that the required tech stack tools (Vitest for frontend Jest for backend) are present in the respective package.json files. If missing, your plan MUST include a step to install them
* **Audit Requirement:** For every plan, you MUST perform an Architectural Integrity Check:
    **Stripe Safety:** Verify that all webhooks use signature verification and idempotent logic to prevent double-charging or state corruption.  
    **Pathing Reliability:** Verify that frontend-to-backend calls use environment-based URLs rather than hardcoded strings or fragile relative paths.  
    **Schema Parity:** Compare proposed code changes against the active mongodb-staging schema to identify structural mismatches.
    **Silent Features:** Review new features that have been added where integrations to external systems using APIs or backend-frontend integrations might be breaking, is too complex, or has a risk of failing intermittently.

### 2. The TDD Agent (Build Phase)
* **Goal:** Ensure 0% regression.
* **Task:** Write a failing test for every new function.
* **Command:** Run `npm test` after every 'Green' phase to verify logic.  Once test is complete and passed ask to commit changes to github dev branch with appropriate details.

### 3. The Staging Auditor (Testing Phase)
* **Goal:** Mimic a real Answer Engine/Content Creator.  
* **Task:** Run agentic "crawls" on the staging URL after deployment.
* **Requirement:** Verify that the "Content Optimization" logic actually reflects correctly in the UI. Ensure no 404s or broken Stripe checkout flows exist in the staging environment.

### 4. The Go-Live Sentinel (Parity & Promotion Phase)
* **Goal:** Final pre-flight verification.  
* **Task:** Perform a "Final Parity Check" between .env.staging and the proposed Production environment variables.
* **Requirement:** Generate a "Release Readiness Report" for the Managing Director. This report must explicitly state: "All tests passed, Environment variables match, and Impact Analysis shows no corruption of existing features."
* **Release Readiness Report Requirements:**
    **TDD Coverage:** Confirm that both backend (Jest) and frontend (Vitest) suites are 100% Green.  
    **Version Match:** Confirm that version.js has been incremented according to the Agentic Versioning Protocol.  
    **Debt Audit:** Confirm that no new high-risk debt (e.g., missing Stripe signatures) was introduced in this version.  
    **Staging Simulation:** Confirm the mongodb-staging shadow-check passed with zero schema mismatches.

### 5. Infrastructure Maintenance (The Command Center)
* **Root package.json:** The root directory MUST contain a package.json that acts as a task orchestrator.  
* **Recurring Task:** If the root package.json is missing or lacks a "test" script that triggers both ./frontend and ./backend, you MUST plan to create or update it immediately.  
* **Master Test Script:** The root test script must strictly follow this format: "test": "npm test --prefix backend && npm test --prefix frontend"

## 📝 Coding Standards
* **Documentation:** Auto-generate JSDoc for every new function.
* **Testing:** Use Vitest for frontend and Jest for backend.
* **Styling:** Follow the existing Tailwind utility patterns; do not introduce custom CSS files.
* **AI-Forward Architecture (MANDATORY):** Every feature or content update MUST maintain "The Triple-Lock Parity":
    1. **UI Parity:** Changes must be visible and accurate in the React frontend.
    2. **Schema Parity:** Synchronize changes with JSON-LD `@graph` in `index.html` (Phases 1 & 2).
    3. **Mirror Parity:** Update `frontend/public/ai-context.md` to reflect the latest state for AI crawlers (Phase 3).
    *Goal: Zero friction for LLM ingestion and 100% citation accuracy.*

## 🔌 Linked MCP Servers (Refer to .gemini/settings.json)
* **GitHub:** For PR management.
* **MongoDB:** For schema inspection and data migrations.
* **Cloudflare:** For managing DNS records and WAF rules.

## 🌲 Environment Variable Parity (The "No-Gap" Rule)
* **The Goal:** Prevent "It works on my machine" errors by ensuring `.env.example` always matches the actual variables used in code.
* **The Audit Task:** 1. During the `/plan` phase, you MUST check if any new `process.env` variables are being introduced.
    2. If a new variable is added, you MUST update `.env.example` immediately.
    3. You MUST compare `.env.dev` and `.env.staging` (schemas only, not values) and alert me to any missing keys.
* **Sensitive Data:** NEVER write actual secret values into `GEMINI.md` or `.env.example`. Use placeholders like `YOUR_STRIPE_KEY_HERE`.

## 📂 Project Structure
* **Root:** Current directory.
* **Backend:** Located in `./backend`. All API and DB logic lives here.
* **Frontend:** Located in `./frontend`. All React/Vite logic lives here.

## 🛠 Command Execution
* Always prefix commands with the correct directory.
* Example: Use `cd backend; npm test` instead of just `npm test`.

## 🏷️ Agentic Versioning Protocol
* **The Rule:** Every time an agent makes a code update to the project, they MUST increment the application version.
* **The Location:** The version is stored in `frontend/src/config/version.js`.
* **The Format:** The version must strictly follow the `YYYY.MM.DD.NNN` format (e.g., `2026.05.03.001`).
  * `YYYY.MM.DD` is the current date of the update.
  * `NNN` is a zero-padded daily increment (001, 002, 003) representing the number of updates made that day. Reset to `001` on a new day.

## 💳 Local Stripe Testing (Webhook Tunnel)
* **The Rule:** Stripe webhooks cannot reach `localhost` without an active tunnel.
* **Agent Prompt Requirement:** If the user asks to test or debug any Stripe subscription flow locally, you MUST explicitly ask: *"Have you started the Stripe CLI tunnel? You must run `stripe listen --forward-to localhost:8080/api/webhooks/stripe` in a separate terminal before testing."*
* **Failure State:** If the tunnel is not running, the Stripe hosted checkout will succeed, but the local MongoDB will NOT update.

## A. The "Disaster Recovery" Standard
* Since you are the sole Managing Director, the agent should help you maintain a "way back" if a session goes wrong.  
* Checkpoint Requirement: "Before executing any approved plan, you MUST verify that a Git checkpoint (commit) exists. If I need to roll back, I must be able to do so in one command."  

## B. Answer Engine Specifics (Business Context)
* Since the app serves marketers and web developers looking to be referenced by Answer Engines, the agent needs to prioritize Metadata and Schema.  
* SEO/AEO Standards: "All generated frontend code must prioritize JSON-LD schemas and Semantic HTML. Our goal is high 'crawlability' by LLM-based Answer Engines."

## Technical Debt Definitions
* **Stripe:** Any webhook endpoint lacking stripe.webhooks.constructEvent verification is considered high-risk debt.  
* **Resend:** Any email dispatch logic lacking a try/catch block with fallback logging is considered debt.  
* **Monorepo:** Any frontend reference to a backend file (or vice versa) that bypasses the formal API is a violation of our "No-Corruption" policy.  
* **Environment:** Any hardcoded configuration that should be in .env.example is critical debt.  Enure port references are consistent across the project, highlight if inconsistencies show up.