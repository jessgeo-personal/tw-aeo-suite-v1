# AEO Suite v1: Master Manifest

## 1. Executive Summary
- **Business Goal:** AI-driven SEO/AEO analysis suite for subscription customers.
- **Stack:** MERN (MongoDB, Express, React, Node.js).
- **Hosting:** DigitalOcean App Platform (3-tier: Dev, Staging, Prod).

## 2. Infrastructure Map
| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React, Tailwind CSS | Dashboard & Landing Page |
| **Backend** | Node.js, Express | API, Analyzers, Subscriptions |
| **Database** | MongoDB | User data, Analysis history, Stats |
| **Payments** | Stripe | Subscription & Billing Management |
| **CRM** | HubSpot | Lead generation & Customer tracking |
| **Mailing** | RMail / Custom NodeMailer | OTP and Transactional alerts |

## 3. Environment Context
- **Development:** Localhost, `.env` file, MongoDB Atlas (Dev Cluster).
- **Staging:** `aeo-staging` (DigitalOcean), GitHub `staging` branch.
- **Production:** `aeo-prod` (DigitalOcean), GitHub `main` branch.

## 4. Agentic Governance Rules
1. **No-Drift Policy:** Any change to `.env.example` must be accompanied by a manual update to DigitalOcean App settings.
2. **Auto-Doc:** Every commit to `staging` must update the "Recent Changes" section in this file.
3. **Safety First:** Test Stripe webhooks and HubSpot forms before every merge to `main`.

## 5. Directory Registry
- `/backend`: Core logic, API routes, and AI Analyzers.
- `/frontend`: UI components and subscription checkout flows.
- `/DOCS`: (Internal) Technical deep-dives on specific services.