# DevOps Specific Memory

### Git Commit: [2025-04-24 16:07:12] - chore: Archive obsolete V1/V2 documentation
- **Branch**: feature/registration-v3.1-impl
- **Commit ID**: 03c4c02
- **Files**:
  - `docs/project_specifications.md` -> `docs/archive/project_specifications.md`
  - `docs/project_specifications_v2.md` -> `docs/archive/project_specifications_v2.md`
  - `docs/architecture/terminal_component_v1.md` -> `docs/archive/terminal_component_v1.md`
  - `docs/specs/p0_registration_spec.md` -> `docs/archive/p0_registration_spec.md`
- **Notes**: Archived obsolete documentation files as recommended by holistic review (`docs/reviews/holistic_review_20250424.md`).


### Git Commit: [2025-04-26 03:09:26] - feat(db): Update registrations table schema and RLS for incremental saves
- **Branch**: feature/registration-v3.1-impl
- **Commit ID**: c47f33a
- **Files**: `supabase/migrations/20250426054315_update_registrations_for_incremental.sql`
- **Notes**: Committed migration to update registrations table schema and RLS for incremental saves per ADR `2025-04-26`.



### Deployment: [2025-04-26 03:09:15] - Supabase Migration (Update Registrations Table V3.1)
- **Env**: Remote DB (`egdmaehmjuytscswybum`)
- **Comps**: `registrations` table schema, `upsert_registration_answer` function, RLS policies
- **Version**: Migration `20250426054315_update_registrations_for_incremental.sql`
- **Trigger**: Manual (`supabase db push`)
- **Status**: Success
- **Duration**: ~2 min (across multiple attempts)
- **Rollback**: `supabase db reset` (destructive) or manual `ALTER TABLE`, `DROP FUNCTION`, `DROP POLICY`
- **Issues Encountered**: Initial attempts failed due to SSL error and migration history mismatch. History repaired (`migration repair --status reverted 20250421165124`). Subsequent attempt failed due to SQL syntax error (`RAISE NOTICE`). Final attempt succeeded after removing standalone `RAISE NOTICE` and fixing RLS policy syntax (`role::text`).
- **Notes**: Aligned `registrations` table with simplified ADR requirements.



## Deployment History Log
### Git Branch Creation: [2025-04-23 10:24:44] - feature/registration-v3.1-impl
- **Source Branch**: main
- **Triggered By**: User Request
- **Status**: Success
- **Notes**: Created new feature branch for Phase 3.1/3.2 implementation (Registration V3.1, Core Terminal V2, P0 Foundation) as per `docs/plans/phase_3_plan.md`. Branch pushed to origin.


### Git Commit: [2025-04-22 12:26:44] - docs: Add theme description for 'Meaning in AI World'
- **Branch**: feature/theme-updates
- **Commit ID**: e74ae95
- **Files**: `platform/markdown/themes/meaning-in-ai-world.md`
- **Notes**: Committed the new theme markdown file created by docs-writer mode.


### Git Commit: [2025-04-22 11:22:36] - feat(db): Enable RLS and define policies for core tables
- **Branch**: feature/rls-fixes
- **Commit ID**: 6ebede1
- **Files**: `supabase/migrations/20250422151859_enable_rls_core_tables.sql`
- **Notes**: Committed migration file after applying RLS policies to schedule_items, event_details, profiles, and registrations.


### Deployment: [2025-04-22 11:22:27] - Supabase Migration (Enable RLS Core Tables)
- **Env**: Remote DB (`egdmaehmjuytscswybum`)
- **Comps**: RLS Policies for `schedule_items`, `event_details`, `profiles`, `registrations`
- **Version**: Migration `20250422151859_enable_rls_core_tables.sql`
- **Trigger**: Manual (`supabase db push`)
- **Status**: Success
- **Duration**: ~3 min (incl. history repair)
- **Rollback**: `supabase db reset` (if needed, destructive) or manual `DROP POLICY` / `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`
- **Issues Encountered**: Initial push failed due to migration history mismatch. Repaired using `supabase migration repair --status reverted 20250422113204` and `supabase migration repair --status applied 20250422151859` before successful push.
- **Notes**: Applied RLS policies as defined in the migration file.


### Git Commit: [2025-04-21 19:07:49] - chore: Prepare feat/architecture-v2 for PR
- **Branch**: feat/architecture-v2
- **Commit ID**: 50f9337 (Merge commit after pulling main)
- **Files**: N/A (Merge commit)
- **Notes**: Merged origin/main into feat/architecture-v2 and pushed branch to origin in preparation for PR.

### Git Commit: [2025-04-21 19:03:45] - chore: Update Memory Bank files
- **Branch**: feat/architecture-v2
- **Commit ID**: f7b875d
- **Files**: `memory-bank/mode-specific/devops.md`, `memory-bank/mode-specific/sparc.md`
- **Notes**: Committed Memory Bank updates before preparing branch for PR.


### Git Commit: [2025-04-21 18:55:46] - feat: Create interest_signups table and RLS policies
- **Branch**: feat/architecture-v2
- **Commit ID**: 6e92ded
- **Files**: `supabase/migrations/20250421225316_create_interest_signups_table.sql`
- **Notes**: Committed the new migration file for the interest_signups table.


### Deployment: [2025-04-21 18:55:29] - Supabase Migration (Create `interest_signups`)
- **Env**: Remote DB (`egdmaehmjuytscswybum`)
- **Comps**: `interest_signups` table
- **Version**: Migration `20250421225316_create_interest_signups_table.sql`
- **Trigger**: Manual (`supabase db push`)
- **Status**: Success
- **Duration**: ~1 min
- **Rollback**: `supabase db reset` (if needed, destructive)
- **Notes**: Created the `interest_signups` table with columns (id, email, created_at) and basic RLS (public insert, service_role all).



### Git Commit: [2025-04-21 16:36:00] - docs(spec): Update V3.1 reg spec for confirmation state & existing user flow
- **Branch**: feat/architecture-v2
- **Commit ID**: 8062e37
- **Files**: `docs/specs/p0_registration_terminal_ui_spec_v2.md`
- **Notes**: Committed updates to the V3.1 registration specification to define the `awaiting_confirmation` state and the flow for handling existing users during `register new`.



### Script Execution: [2025-04-21 12:16:18] - npm run generate:reg (Attempt 2)
- **Branch**: feat/architecture-v2
- **Triggered By**: Manual (DevOps Task)
- **Status**: Script Success, Verification Failed
- **Duration**: ~3s
- **Commit/Build ID**: N/A (No commit)
- **Changes**: Generated `platform/src/app/register/data/registrationQuestions.ts`, `platform/src/app/register/actions.ts`, `supabase/migrations/20250421161618_update_registrations_table_generated.sql`
- **Issues Encountered**: Verification of `registrationQuestions.ts` revealed incomplete `Question` interface (missing `hint`, `description`, `validationRules`).
- **Rollback Plan**: N/A (No commit)


### Git Commit: [2025-04-21 05:59:00] - feat(register): Generate registration files from V3.1 schema
- **Branch**: feat/architecture-v2
- **Commit ID**: 7a28f30
- **Files**: `platform/src/app/register/data/registrationQuestions.ts`, `platform/src/app/register/actions.ts`, `supabase/migrations/20250421095802_update_registrations_table_generated.sql`
- **Notes**: Committed files generated by `npm run generate:reg` after updating SSOT config to V3.1 spec.


### Git Commit: [2025-04-20 13:19:39] - feat(docs): Upgrade theme descriptions and add suggested readings
- **Branch**: feature/architecture-v2
- **Commit ID**: e3514e4
- **Files**: `docs/event_info/themes/*.md` (7 files)
- **Notes**: Committed upgraded theme descriptions with suggested readings, as generated by docs-writer mode.


### Deployment: [2025-04-19 14:53:22] - Supabase Migrations (Create `event_details`, `profiles`, `registrations`)
- **Env**: Remote DB (`egdmaehmjuytscswybum`)
- **Comps**: `event_details`, `profiles`, `registrations` tables; `attendance_option`, `working_style`, `mentorship_role`, `referral_source` ENUMs
- **Version**: Migrations `...181821`, `...181847`, `...183246`
- **Trigger**: Manual (`supabase db push`)
- **Status**: Success
- **Duration**: ~10 min (incl. spec checks, error correction)
- **Rollback**: `supabase db reset` (if needed, destructive)
- **Notes**: Created base tables as per specs v1.1. Excluded RLS/triggers/FKs for initial creation. Corrected `registrations` migration from ALTER to CREATE.


### Deployment: [2025-04-19 14:04:28] - Supabase Migration (Create `schedule_items`)
- **Env**: Remote DB (`egdmaehmjuytscswybum`)
- **Comps**: `schedule_items` table
- **Version**: Migration `20250419175905_create_schedule_items_table.sql`
- **Trigger**: Manual (`supabase db push`)
- **Status**: Success
- **Duration**: ~1 min (incl. troubleshooting)
- **Rollback**: `supabase db reset` (if needed, destructive)
- **Notes**: Initial push failed due to RLS dependency on non-existent `profiles` table and missing `moddatetime` function. Removed RLS and trigger from migration for successful push. These need to be added in separate, later migrations.


### Git Commit: [2025-04-20 09:44:08] - chore(docs): Archive original consolidated theme descriptions
- **Branch**: feature/architecture-v2
- **Commit ID**: 4567b43
- **Files**: docs/event_info/theme_descriptions_expanded.md -> docs/event_info/theme_descriptions_expanded.md.archived
- **Notes**: Archived original consolidated theme descriptions file after content splitting (commit 7bca2b5).


### Git Commit: [2025-04-19 14:54:46] - feat(db): Create event_details, profiles, and registrations tables
- **Branch**: feat/architecture-v2
- **Commit ID**: 0ec7f01
- **Files**: `supabase/migrations/20250419181821_create_event_details_table.sql`, `supabase/migrations/20250419181847_create_profiles_table.sql`, `supabase/migrations/20250419183246_extend_registrations_table.sql`
- **Notes**: Committed migrations after successful push.


### Git Commit: [2025-04-19 05:22:35] - feat(spec): Draft P0 specifications (RBAC, Registration, Content Mgmt)
- **Branch**: feature/architecture-v2
- **Commit ID**: 3ff6f14 (from git output)
- **Files**: `docs/specs/p0_rbac_spec.md`, `docs/specs/p0_registration_spec.md`, `docs/specs/p0_content_mgmt_spec.md`
- **Notes**: Committed initial drafts of P0 feature specifications.


### Git Commit: [2025-04-19 14:03:58] - feat(db): Create schedule_items table
- **Branch**: feat/architecture-v2
- **Commit ID**: f48a9cc
- **Files**: `supabase/migrations/20250419175905_create_schedule_items_table.sql`
- **Notes**: Committed migration file after successful push.


<!-- Append deployment details using the format below -->
<!-- ### Deployment: [YYYY-MM-DD HH:MM:SS] -->
<!-- - **Env**: [Staging/Prod] / **Comps**: [List/All] / **Version**: [ID] / **Trigger**: [Manual/CI] / **Status**: [Success/Fail/Rollback] / **Duration**: [time] / **Rollback**: [ID] / **Notes**: [link/details] -->

### Git Workflow Best Practice: Integrating `main` into Feature Branches (2025-04-19 15:49:00)
- **Context**: Preparing feature branch for Pull Request (GitHub Flow).
- **Recommendation**: Best practice is typically to update the local feature branch from `main` *before* creating the PR.
- **Methods**:
    - **Merge (`git pull origin main --no-rebase`):** Recommended. Fetches `main` and merges it into the feature branch locally, creating a merge commit. Keeps history clear, resolves conflicts locally before PR, safer as it doesn't rewrite history.
    - **Rebase (`git pull origin main --rebase`):** Fetches `main` and replays feature commits on top. Creates linear history but rewrites feature branch history (requires force push, riskier if shared).
    - **Handle in PR:** Create PR without local update. Conflicts resolved during PR review (GitHub UI or locally after pulling `main`). Simpler initial PR, but diff can be messier, conflicts resolved later.
- **Decision**: User opted to handle potential merge conflicts within the GitHub PR process for `feat/architecture-v2`.


## Infrastructure Configuration Overview
<!-- Append infra config details using the format below -->
<!-- ### Infra Config: [Env] - [Component] - [YYYY-MM-DD HH:MM:SS] -->
<!-- - **Provider**: [AWS/GCP/Vercel] / **Region**: [id] / **Version**: [e.g., EKS 1.28] / **Config**: [Key details] / **ManagedBy**: [IaC/Manual/Platform] / **IaC Link**: [`path`] -->

## Environment Registry
<!-- Append environment details using the format below -->
<!-- ### Environment: [Name] - [YYYY-MM-DD HH:MM:SS] -->
<!-- - **Purpose**: [desc] / **URL**: [url] / **Access**: [VPN/Public] / **Services**: [list] / **Data**: [Ephemeral/Persistent] / **Status**: [Active/Maint] / **Owner**: [Team] -->

## CI/CD Pipeline Documentation
<!-- Append pipeline details using the format below -->
<!-- ### Pipeline: [Name] - [YYYY-MM-DD HH:MM:SS] -->
<!-- - **Tool**: [GitHub Actions/Vercel] / **Trigger**: [Push/Tag/PR] / **Repo**: [link] / **Workflow**: [`path`/Platform] / **Stages**: [Build>Test>Scan>Deploy] / **Vars**: [Non-secret] -->

#### Secrets Management Strategy (Updated: 2025-04-03 16:28:00)
- **Tool**: Vercel Environment Variables
- **Access Control**: Managed via Vercel project settings/team permissions.
- **Rotation Policy**: Manual rotation via Supabase dashboard and update in Vercel.
- **Injection Method**: Vercel injects variables into the build and runtime environment.
- **Auditing**: Vercel audit logs (if available on the plan).
## Secrets Management Strategy
<!-- Update strategy notes here -->
<!-- #### Secrets Management Strategy (Updated: [YYYY-MM-DD HH:MM:SS]) -->
<!-- - **Tool**: [e.g., HashiCorp Vault, AWS Secrets Manager, Vercel Env Vars] -->
<!-- - **Access Control**: [How access is granted] -->
<!-- - **Rotation Policy**: [Frequency and method] -->
<!-- - **Injection Method**: [How secrets are provided] -->
<!-- - **Auditing**: [How access/changes are logged] -->