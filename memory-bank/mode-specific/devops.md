# DevOps Specific Memory

## Deployment History Log
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