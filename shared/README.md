# Shared Runtime

Shared Cloudflare runtime files and cross-project rules live here.

Current contents:

- `cloudflare/_worker.js` for combined/manual Cloudflare deployments and API route handling.

Keep shared files small and deliberate. If website and agent both need the same calculation, schema, or route rule, it belongs here instead of being duplicated.
