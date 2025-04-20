# Analysis of Registration System & Question Synchronization Strategy Proposal

**1. Analysis of Current Implementation**

Based on the review of `platform/src/app/register/components/RegistrationForm.tsx`, `platform/src/app/register/data/registrationQuestions.ts`, `platform/src/app/register/actions.ts`, and `supabase/migrations/20250419183246_extend_registrations_table.sql`, the current handling of registration questions across layers is as follows:

*   **Frontend Display (`RegistrationForm.tsx` & `registrationQuestions.ts`):**
    *   Questions are defined as an array of `Question` objects in `registrationQuestions.ts`. Each object contains an `id`, `label`, `type`, `required` status, validation function (`validation`), options, and dependency logic (`dependsOn`, `dependsValue`).
    *   The `RegistrationForm.tsx` component imports this array and iterates through it using state (`currentQuestionIndex`) to display questions sequentially in a terminal-style UI.
    *   Input is collected via a single text input field.
    *   Basic validation (required check, custom validation function from the definition) and type processing (e.g., `parseInt`, boolean conversion, comma-separated lists) are handled within the component's `handleSubmit` function *after* receiving input.
    *   Answers are stored locally using `useLocalStorage` and keyed by the `id` from the question definition.

*   **Backend Validation (`actions.ts`):**
    *   A `RegistrationSchema` is defined using Zod, mirroring the structure defined in `registrationQuestions.ts`.
    *   This schema applies comprehensive validation rules (e.g., `min`, `max`, `email`, `enum`, `array`, type coercion, transforms for JSON/arrays, custom `refine` logic).
    *   The `createRegistration` Server Action receives `FormData`, performs some pre-processing (handling potential array inputs), validates the processed data against the `RegistrationSchema`, and then passes the validated data to a Data Access Layer (DAL) function (`insertRegistration`).

*   **Database Storage (`extend_registrations_table.sql`):**
    *   The `registrations` table schema is defined via a SQL migration file.
    *   Columns in the table directly correspond to the question `id`s.
    *   Specific SQL data types (`TEXT`, `INTEGER`, `BOOLEAN`, `TEXT[]`, `JSONB`, custom `ENUM`s) and constraints (`NOT NULL`, `CHECK`) are used.

**Manual Synchronization Points & Potential Failures:**

The current setup requires manual synchronization across these three layers whenever a question is added, removed, or modified. Key failure points include:

1.  **Multiple Edits:** Changes require editing `registrationQuestions.ts` (definition + `FormDataStore` type), `actions.ts` (Zod schema + potentially `RegistrationInput` type), and creating/editing a SQL migration file. Missing any step leads to inconsistency.
2.  **Type Mismatches:** Ensuring the frontend `type`, Zod schema type (`z.string`, `z.coerce.number`, etc.), and SQL column type (`TEXT`, `INTEGER`, `JSONB`, etc.) align is manual and error-prone.
3.  **Validation Divergence:** Validation logic exists in the frontend component (basic), the Zod schema (comprehensive), and SQL constraints. Keeping these aligned requires careful manual updates.
4.  **ID/Key Consistency:** Typos or mismatches between the question `id`, Zod schema key, and SQL column name will break data flow.
5.  **ENUM Definitions:** ENUM types (e.g., `attendance_option`) must be defined and updated in both the SQL migration and the Zod schema (`z.enum`).
6.  **Complex Field Handling:** Fields requiring specific parsing (comma-separated lists) or storage types (JSONB for rankings) need coordinated implementation across layers.

**2. Proposed Synchronization Strategies**

*   **Strategy 1: Single Source of Truth (SSOT) with Code Generation**
    *   **Concept:** Define all aspects of each registration question (ID, label, abstract type, validation rules, DB type hint, options, dependencies) in a single, central configuration file (e.g., `config/registrationSchema.ts` or JSON/YAML).
    *   **Process:** A dedicated script (e.g., `scripts/generate-registration.ts`) reads this central definition and automatically generates/overwrites:
        1.  `platform/src/app/register/data/registrationQuestions.ts` (frontend question array and `FormDataStore` type).
        2.  `platform/src/app/register/actions.ts` (the Zod `RegistrationSchema`).
        3.  A *draft* SQL migration file (`supabase/migrations/YYYYMMDDHHMMSS_update_registration_schema.sql`) containing necessary `ALTER TABLE` or `CREATE TYPE` statements for review and execution.
    *   **Pros:** Ensures consistency by deriving all representations from one source, significantly simplifies adding/modifying questions for developers, reduces manual errors, leverages TypeScript for type safety in generated files.
    *   **Cons:** Requires initial effort to create and maintain the generation script, adds a build/generation step to the workflow, automatic SQL migration generation can be complex (drafting + review is more practical).

*   **Strategy 2: Database-Driven Definitions**
    *   **Concept:** Store question definitions in dedicated Supabase tables.
    *   **Process:** The frontend fetches definitions to render the form. The backend fetches definitions to perform validation (either dynamically building a schema or checking rules directly).
    *   **Pros:** Allows dynamic question updates potentially without code deployment (if managed via an admin UI), centralizes definitions within the DB.
    *   **Cons:** **Critically, this does *not* solve the `registrations` table schema synchronization problem**, which remains manual. Dynamic backend validation is complex and potentially less robust/performant than static Zod schemas. Adds DB overhead and complexity.

**3. Recommendation**

**Strategy 1 (SSOT with Code Generation) is strongly recommended.** It directly addresses the core requirement of keeping the question representation synchronized across the frontend code, backend validation code, and database schema structure. The reduction in manual effort and potential for errors during modification outweighs the initial setup cost of the generation script. Generating draft SQL migrations provides a practical balance between automation and safety.

**4. Assessment of Planned Redesign Impact**

*   **Terminal UI Redesign (Modes, Commands):** The SSOT strategy is largely decoupled from the specific UI implementation. The generated `registrationQuestions.ts` will still serve as the data source for the questions, regardless of how the terminal UI manages state or processes commands. The `RegistrationForm.tsx` component itself will likely require significant refactoring or replacement to implement the new features, but the underlying question data source remains valid.
*   **Password Authentication:** This represents a significant architectural change impacting the authentication flow currently integrated into the `createRegistration` action (`actions.ts`).
    *   **Impact:** The logic for user sign-up/sign-in within `actions.ts` (currently using Supabase OTP/Magic Link) will need substantial modification to accommodate password-based auth. This might involve separating the authentication step entirely, requiring users to log in *before* accessing the registration form.
    *   **Interaction:** While the SSOT strategy itself isn't directly affected, the code consuming the generated artifacts (specifically `actions.ts`) will need major updates to align with the new authentication mechanism. The Zod schema generated for registration data remains relevant, but how user identity (`user_id`) is obtained and linked will change.

**5. Conclusion**

The current registration system relies on manual synchronization, making question modifications error-prone. Adopting a Single Source of Truth (SSOT) approach with a code generation script is the recommended strategy to ensure consistency across the frontend definitions, backend Zod validation schema, and database schema migrations. While the planned terminal UI redesign is mostly independent, the introduction of password authentication will require significant changes to the user handling logic within the `createRegistration` server action.