# Environment Synchronization Checklist

### [ ] Phase 1: Local Development (Branch: `dev`)
- [ ] `.env` contains `NODE_ENV=development`.
- [ ] Stripe is using `pk_test_...` and `sk_test_...`.
- [ ] MongoDB URI points to `dev-cluster`.
- [ ] HubSpot API Key is the Sandbox/Dev key.

### [ ] Phase 2: Staging Validation (Branch: `staging`)
- [ ] DigitalOcean App Platform "Environment Variables" updated.
- [ ] `NODE_ENV=staging` set.
- [ ] MongoDB URI points to `staging-cluster`.
- [ ] Verify: Stripe Webhook Secret matches the Staging endpoint in Stripe Dashboard.
- [ ] Verify: HubSpot lead form submits to the "Staging/Test" list.

### [ ] Phase 3: Production Release (Branch: `main`)
- [ ] `NODE_ENV=production` set.
- [ ] Stripe is using **Live Mode** keys (`pk_live_...`).
- [ ] MongoDB URI points to **Production** cluster.
- [ ] All `console.log` statements removed (Agent task: `@agent clean logs`).