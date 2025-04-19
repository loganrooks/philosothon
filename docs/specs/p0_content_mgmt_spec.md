# P0 Feature Specification: Content Management

**Version:** 1.0
**Date:** 2025-04-19
**Status:** Draft

## 1. Overview

This document specifies the functional requirements and implementation details for the enhanced Content Management system for the Philosothon Platform V2, focusing on Priority 0 (P0) features. It covers the management of core event information and expanded theme descriptions. It builds upon Requirement 3.3 in `docs/project_specifications_v2.md` and the decisions outlined in `memory-bank/adr/2025-04-19-v2-content-management.md`.

## 2. Functional Requirements

### 2.1. Core Event Information Management (Req 3.3.1)

*   **FR-CM-001:** Core event information (dates, times, location, deadlines, general descriptions) shall be stored in a structured format within the Supabase database.
*   **FR-CM-002:** A dedicated table (e.g., `event_details`) shall store global event settings like start/end dates, location, primary contact email, etc. This table likely contains only one row.
*   **FR-CM-003:** A dedicated table (e.g., `schedule_items`) shall store individual schedule items, including date, start time, end time, title, description, and potentially location/speaker.
*   **FR-CM-004:** An administrative interface must be provided within the `/admin` section for authorized users (`admin` role) to perform CRUD (Create, Read, Update, Delete) operations on `event_details` and `schedule_items`.
    *   *Implementation Note:* This requires new routes, forms, and Server Actions within the admin section (e.g., `/admin/schedule`, `/admin/settings`).
*   **FR-CM-005:** Frontend components (e.g., `Countdown`, `ScheduleDisplay`, `EventHighlights`) must fetch and display data from these new Supabase tables instead of relying on hardcoded values or separate Markdown files.

### 2.2. Expanded Theme Content Management (Req 3.3.2)

*   **FR-CM-006:** The existing `themes` table in Supabase shall be extended with a new column named `description_expanded` of type `text`.
*   **FR-CM-007:** The `description_expanded` column shall store detailed theme descriptions formatted as Markdown.
*   **FR-CM-008:** The administrative interface for managing themes (`/admin/themes/edit`, `/admin/themes/new`) must include a multi-line textarea input field bound to the `description_expanded` column.
    *   *Enhancement (Optional):* Consider adding a client-side Markdown preview pane next to the textarea in the admin form for better usability.
*   **FR-CM-009:** The Server Actions (`createTheme`, `updateTheme`) must handle saving the Markdown content from the textarea into the `description_expanded` column.
*   **FR-CM-010:** The dynamic theme detail page (`/themes/[id]`) must fetch the `description_expanded` Markdown string from the `themes` table for the corresponding theme.
*   **FR-CM-011:** The theme detail page must use a Markdown rendering library (e.g., `react-markdown`) to parse the `description_expanded` string and render it as HTML.
*   **FR-CM-012:** Appropriate styling (e.g., using `@tailwindcss/typography` via `prose prose-invert` classes) must be applied to the container rendering the Markdown HTML to ensure correct formatting of headings, paragraphs, lists, etc.

### 2.3. FAQ Management (Req 3.3.3)

*   **FR-CM-013:** The existing system for managing FAQs via the `/admin/faq` interface and storing data in the `faq_items` table shall be retained as is for P0.

## 3. Implementation Details & Pseudocode

### 3.1. Data Models

*   **`event_details` Table (New):**
    ```sql
    -- Example Structure (Adapt as needed)
    CREATE TABLE event_details (
      id INT PRIMARY KEY DEFAULT 1, -- Singleton table
      event_name TEXT NOT NULL DEFAULT 'Philosothon',
      start_date TIMESTAMPTZ,
      end_date TIMESTAMPTZ,
      location TEXT,
      registration_deadline TIMESTAMPTZ,
      submission_deadline TIMESTAMPTZ,
      contact_email TEXT,
      -- Add other global settings as needed
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
    -- Enable RLS, Allow admin ALL, Allow authenticated READ
    ALTER TABLE event_details ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow admin access" ON event_details FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    CREATE POLICY "Allow authenticated read" ON event_details FOR SELECT USING (auth.role() = 'authenticated');
    -- Trigger for updated_at
    CREATE TRIGGER handle_updated_at BEFORE UPDATE ON event_details FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
    -- Insert the single row
    INSERT INTO event_details (id) VALUES (1);
    ```
    *   *TDD Anchors:* Test RLS policies for admin (CRUD) and authenticated users (Read). Test data fetching.
*   **`schedule_items` Table (New):**
    ```sql
    CREATE TABLE schedule_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      item_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME, -- Optional
      title TEXT NOT NULL,
      description TEXT,
      location TEXT,
      speaker TEXT,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
    -- Add index for sorting/filtering
    CREATE INDEX idx_schedule_items_datetime ON schedule_items (item_date, start_time);
    -- Enable RLS, Allow admin ALL, Allow authenticated READ
    ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow admin access" ON schedule_items FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    CREATE POLICY "Allow authenticated read" ON schedule_items FOR SELECT USING (auth.role() = 'authenticated');
    -- Trigger for updated_at
    CREATE TRIGGER handle_updated_at BEFORE UPDATE ON schedule_items FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
    ```
    *   *TDD Anchors:* Test RLS policies. Test CRUD operations via Server Actions. Test data fetching and ordering.
*   **`themes` Table (Modification):**
    ```sql
    -- Add the new column
    ALTER TABLE themes
      ADD COLUMN description_expanded TEXT;

    -- Ensure RLS policies allow admin updates and authenticated reads for the new column
    -- (Assuming existing policies need adjustment or are sufficient)
    -- Example: Update admin policy if needed
    -- DROP POLICY "Allow admin modification" ON themes; -- If exists
    -- CREATE POLICY "Allow admin modification" ON themes FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    ```
    *   *TDD Anchors:* Test `updateTheme` Server Action saves `description_expanded`. Test theme detail page fetches the new column.

### 3.2. Admin Interface Components

*   **Event Settings Form (`/admin/settings/components/SettingsForm.tsx` - Conceptual):**
    *   Fetches the single row from `event_details`.
    *   Displays input fields for each setting (start_date, end_date, location, etc.).
    *   Uses `useFormState` and a Server Action (`updateEventSettings`) for submission.
    *   *Pseudocode TBD.*
    *   *TDD Anchors:* Test form rendering with initial data. Test input changes. Test Server Action call on submit. Test display of success/error messages.
*   **Schedule List/Form (`/admin/schedule/`, `/admin/schedule/edit`, `/admin/schedule/new` - Conceptual):**
    *   List page displays `schedule_items` (e.g., in a table), links to edit/new.
    *   New/Edit pages contain a form (`ScheduleForm.tsx`) with fields for `item_date`, `start_time`, `end_time`, `title`, `description`, etc.
    *   Uses `useFormState` and Server Actions (`createScheduleItem`, `updateScheduleItem`).
    *   Includes a delete button calling `deleteScheduleItem` Server Action (with confirmation).
    *   *Pseudocode TBD - follows pattern of existing admin CRUD.*
    *   *TDD Anchors:* Test list rendering. Test form rendering (new/edit). Test Server Action calls (create, update, delete). Test validation. Test redirection.
*   **Theme Form (`/admin/themes/components/ThemeForm.tsx` - Modification):**
    *   Add a `textarea` element bound to the `description_expanded` field.
    *   Ensure the `updateTheme` and `createTheme` Server Actions handle this new field.
    ```typescript
    // Conceptual addition to ThemeForm.tsx
    <div>
      <label htmlFor="description_expanded">Expanded Description (Markdown)</label>
      <textarea
        id="description_expanded"
        name="description_expanded"
        rows={10}
        defaultValue={theme?.description_expanded || ''} // Populate if editing
      />
      {/* Display validation errors: state.errors?.description_expanded */}
      {/* Optional Markdown Preview Component Here */}
    </div>
    ```
    *   *TDD Anchors:* Test textarea renders with default value. Test Server Actions correctly receive and save the textarea content.

### 3.3. Server Actions (New/Modified)

*   **`updateEventSettings` (`/admin/settings/actions.ts` - Conceptual):**
    *   Receives form data.
    *   Validates data (e.g., dates are valid).
    *   Updates the single row in `event_details`.
    *   Handles errors and returns state for `useFormState`.
    *   Revalidates relevant paths.
    *   *Pseudocode TBD.*
    *   *TDD Anchors:* Test validation. Test Supabase update call. Test error handling. Test revalidation.
*   **`createScheduleItem`, `updateScheduleItem`, `deleteScheduleItem` (`/admin/schedule/actions.ts` - Conceptual):**
    *   Follow the standard pattern established in `themes/actions.ts`, `faq/actions.ts`.
    *   Perform validation (Zod schema).
    *   Interact with `schedule_items` table in Supabase.
    *   Handle errors, return state, revalidate paths, redirect as needed.
    *   *Pseudocode TBD.*
    *   *TDD Anchors:* Test validation. Test Supabase calls (insert, update, delete). Test error handling. Test revalidation/redirects.
*   **`createTheme`, `updateTheme` (`/admin/themes/actions.ts` - Modification):**
    *   Update Zod schema to include `description_expanded: z.string().optional()`.
    *   Ensure `validatedFields.data` includes `description_expanded` when preparing data for Supabase insert/update.
    *   *TDD Anchors:* Test that `description_expanded` is correctly included in data passed to Supabase client.

### 3.4. Frontend Rendering

*   **Theme Detail Page (`/themes/[id]/page.tsx` - Modification):**
    *   Ensure `getStaticProps` (or equivalent data fetching method) selects `description_expanded` from the `themes` table.
    *   Pass `theme.description_expanded` to the page component.
    *   Use `react-markdown` to render the content.
    ```typescript
    // Conceptual rendering part in ThemeDetailPage component
    import ReactMarkdown from 'react-markdown';
    // Potentially add remark-gfm for GitHub Flavored Markdown support
    // import remarkGfm from 'remark-gfm';

    // ... inside component ...
    {theme.description_expanded && (
      <div className="prose prose-invert max-w-none"> {/* Apply Tailwind Typography */}
        {/* TDD: Test that ReactMarkdown is rendered when description_expanded exists. */}
        {/* TDD: Test that the container div has 'prose' classes. */}
        <ReactMarkdown
          // remarkPlugins={[remarkGfm]} // Optional: Add plugins if needed
        >
          {theme.description_expanded}
        </ReactMarkdown>
      </div>
    )}
    // TDD: Test that nothing is rendered for this section if description_expanded is null/empty.
    ```
*   **Schedule Display Component (`src/components/ScheduleDisplay.tsx` - Conceptual):**
    *   Fetches data from `schedule_items` table, ordered by date and time.
    *   Groups items by date.
    *   Renders the schedule in a user-friendly format (e.g., list, table).
    *   *Pseudocode TBD.*
    *   *TDD Anchors:* Test data fetching and ordering. Test rendering logic for different schedule items. Test grouping by date.

## 4. TDD Anchors Summary

*   **Data Models (`event_details`, `schedule_items`, `themes`):**
    *   Test RLS policies for each table ensure correct permissions (Admin CRUD, Authenticated Read).
    *   Test `updated_at` triggers function correctly.
*   **Admin Components (SettingsForm, ScheduleForm, ThemeForm):**
    *   Test forms render correctly with initial data (for edit).
    *   Test form inputs update state/values correctly.
    *   Test Server Actions are called on submit.
    *   Test display of success/error messages from Server Actions.
*   **Server Actions (Event Settings, Schedule CRUD, Theme CRUD):**
    *   Test input validation (Zod schemas).
    *   Test successful Supabase operations (insert, update, delete).
    *   Test error handling for Supabase operations.
    *   Test `revalidatePath` and `redirect` calls occur correctly.
    *   Test `description_expanded` is handled correctly in Theme actions.
*   **Frontend Rendering (Theme Detail Page, Schedule Display):**
    *   Test data fetching selects the required columns (`description_expanded`, schedule fields).
    *   Test `ReactMarkdown` component is used and renders content when `description_expanded` is present.
    *   Test Tailwind `prose` classes are applied to the Markdown container.
    *   Test schedule component renders data correctly, ordered and grouped.

## 5. Open Questions / TBD

*   Specific UI design for the new admin sections (Event Settings, Schedule Management).
*   Need for more complex validation rules for schedule items (e.g., end time after start time).
*   Specific UI design for the schedule display on the frontend.
*   Implementation details for the optional Markdown preview in the admin theme form.