# RentalReady AI Sourcing Agent

Internal sourcing dashboard, public-procurement APIs, stock search APIs, and opportunity-learning logic live here.

Cloudflare project:

- Project: `rentalready-ai-agent`
- Build command: `node scripts/build_agent_site.mjs`
- Output directory: `dist-agent`
- Domain: `sourcing.rentalreadyappliances.com`

The agent saves contract and tender opportunities as structured opportunity records, then matches them against stock evidence and bid-readiness rules. Website enquiries can later be passed into this agent as new opportunity records.
