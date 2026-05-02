AEO Suite: Deployment & Operations Playbook (v1.0)

1. The Strategy: 3-Tier Agentic CI/CD

bjective: Secure the revenue stream of aeo.thatworkx.com by preventing "hot-fixes" on the production branch.

BranchDestinationPurpose

**dev
GitHub (Cloud Backup)
Local coding, experimental features, and AI-led audits.

**staging
DigitalOcean aeo-staging
Pre-release validation with "live-like" data.

**main
DigitalOcean aeo-prod
The Production App. High-stability only.

2. Operational Step-by-Step Guide
**Stage 1: Local Coding (dev)
Start: Open VS Code. Ensure you are on dev branch: git checkout dev.

Code: Use Gemini Code Assist to build features.

Local Test: Run your backend and frontend locally.

Sync: git add ., git commit -m "feat: description", git push origin dev.

Why: This ensures your work is backed up in the cloud immediately.

**Stage 2: Moving to Staging (dev → staging)
This is the "Gatekeeper" phase where you use the Agent.

Agent Audit: Ask Gemini in VS Code:

"@agent Review all changes in dev since the last commit. Check backend/services/stripeService.js for hardcoded keys and verify if any new variables were added to .env.example."

Merge: git checkout staging, git merge dev, git push origin staging.

DO Verification: DigitalOcean will auto-build. Once finished, use Gemini's Search Tool to visit your staging URL:

"@google_search Visit [Your-Staging-URL]. Does the pricing page load? Report any console errors."

**Stage 3: Production Release (staging → main)
Only do this after Staging is confirmed 100% functional.

Sync Manifest: Ask Gemini: "Update SYSTEM_MANIFEST.md with the changes from this release."

The Final Push: git checkout main, git merge staging, git push origin main.

Clean Up: Switch back to dev to start the next cycle.

Variable Group,Local (dev),Staging,Production (main)
NODE_ENV,development,staging,production
MONGODB_URI,Local/Dev Cluster,Staging Cluster,Prod Cluster (Restricted)
STRIPE_SECRET,Test Key (sk_test_),Test Key (sk_test_),Live Key (sk_live_)
HUBSPOT_TOKEN,Sandbox Token,Sandbox Token,Live Token
API_URL,localhost:5000,Staging Domain,aeo.thatworkx.com

Golden Rule: If you add a variable to dev, you must manually add it to the DigitalOcean Dashboard for both the Staging and Production Apps before pushing the code.

