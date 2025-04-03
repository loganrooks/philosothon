# Debug Specific Memory

## Issue History
<!-- Append new issue details using the format below -->

### Issue: DEVCONTAINER-JSON-001 - Invalid `consistency` property in `devcontainer.json` - [Status: Resolved] - [2025-04-03 02:52:00]
- **Reported**: 2025-04-03 02:46:38 / **Severity**: Medium / **Symptoms**: User reported problems (`@problems` context variable) with `.devcontainer/devcontainer.json` after modifications to add Roo Cline extension and persist VS Code state (using `mounts` and removing `workspaceMount`). User specifically pointed out error related to `consistency` property.
- **Investigation**: 
  1. Read `.devcontainer/devcontainer.json`. (2025-04-03 02:47:56)
  2. Initially misidentified issue as a missing comma. Attempted fix rejected by user. (2025-04-03 02:48:34)
  3. User feedback clarified the error was `Property consistency is not allowed`. (2025-04-03 02:49:01)
  4. Confirmed `consistency` is not a valid property for bind mounts in the `devcontainer.json` schema.
  5. Clarified that the volume mount for `/home/node/.vscode-server` handles state persistence, not the bind mount's `consistency` property. (2025-04-03 02:50:13)
  6. Wrote corrected file, removing the `consistency` property and associated comma. (2025-04-03 02:50:52)
- **Root Cause**: Invalid `consistency` property added to the workspace bind mount definition in `devcontainer.json`, likely in an attempt to manage file persistence/performance, but violating the schema.
- **Fix Applied**: Removed the `"consistency": "cached"` line and the trailing comma from the preceding line within the workspace bind mount definition in `.devcontainer/devcontainer.json`.
- **Verification**: `write_to_file` operation confirmed successful by the system. (2025-04-03 02:50:52)
- **Related Issues**: Related to previous dev container setup (DEVCONTAINER-SETUP-001) and state persistence goal (PERSISTENCE-001).



### Issue: DEVCONTAINER-PERM-001 - Permission denied for `/home/node/.vscode-server` volume mount (Attempt 2) - [Status: Resolved] - [2025-04-03 03:11:00]
- **Reported**: 2025-04-03 03:08:31 (Follow-up after initial fix failed) / **Severity**: Medium / **Symptoms**: User reported persistent `mkdir: cannot create directory '/home/node/.vscode-server/bin': Permission denied` error during container startup, even after adding `mkdir/chown` to `postCreateCommand`.
- **Investigation**: 
  1. Analyzed error log: The failure occurs during VS Code Server's internal setup (`mkdir -p '/home/node/.vscode-server/bin'`), indicating the `postCreateCommand` might run too late or concurrently.
  2. Decided to move the directory creation and ownership change into the `Dockerfile` build process.
  3. Added `RUN mkdir -p /home/node/.vscode-server && chown -R 1000:1000 /home/node/.vscode-server` to `Dockerfile`. (2025-04-03 03:09:42)
  4. Reverted the previous change to `postCreateCommand` in `.devcontainer/devcontainer.json`. (2025-04-03 03:10:02)
- **Root Cause**: The `postCreateCommand` executes after the container is created but potentially concurrently with or after VS Code Server attempts its initial setup within the mounted volume. Setting permissions during the Docker image build ensures they are correct *before* the container starts.
- **Fix Applied**: Added `RUN mkdir -p /home/node/.vscode-server && chown -R 1000:1000 /home/node/.vscode-server` to the `Dockerfile`. Reverted `postCreateCommand` in `.devcontainer/devcontainer.json`.
- **Verification**: `insert_content` and `apply_diff` operations confirmed successful by the system. Awaiting user confirmation after container rebuild.
- **Related Issues**: DEVCONTAINER-PERM-001 (Attempt 1), DEVCONTAINER-SETUP-001, PERSISTENCE-001.



### Issue: DB-SCHEMA-001 / SSL-001 - Type errors & SSL cert errors after schema change - [Status: Resolved] - [2025-04-02 06:17:00]
- **Reported**: 2025-04-02 06:07:45 / **Severity**: High / **Symptoms**: User reported schema changes (`themes`: `analytic_tradition`, `continental_tradition` to JSONB; `workshops`: `relevant_themes` to JSONB). Subsequent `npm run dev` resulted in `unable to get local issuer certificate` errors during data fetching.
- **Investigation**: 
  1. Updated `Theme` interface in `themes/page.tsx` (lines 12-13) to `string[] | null`. (2025-04-02 06:09:40)
  2. Updated `ThemeCardProps` and `renderList` in `ThemeCard.tsx` to handle `string[]`. (2025-04-02 06:09:53)
  3. Updated `Workshop` interface in `lib/data/workshops.ts` (line 9) to `string[] | null`. (2025-04-02 06:10:34)
  4. Updated `WorkshopCardProps` and added rendering logic for `relevantThemes` in `WorkshopCard.tsx`. (2025-04-02 06:11:04)
  5. Passed `relevantThemes` prop in `workshops/page.tsx`. (2025-04-02 06:11:31)
  6. Restarted dev server (`npm run dev` in `platform`) - Encountered SSL error. (2025-04-02 06:15:24)
  7. Confirmed with user to use `NODE_EXTRA_CA_CERTS`. (2025-04-02 06:15:47)
  8. Updated `dev` script in `platform/package.json` to include `NODE_EXTRA_CA_CERTS="/etc/ssl/certs/ca-certificates.crt"`. (2025-04-02 06:16:09)
  9. Restarted dev server (`npm run dev` in `platform`). (2025-04-02 06:17:04)
- **Root Cause**: TypeScript interfaces/components did not match the updated DB schema (JSONB arrays). Node.js environment lacked proper SSL certificate configuration for HTTPS requests to Supabase.
- **Fix Applied**: Updated TypeScript types (`Theme`, `Workshop`) and components (`ThemeCard`, `WorkshopCard`) to handle `string[]` for JSONB fields. Added `NODE_EXTRA_CA_CERTS` environment variable to `dev` script in `package.json`.
- **Verification**: User confirmed pages (`/themes`, `/workshops`, `/faq`) load correctly and data is populated without type or SSL errors. (2025-04-02 06:17:04)
- **Related Issues**: None identified.


### Issue: DEV-SERVER-001 - Next.js dev server unreachable/crashing - [Status: Resolved] - [2025-04-02 02:07:20]
- **Reported**: 2025-04-01 23:23:23 / **Severity**: High / **Symptoms**: User unable to connect to `http://localhost:3000`. Server process not running initially. Subsequent starts failed with Turbopack error, then PostCSS errors, then Tailwind theme function error, then CSS syntax error.
- **Investigation**: 
  1. Checked process list (`ps aux | grep '[n]ext dev'`) - No process running. (2025-04-02 01:54:40)
  2. Checked port 3000 (`ss -tulnp | grep ':3000'`) - Port free. (2025-04-02 01:54:57)
  3. Attempted start with Turbopack (`cd platform && npm run dev`) - Failed with Turbopack error. (2025-04-02 01:56:14)
  4. Examined `page.tsx`, `Hero.tsx`, `Countdown.tsx`, `EventHighlights.tsx`. Suspected `Countdown.tsx` or config issue. (2025-04-02 01:56:43 - 01:57:25)
  5. Modified `package.json` to remove `--turbopack`. (2025-04-02 01:57:42)
  6. Restarted server without Turbopack (`npm run dev` in `platform`) - Failed with PostCSS plugin error. (2025-04-02 02:02:09)
  7. Examined `postcss.config.js` - Found incorrect plugin name. (2025-04-02 02:02:17)
  8. Corrected `postcss.config.js` (`tailwindcss` -> `@tailwindcss/postcss`). (2025-04-02 02:02:36)
  9. Server restart attempt - Failed with Tailwind theme function error (`theme(fontFamily.philosopher)`). (2025-04-02 02:04:16)
  10. Examined `tailwind.config.ts` - Font definition correct. (2025-04-02 02:04:24)
  11. Examined `globals.css` - Found incorrect `@import "tailwindcss"`. (2025-04-02 02:04:41)
  12. Corrected `globals.css` (`@import` -> `@tailwind` directives). (2025-04-02 02:05:00)
  13. Server restart attempt - Failed with CSS syntax error (extra `}`). (2025-04-02 02:05:24)
  14. Corrected `globals.css` (removed extra `}`). (2025-04-02 02:05:59)
  15. Server restart - Successful compilation. (2025-04-02 02:06:23)
- **Root Cause**: Multiple configuration errors: Initial use of `--turbopack` likely incompatible; Incorrect PostCSS plugin name (`postcss.config.js`); Incorrect Tailwind import method (`globals.css`); CSS syntax error introduced during fixes.
- **Fix Applied**: Removed `--turbopack` flag; Corrected `postcss.config.js` plugin name; Replaced `@import` with `@tailwind` directives in `globals.css`; Removed extraneous `}` from `globals.css`.
- **Verification**: Server compiled successfully and responded with 200 OK after final fix. (2025-04-02 02:06:23)
- **Related Issues**: None identified.


## Recurring Bug Patterns
<!-- Append new patterns using the format below -->

## Environment-Specific Notes
<!-- Append environment notes using the format below -->

## Performance Observations
<!-- Append performance notes using the format below -->

## Debugging Tools & Techniques
<!-- Append tool notes using the format below -->