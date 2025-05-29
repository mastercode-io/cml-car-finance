# Product Requirements Document (PRD)
**Project:** Claim My Loss – Client Portal “Your Claims Dashboard”  
**Date:** 27 May 2025  
**Version:** 1.0  

---

## 1. Executive Summary  
Enable Claim My Loss clients to securely log in and view a personalized dashboard summarizing the status of all their ongoing and completed claims. The dashboard provides at-a-glance progress, key dates, and estimated values, matching the brand’s existing look-and-feel.

---

## 2. Objectives & Success Metrics

| Objective                                                        | Success Metric                                                  |
|------------------------------------------------------------------|-----------------------------------------------------------------|
| Provide clear visibility into open and closed claims             | ≥ 90% of users locate claim info within 10 seconds              |
| Surface key dates and estimated resolution/value                 | ≤ 1% support tickets asking “when will my claim finish?”        |
| Maintain brand consistency with portal’s existing pages (e.g. login, claim checker) | Visual QA score ≥ 95% against style guide                       |
| Responsive, accessible experience                                | WCAG 2.1 AA compliance; < 2 sec page load on mobile             |

---

## 3. Personas  

- **Emma, 42 (Ongoing Claimant)**  
  - Needs quick status updates on multiple finance claims  
  - Values clarity on next steps and expected timeline  
- **Raj, 55 (Recurrent User)**  
  - Manages claims for family members too  
  - Wants to download summaries or see historical (closed) claims  
- **Sofia, 30 (First-Time Visitor)**  
  - Just submitted a claim, checking confirmation and anticipated timeline  

---

## 4. User Stories

1. **As a logged-in user**, I want to see all my *open* claims in one place so I know which cases are active.  
2. **As a logged-in user**, I want to see all my *closed* claims so I can verify completed outcomes.  
3. **As a logged-in user**, I want each claim card to display the provider name, start date, current stage (with its own start date), expected resolution date, and potential claim amount.  
4. **As a logged-in user**, I want an aggregate summary of total potential value and number of open/closed claims.  
5. **As a logged-in user**, I want the dashboard’s header, footer, typography, and colors to match the existing portal (see Login and Claim Checker screens).

---

## 5. Scope & Features

### 5.1 Authentication & Entry
- **Login Gate**  
  - Reuse existing one-time password flow (mobile or email) as seen on the Login Screen.  
  - On successful login, redirect to `/dashboard`.

### 5.2 Dashboard Layout  
- **Page Header**  
  - Title: **Your Claims Dashboard** (H1, Montserrat xl, bold).  
  - Subtitle: *Track the progress of your compensation claims* (base size, medium weight).  
- **Open Claims Section**  
  - Section header: “Open Claims” with count badge.  
  - Grid/List of **Claim Cards**.  
- **Closed Claims Section** (collapsed by default, expandable)  
  - Section header: “Closed Claims” with count badge.  
- **Summary Bar** (optional sticky at top or bottom)  
  - Total Open Claims: *N*  
  - Total Potential Value: *£X,XXX*

### 5.3 Claim Card Component  
- **Container**  
  - Dark background (`#252C35`), rounded corners (2xl), soft shadow.  
  - Padding `p-4`/`p-6` as per existing card styles on Claim Checker.  
- **Fields**  
  1. **Provider Name** (Montserrat xl, semibold, uppercase)  
  2. **Claim Started:** *DD MMM, YYYY*  
  3. **Current Stage:** *e.g. Pack Out*  
  4. **Stage Started:** *DD MMM, YYYY*  
  5. **Expected Resolution:** *DD MMM, YYYY*  
  6. **Expected Amount:** *£X,XXX*  
- **Layout**  
  - Two-column grid on desktop: left for dates/stages, right for expected amount.  
  - Stack vertically on mobile.

### 5.4 Interactions  
- **Hover State** on cards: subtle elevation, border highlight (`#5AB2A7`).  
- **Click Behavior**: navigate to detailed claim page (`/dashboard/claim/:id`).  
- **Expand/Collapse** closed claims section.  
- **Responsive Breakpoints**  
  - `< 768px`: single-column cards  
  - `≥ 768px`: two-column grid  

---

## 6. Data & API

### 6.1 Endpoints  
- `GET /api/claims?status=open|closed` → returns array of claim objects  
- **Claim Object:**  
  \`\`\`json
  {
    "id": "uuid",
    "provider": "Hyundai Capital UK Ltd",
    "startDate": "2025-05-27",
    "currentStage": "Pack Out",
    "stageStartDate": "2025-05-27",
    "expectedResolution": "2025-12-02",
    "potentialAmount": 0
  }
  \`\`\`
- `GET /api/claims/summary` → `{ openCount, closedCount, totalOpenValue, totalClosedValue }`

### 6.2 Error Handling  
- **API Failure:** show inline error banner (“Unable to load claims. Retry?”).  
- **Empty State:**  
  - No open claims: display “You have no open claims. Start a new claim ➔” linking to the Mis-Sold Car Finance Claim Checker.  
  - No closed claims: show “No closed claims yet.”

---

## 7. Visual & Brand Guidelines

| Element              | Specification                                  | Reference                                  |
|----------------------|------------------------------------------------|--------------------------------------------|
| **Primary Text**     | Montserrat, #FFFFFF on dark bg; #252C35 on light bg | Matches Claim Checker text styles         |
| **Accent Color**     | Teal – `#5AB2A7`                               | Underline on “Your Claims Dashboard”       |
| **Secondary Action** | Red – `#C94C4C` (buttons, error states)         | “Search” button on Claim Checker           |
| **Backgrounds**      | Dark – `#1E2228` / `#252C35`                   | Cards and login panel backgrounds          |
| **Buttons & Badges** | Border radius 2xl, padding `p-2`/`p-4`         | Follows existing portal UI (see Login)     |

---

## 8. Accessibility & Performance

- **Keyboard Navigation:** all cards and controls reachable via Tab/Enter.  
- **Contrast Ratios:** ≥ 4.5:1 for text over backgrounds.  
- **ARIA Labels:** e.g. `<section aria-labelledby="open-claims-header">`.  
- **Lazy-load** closed claims when expanded.  
- **Page Load:** ≤ 2 s on 3G mobile; bundle size ≤ 150 KB gzipped.

---

## 9. Analytics & Monitoring

- **Events to Track:**  
  - `dashboard_viewed` (with counts of open/closed)  
  - `claim_card_clicked` (claim id)  
  - `toggle_closed_claims`  
- **Error Logging:** capture API errors via Sentry (or equivalent).

---

## 10. Out of Scope (v1)

- Document upload UI  
- Detailed claim timeline visualization  
- Bulk actions (e.g., “Download all”)

---

## 11. Appendix

- **Draft Dashboard Screenshots:**  
  - Open claims cards: provider, dates, status, amount  
  - Closed claims section (mirror open)  
- **Existing Portal References:**  
  - **Login Screen** (one-time password panel)  
  - **Claim Checker** (form layout, typography, buttons)  
- **Brand Style Guide** (shared separately)

---

*Prepared for use by UI design assistants (e.g. Vercel v0, Google’s Stitch) to implement the responsive, branded “Your Claims Dashboard.”*
