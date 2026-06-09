# RentalReady AI Sourcing Agent

Internal sourcing dashboard, public-procurement APIs, stock search APIs, and opportunity-learning logic live here.

Cloudflare project:

- Project: `rentalready-ai-agent`
- Build command: `node scripts/build_agent_site.mjs`
- Output directory: `dist-agent`
- Domain: `sourcing.rentalreadyappliances.com`

The agent saves contract and tender opportunities as structured opportunity records, then matches them against stock evidence and bid-readiness rules. Website enquiries can later be passed into this agent as new opportunity records.

Opportunity records now include a review ledger with:

- status and keyword filters for active, bid-ready, submitted, won, lost, no-bid and stock-gap opportunities;
- a single detail panel for the selected record, including readiness percentage, bid gates, value, deadline, stock coverage, acquisition cost, ROI and projected profit;
- source coverage rows showing whether the contract can be fulfilled from one stock source or needs multiple sources;
- JSON export for an individual record, including linked stock candidates and readiness evidence for bid-package audit trails.
