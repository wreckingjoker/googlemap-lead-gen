# CLAUDE.md — Lead Generation & Outreach Automation

## Project Overview

You are operating inside the **WAT Framework (Workflows, Agents, Tools)** for a lead generation and outreach automation system. Your mission is to automate the end-to-end process of sourcing leads, enriching them, generating personalised outreach emails, and tracking campaign performance — powered by **n8n** as the workflow engine and a clean professional **React UI** as the control surface.

---

## The WAT Architecture

### Layer 1 — Workflows (`workflows/`)

Markdown SOPs stored in `workflows/`. Each workflow defines the objective, required inputs, which tools to use and in what order, expected outputs, and edge case handling. Read the relevant workflow before taking any action. **Never overwrite workflow files unless explicitly instructed.**

### Layer 2 — Agent (You)

You are the decision-maker and orchestrator. Read the workflow → sequence the tools → recover from errors → improve the system. Never attempt execution-layer work directly — delegate to tools. When in doubt about n8n node behaviour, **stop and ask** before assuming.

### Layer 3 — Tools (`tools/`)

Python and Node.js scripts in `tools/` that handle all deterministic execution. n8n webhook URLs and API keys are stored exclusively in `.env`. **Never hardcode secrets anywhere else.**

---

## Tech Stack

| Layer             | Choice                                                 |
| ----------------- | ------------------------------------------------------ |
| Frontend          | React + Vite                                           |
| Styling           | Tailwind CSS                                           |
| Automation Engine | n8n (self-hosted or cloud)                             |
| AI Model          | claude-sonnet-4-20250514                               |
| Web Search        | web_search_20250305 tool                               |
| Lead Source       | Apify Google Maps Scraper                              |
| Email Delivery    | SMTP / SendGrid via n8n node                           |
| Storage           | localStorage (campaign configs + run history)          |
| Deploy            | Vercel or Netlify (UI) + n8n Cloud / Railway (backend) |

---

## Project File Structure

```
leadflow/
├── public/
├── src/
│   ├── components/
│   │   ├── CampaignForm.jsx       # All campaign brief input fields
│   │   ├── RunOutput.jsx          # Live run status + results display
│   │   ├── RunLogs.jsx            # Past workflow execution history
│   │   ├── MetricsDashboard.jsx   # Stats: leads, emails, open rate, replies
│   │   ├── ConfigPanel.jsx        # n8n connection + automation toggles
│   │   └── TrendPanel.jsx         # Live trending outreach hooks sidebar
│   ├── api/
│   │   └── n8n.js                 # All n8n webhook calls (trigger, status, config, metrics)
│   ├── utils/
│   │   └── exportCSV.js           # Lead export helper
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── workflows/
│   ├── new-campaign.md            # SOP: trigger a new outreach campaign
│   ├── re-edit-campaign.md        # SOP: modify an existing campaign config
│   └── error-recovery.md         # SOP: self-improvement and error handling loop
├── tools/
│   ├── parse_leads.py             # Parse and validate lead CSVs
│   ├── build_prompt.js            # Build Claude prompt from campaign brief
│   └── job_tracker.js             # Log runs to jobs.csv
├── n8n/
│   └── workflow.json              # Exported n8n workflow definition
├── .env                           # All secrets — never hardcode
├── CLAUDE.md                      # This file
├── package.json
└── vite.config.js
```

---

## Core User Journey

1. User fills the **Campaign Brief Form**: brand name, industry, audience, goal, tone, product, message, CTA
2. Agent searches the web for currently trending outreach hooks and cold email formats in the client's niche
3. Agent engineers a precise prompt from the brief + trending insight
4. UI **triggers the n8n webhook** with the campaign payload
5. n8n executes: source leads → enrich → deduplicate → generate personalised emails via Claude → send via SMTP
6. UI **polls run status** and shows live progress with step-by-step feedback
7. On completion, **MetricsDashboard** updates with leads processed, emails sent, and delivery stats
8. Run is logged to `leadflow_history` in localStorage and to `jobs.csv` via `job_tracker`

---

## Workflows

Before taking any action, identify which workflow applies and read it fully. Workflows live in `workflows/` — your standing instructions. Never overwrite them without explicit instruction.

### Workflow: New Campaign Run

1. Parse the Campaign Brief Form submission to extract all structured fields
2. Call web search for trending cold email hooks and outreach formats in the client's niche — **always do this, never skip**
3. Check localStorage for a cached Client Profile for this brand — if less than 7 days old, reuse it
4. Run `build_prompt` with Client Profile + parsed brief + trending insight → save prompt to `.tmp/prompts/`
5. POST to `VITE_N8N_WEBHOOK_TRIGGER` with full campaign payload (JSON)
6. Poll `VITE_N8N_WEBHOOK_STATUS` every 5 seconds → update progress bar and step labels in RunOutput
7. On completion, parse results and update MetricsDashboard
8. Log the job in `jobs.csv` via `job_tracker` with `status`, `leads_processed`, `emails_sent`, `job_id`

### Workflow: Re-Edit Campaign

1. Parse the re-edit instruction to identify which fields changed (audience, tone, message, CTA, limits)
2. Update only the affected fields in the campaign payload — do not rebuild the Client Profile
3. POST updated payload to `VITE_N8N_WEBHOOK_TRIGGER` with the same `campaign_id` (marks it as a re-run)
4. Log the re-run as a **child job** under the original `job_id` for cost and audit tracking
5. Do not regenerate everything — only what changed

### Workflow: Error Recovery (Self-Improvement Loop)

1. Read the full error and traceback carefully
2. Fix the issue and retest before proceeding
3. If the fix requires paid API calls or webhook calls — **stop and confirm with the user first**
4. Document the fix in the relevant workflow file under `## Known Issues`
5. Continue with a more robust approach and log what was learned

---

## Campaign Brief Form Fields (`CampaignForm.jsx`)

Build a controlled React form. All fields required unless marked optional.

| Field                  | Input Type   | Options / Notes                                                                              |
| ---------------------- | ------------ | -------------------------------------------------------------------------------------------- |
| Campaign Name          | Text         | Free input, e.g. "Q2 SaaS Founders"                                                          |
| Brand / Client Name    | Text         | Free input                                                                                   |
| Industry / Niche       | Dropdown     | SaaS, Fintech, E-commerce, Real Estate, Agency, Healthcare, Fitness, Education, Other        |
| Target Audience        | Text         | e.g. "Founders of B2B SaaS companies, 10–50 employees"                                       |
| Campaign Goal          | Dropdown     | Book a Demo, Drive Sign-ups, Promote a Feature, Build Awareness, Offer a Free Audit, Other   |
| Tone of Voice          | Multi-select | Professional, Conversational, Bold, Concise, Friendly, Executive, Urgent                     |
| Product or Service     | Textarea     | What is being promoted                                                                       |
| Key Message            | Textarea     | The ONE thing the reader must remember                                                       |
| Call to Action         | Text         | e.g. "Book a 15-min call", "Reply YES", "Link in bio"                                        |
| Lead Source            | Dropdown     | Apollo.io, LinkedIn Export, CSV Upload, Manual List                                          |
| Company Size Filter    | Dropdown     | 1–10, 11–50, 51–200, 201–500, 500+                                                           |
| Max Leads to Process   | Number       | 1–1000, default 200                                                                          |
| Hook Style             | Dropdown     | Bold Statement, Question, POV Format, Stat-led, Pain Point Open, Story Open, Compliment Open |
| Sender Name            | Text         | e.g. "Alex from LeadFlow"                                                                    |
| Inspiration (optional) | Text         | Accounts or brands with a similar outreach style                                             |
| Extra Notes (optional) | Textarea     | Specific requests or things to avoid                                                         |

> **Load Client Profile**: Add a dropdown above the form to pre-fill saved clients. Add a **Save Profile** button to persist the current client to localStorage.

---

## n8n API Integration (`api/n8n.js`)

### Webhook Endpoints

```javascript
const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL; // e.g. http://localhost:5678
const WEBHOOK_TOKEN = import.meta.env.VITE_N8N_TOKEN;
const WORKFLOW_ID = import.meta.env.VITE_N8N_WORKFLOW_ID;

const ENDPOINTS = {
  trigger: `${N8N_BASE_URL}/webhook/trigger`,
  status: `${N8N_BASE_URL}/webhook/status`,
  config: `${N8N_BASE_URL}/webhook/config`,
  metrics: `${N8N_BASE_URL}/webhook/metrics`,
};
```

### Trigger a Campaign Run

```javascript
export const triggerCampaign = async (formData) => {
  const response = await fetch(ENDPOINTS.trigger, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WEBHOOK_TOKEN}`,
    },
    body: JSON.stringify({
      campaign_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...formData,
    }),
  });
  if (!response.ok) throw new Error(`Trigger failed: ${response.status}`);
  return response.json();
};
```

### Poll Run Status

```javascript
export const pollStatus = async (jobId) => {
  const response = await fetch(`${ENDPOINTS.status}?job_id=${jobId}`, {
    headers: { Authorization: `Bearer ${WEBHOOK_TOKEN}` },
  });
  return response.json();
  // Expected shape:
  // { job_id, status: 'running'|'success'|'error', step, leads_processed, emails_sent, error_message }
};
```

### Response Handling

```javascript
// Always parse inside try/catch
try {
  const data = await triggerCampaign(formData);
  // Start polling loop
  const interval = setInterval(async () => {
    const status = await pollStatus(data.job_id);
    updateUI(status);
    if (status.status !== "running") clearInterval(interval);
  }, 5000);
} catch (err) {
  setError(err.message);
}
```

---

## Claude API Integration (inside n8n AI Node)

Use this system prompt and user prompt structure inside the **n8n Claude AI node** for email personalisation.

### System Prompt

```
You are an expert B2B cold email copywriter.
You write concise, personalised outreach emails that feel human — never spammy.

You will receive a lead's details and a campaign brief.
Search the web for recent news, product updates, or context about the lead's company before writing.

Always return ONLY valid JSON — no preamble, no markdown fences.

Required output format:
{
  "subject": "Email subject line",
  "body": "Full personalised email body — plain text, no HTML",
  "personalisation_note": "What specific detail was used to personalise this email",
  "follow_up": "Suggested follow-up message if no reply after 3 days"
}
```

### Dynamic User Prompt (built by `build_prompt.js`)

```javascript
const buildPrompt = (lead, formData) => `
Write a cold outreach email for the following lead and campaign:

LEAD DETAILS:
- Name: ${lead.firstName} ${lead.lastName}
- Title: ${lead.title}
- Company: ${lead.company}
- Industry: ${lead.industry}
- Company Size: ${lead.companySize}

CAMPAIGN BRIEF:
- Brand: ${formData.clientName}
- Goal: ${formData.goal}
- Product: ${formData.product}
- Key Message: ${formData.keyMessage}
- Tone: ${formData.tone.join(", ")}
- Hook Style: ${formData.hookStyle}
- CTA: ${formData.cta}
- Sender: ${formData.senderName}
${formData.notes ? `- Notes: ${formData.notes}` : ""}

Search for any recent news or context about ${lead.company} before writing.
Personalise the email using a specific, relevant detail from your search.
Return ONLY valid JSON matching the required output format.
`;
```

---

## Output UI Layout (`RunOutput.jsx`)

Render run status and results in this layout. All sections driven by live webhook data — no hardcoding.

```
┌──────────────────────────────────────────────────────────┐
│  🚀 CAMPAIGN TRIGGERED — Q2 SaaS Founders                │
│  Run ID: RUN-047  ·  Started: Today 09:14                │
├──────────────────────────────────────────────────────────┤
│  ⚡ LIVE PROGRESS                                        │
│  ████████████░░░░  Step 4 of 6 — Sending Emails...       │
├──────────────────────────────────────────────────────────┤
│  📊 RUN RESULTS (on completion)                          │
│  Leads Sourced      200                                  │
│  Emails Sent        187                                  │
│  Duplicates Skipped  11                                  │
│  Errors               2                                  │
├──────────────────────────────────────────────────────────┤
│  📝 SAMPLE EMAIL PREVIEW                                 │
│  Subject: [subject from Claude]                          │
│  Body: [first email generated — truncated to 3 lines]   │
├──────────────────────────────────────────────────────────┤
│  [Copy Run Summary]  [Export CSV]  [Re-run Campaign]     │
└──────────────────────────────────────────────────────────┘
```

---

## localStorage Schema

### Client Profiles — key: `leadflow_clients`

```json
[
  {
    "id": "uuid",
    "name": "Brand Name",
    "industry": "SaaS",
    "targetAudience": "Founders of B2B SaaS, 10–50 employees",
    "tone": ["Professional", "Concise"],
    "cta": "Book a 15-min call",
    "senderName": "Alex from LeadFlow",
    "savedAt": "ISO string"
  }
]
```

### Run History — key: `leadflow_history`

```json
[
  {
    "id": "uuid",
    "job_id": "RUN-047",
    "date": "ISO string",
    "clientName": "Brand Name",
    "campaignName": "Q2 SaaS Founders",
    "formData": { "...all fields" },
    "result": {
      "status": "success",
      "leads_processed": 200,
      "emails_sent": 187,
      "duration": "2m 34s"
    }
  }
]
```

---

## Component Responsibilities

| Component              | Responsibility                                                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `App.jsx`              | Global state: formData, runStatus, output, loading, error, history. Renders CampaignForm + RunOutput side-by-side (desktop) or stacked (mobile).          |
| `CampaignForm.jsx`     | Controlled form. Load/Save client profiles via localStorage. Submit triggers n8n webhook call.                                                            |
| `RunOutput.jsx`        | Live run progress display. Shows step labels, progress bar, results on completion. Copy + CSV export.                                                     |
| `RunLogs.jsx`          | Sidebar or full page. Shows last 50 runs from localStorage. Click any entry to reload that run's output.                                                  |
| `MetricsDashboard.jsx` | Pulls from `VITE_N8N_WEBHOOK_METRICS`. Displays: leads generated, emails sent, open rate, reply rate, weekly chart.                                       |
| `ConfigPanel.jsx`      | n8n connection settings (URL, token, workflow ID). Automation toggles (deduplication, AI personalisation, follow-ups, Slack notifications). Daily limits. |
| `TrendPanel.jsx`       | On load, calls Claude + web search for top 5 trending cold email hooks this week in the selected niche. Shown as inspiration cards before form submit.    |

---

## Build Order

| Step | Task                                                               | Done when...                                        |
| ---- | ------------------------------------------------------------------ | --------------------------------------------------- |
| 1    | Scaffold Vite + React + Tailwind                                   | `npm run dev` shows blank app                       |
| 2    | Build CampaignForm — static, no API                                | All fields render and are controlled                |
| 3    | Wire `api/n8n.js` — test trigger with hardcoded payload in console | n8n receives POST, execution logged in n8n UI       |
| 4    | Build RunOutput — render mock status JSON first                    | Progress bar, step labels, result counts display    |
| 5    | Connect form submit → trigger → poll → output                      | Full flow works end-to-end in browser               |
| 6    | Build MetricsDashboard — pull from metrics endpoint                | Stats update after each run                         |
| 7    | Add localStorage: run history + client profiles                    | Profiles save/load, history persists across refresh |
| 8    | Build RunLogs — last 50 runs, clickable                            | Past runs reload correctly                          |
| 9    | Add CSV export                                                     | Export button produces correct CSV of run summary   |
| 10   | Add TrendPanel — Claude + web search for niche hooks               | Cards show before form submission                   |
| 11   | Polish: loading skeletons, error states, empty states              | No broken states, all errors surface clearly        |
| 12   | Deploy UI to Vercel, n8n to Railway or n8n Cloud                   | Live URL accessible by team                         |

---

## n8n Workflow Node Structure

When modifying `n8n/workflow.json`, follow this node sequence:

```
[Webhook Trigger]
      ↓
[Parse Payload]
      ↓
[Apollo.io / CSV Lead Source]
      ↓
[Lead Enrichment Node]
      ↓
[Deduplicate Filter]   ← skip leads contacted in last 90 days
      ↓
[Claude AI Node]       ← personalise email per lead using build_prompt
      ↓
[SMTP / SendGrid Send]
      ↓
[Result Aggregator]
      ↓
[Webhook Response]     ← POST results back to UI status endpoint
      ↓
[Slack Notification]   ← optional, toggle via ConfigPanel
```

When adding or modifying nodes:

1. Always export the updated workflow to `n8n/workflow.json`
2. Add a comment block at the top of the JSON with what changed and why
3. Test the webhook trigger after any structural change
4. **Never delete the `[Webhook Response]` node** — the UI depends on it for polling

---

## Commands

```bash
# Scaffold
npm create vite@latest leadflow -- --template react
cd leadflow
npm install
npm install uuid

# Dev
npm run dev

# Build
npm run build

# Deploy UI
vercel --prod

# Export n8n workflow
# In n8n: Settings → Download Workflow → save as n8n/workflow.json
```

## Environment Variables (`.env`)

```
VITE_N8N_WEBHOOK_URL=https://justsearchweb.app.n8n.cloud/webhook/google-map-leads
```

> **Never expose `ANTHROPIC_API_KEY` to the React frontend.** It is used exclusively inside n8n's Claude AI node or a backend proxy — never in `src/`.

---

## Key Constraints — Never Violate

- Never store API keys or webhook tokens outside `.env`
- Never expose `ANTHROPIC_API_KEY` to the React frontend — n8n AI node only
- Never hardcode campaign values — if a field cannot be determined, mark it `null` and flag it
- Always confirm before consuming paid API credits or sending emails beyond the session estimate
- Never overwrite workflow files in `workflows/` without explicit instruction
- Timestamp sections in email scripts must adapt to selected Reel duration (15s / 30s / 60s) if applicable
- System prompt must instruct Claude to return ONLY valid JSON — no preamble, no markdown fences
- Parse all JSON responses inside `try/catch` and strip markdown fences before parsing
- Re-runs are always child jobs — link them to the parent `job_id` for cost and audit tracking
- If a webhook call fails, surface the error clearly in the UI — never fail silently
- Deduplicate leads before sending — never email the same contact twice within 90 days

---

## How to Use This File with Claude Code

- **Start a session**: `"Follow CLAUDE.md and begin with Step 1"`
- **Jump to a component**: `"Now build CampaignForm.jsx per the spec in CLAUDE.md"`
- **Modify the n8n workflow**: `"Add a Slack notification node per the workflow structure in CLAUDE.md"`
- **If Claude drifts**: `"Re-read CLAUDE.md"` to snap it back on track
- **Trigger a re-edit**: `"Update the tone field only — treat this as a re-edit per the Re-Edit Workflow"`

Claude Code reads this file automatically — drop it in the project root.
