# Handover Checklist

Use this checklist before handing Nati Nest to the owner/operator.

## Technical Verification

- [ ] Backend typecheck passes.
- [ ] Backend build passes.
- [ ] Backend tests pass.
- [ ] Backend coverage report generated.
- [ ] Frontend typecheck passes.
- [ ] Frontend build passes.
- [ ] Frontend tests pass.
- [ ] Frontend coverage report generated.
- [ ] Playwright E2E tests pass for the target environment.
- [ ] Docker build succeeds.
- [ ] Docker services are healthy.
- [ ] `/health` shows database connected.
- [ ] `/ready` responds through Nginx.

## Security

- [ ] Production `.env` is stored securely and not committed.
- [ ] Seed account passwords are changed.
- [ ] JWT secrets are unique and at least 64 characters.
- [ ] Database requires strong credentials.
- [ ] HTTPS is enabled.
- [ ] CORS origins match production domains.
- [ ] Cloudinary or upload backup policy is configured.
- [ ] Rate limits are enabled.
- [ ] `npm audit` reviewed for backend and frontend.

## Owner Training

- [ ] Owner can log in as admin.
- [ ] Owner can create/edit menu categories.
- [ ] Owner can create/edit menu items and images.
- [ ] Owner can toggle item availability.
- [ ] Owner can create tables and access QR codes.
- [ ] Owner can add, deactivate, and edit staff.
- [ ] Owner can configure UPI settings.
- [ ] Owner can view and export reports.
- [ ] Owner can review catering leads.

## Staff Training

- [ ] Kitchen staff can accept, prepare, and mark orders ready.
- [ ] Kitchen staff can reject unavailable items.
- [ ] Server staff can claim and deliver orders.
- [ ] Server staff can resolve assistance requests.
- [ ] Server staff can verify cash and UPI payments.

## Recovery

- [ ] Backup script has run successfully.
- [ ] Restore script has been tested on a non-production database.
- [ ] Upload/image backup strategy is confirmed.
- [ ] Admin credentials are stored in owner password manager.
- [ ] Emergency contact and deployment access are documented.

## Final Decision

- [ ] Owner confirms workflows are usable without developer help.
- [ ] Remaining known issues are documented.
- [ ] Launch date and support plan are agreed.

