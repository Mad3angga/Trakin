# Security Policy

## Before pushing to GitHub — CRITICAL checklist

This project previously contained **real secrets on disk** (GEMINI_API_KEY, Firebase service-account private key, APP_KEY, DB password empty). Before `git push`:

1. **Rotate leaked secrets immediately:**
   - Google AI Studio → regenerate `GEMINI_API_KEY`
   - Firebase Console → Service Accounts → generate new key for `trakin-241a5`, delete old `private_key_id 7a6661e...`
   - `php artisan key:generate` → new `APP_KEY`
   - Set strong `DB_PASSWORD` (never empty)
2. **Verify `.gitignore` is applied:**
   ```
   git check-ignore -v .env
   git check-ignore -v storage/app/firebase/service-account.json
   git check-ignore -v database/database.sqlite
   ```
   All must be ignored. `.env.example` is the only env file committed (with `APP_ENV=production`, `APP_DEBUG=false`, placeholder values).
3. **Do not commit:**
   - `.env`, `.env.*` (except `.env.example`), `storage/app/firebase/*.json`, `*.key`, `database/*.sqlite`, `storage/logs/*.log`
4. **Production env:**
   - `APP_ENV=production`, `APP_DEBUG=false`, `LOG_LEVEL=warning`, `SESSION_SECURE_COOKIE=true` (requires HTTPS), `SESSION_SAME_SITE=lax`
   - `cleartext:false` in `capacitor.config.json` (already patched)

## Reporting

Do not open public issues for secrets. Rotate first, then contact owner.
