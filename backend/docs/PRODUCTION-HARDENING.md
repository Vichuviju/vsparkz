# Production Hardening (Phase 5)

## Completed

- **PaymentController::store**: Wrapped in `DB::transaction`. Invoice is loaded with tenant scope; payment created and invoice status updated atomically.
- **WebhookController (Razorpay & Stripe)**: Payment creation and invoice status update wrapped in `DB::transaction`. Idempotency preserved via `Payment::firstOrCreate(['gateway_payment_id' => ...], ...)` so duplicate webhook delivery does not create duplicate payments.

## Recommended (follow-up)

- **Soft deletes**: Consider adding `SoftDeletes` to `Lead` and `Client` models and a migration for `deleted_at` column. Ensures no orphan records and allows restore. Update any queries that must exclude trashed records.
- **Referential integrity**: Ensure all foreign key constraints are in place in migrations; use `strict` mode where applicable.
- **Logging**: Consistent logging for failed webhooks and automation runs (already partial in WebhookController).
- **Settings cache**: SettingsLoaderService should cache tenant settings with clear invalidation on update.
