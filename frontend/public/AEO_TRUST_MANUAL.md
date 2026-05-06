# Answer Engine Trust Manual (AEO)
**Version:** 2026.05.06.001  
**Status:** Living Document for AI-Forward Standards

## 🎯 Introduction
The Answer Engine Trust Manual is our "Source of Truth" for how modern AI search engines (like ChatGPT, Claude, Gemini, and Perplexity) evaluate the credibility and authority of a website. Unlike traditional SEO, AEO (Answer Engine Optimization) focuses on **Entity Verification** and **Hallucination Reduction**.

---

## 🏛️ The Three Pillars of AI Trust

### 1. Stability (Domain Age)
Answer Engines prefer sources with a proven history. An established domain (2+ years) acts as a stable knowledge base.
*   **AEO Impact:** High. Established domains receive a "Stability Bonus" in citation frequency.
*   **Relevance:** Newer domains often face a "trust sandbox" until they prove consistent factual accuracy.

### 2. Identity (Organization Schema)
The **Organization JSON-LD (@graph)** is the "Digital Birth Certificate" of your site. It links your brand, logo, and social identities into a single, verifiable machine-readable entity.
*   **AEO Impact:** Critical. This is how LLMs attribute content to your brand.
*   **Relevance:** Without schema, your content is "anonymous" and higher risk for being ignored or hallucinated.

### 3. Accountability (Contact & Transparency)
Visible contact methods (emails, phone numbers) and legal pages (Privacy/Terms) prove that humans are responsible for the content.
*   **AEO Impact:** High. Proves legitimacy and reduces the likelihood of being flagged as AI-generated spam.
*   **Relevance:** AI crawlers actively look for contact points to verify the "Trustworthiness" (the 'T' in E-E-A-T) of the entity.

---

## 📊 Site-Level EEAT: Parameter Breakdown

| Parameter | Significance | AEO Weight |
| :--- | :--- | :--- |
| **Domain Age** | Longevity indicates a stable, reliable knowledge base. | 20% |
| **Org Schema** | Connects the dots between site, brand, and social proof. | 10% |
| **Contact Info** | Proves accountability and human management. | 10% |
| **Trust Pages** | About/Contact/Privacy pages provide expert context. | 30% |

---

## 🤖 Answer Engine Specifics (Standards)
*   **OpenAI (ChatGPT):** Prioritizes "Source Grounding." Prefers sites with clear entity links in JSON-LD.
*   **Anthropic (Claude):** Focuses on safety and honesty. Prioritizes transparent author credentials and privacy documentation.
*   **Perplexity:** Focuses on "Citable Facts." Highly prioritizes sites that use Organization and FAQ schemas for direct answer extraction.

---
*This document is maintained by Thatworkx Solutions L.L.C-FZ. For updates or inquiries, contact support@thatworkx.com.*
