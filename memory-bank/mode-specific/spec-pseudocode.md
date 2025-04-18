# Specification Writer Specific Memory

## Functional Requirements
### Feature: Admin Section Rebuild (CRUD for Themes, Workshops, FAQs)
- Added: [2025-04-18 07:35:00]
- Description: Rebuild the admin section (/admin) to allow authenticated users (via Supabase Magic Link) to perform Create, Read, Update, and Delete operations on Themes, Workshops, and FAQ items stored in the Supabase database.
- Acceptance criteria: 1. Login via Magic Link works. 2. /admin routes are protected. 3. List views display data correctly. 4. Add forms create new items. 5. Edit forms update existing items. 6. Delete actions remove items (with confirmation). 7. Routing uses single edit pages + Server Actions.
- Dependencies: Supabase DB (themes, workshops, faq_items tables), @supabase/ssr, Next.js App Router, React.
- Status: Specified


<!-- Append new requirements using the format below -->
### Feature: RAG Markdown Optimization Script
- Added: 2025-04-17 22:57:00
- Description: A Python script that optimizes Markdown files in a specified directory for RAG (Retrieval-Augmented Generation) by simplifying citations and footnotes while preserving the references section.
- Acceptance criteria: 1. Script accepts a directory path. 2. Recursively finds all .md files. 3. Replaces `(Author, [Year](URL "Full Citation"))` with `(Author, Year)`. 4. Replaces `[Footnote N](#FnN)` with `[Footnote N]`. 5. Identifies and preserves content from "## References" (or similar heading) onwards. 6. Modifies files in-place. 7. Provides logging of processed files and errors. 8. Outputs a summary report.
- Dependencies: Python 3.x, standard libraries (os, re, logging, argparse).
- Status: Specified

### Feature: Dynamic Theme Detail Pages
- Added: 2025-04-02 12:13:26
- Description: Create dynamic pages for each theme at `/themes/[themeId]` displaying detailed information including title, description, philosopher lists (parsed from markdown), and suggested readings (from DB).
- Acceptance criteria: 1. Page exists for each theme ID. 2. Displays correct title, description, philosopher lists (Analytic/Continental), and suggested readings. 3. Handles missing themes (404). 4. Handles missing suggested readings gracefully. 5. Uses SSG (`getStaticPaths`/`getStaticProps`).
- Dependencies: `themes` table in DB (id, title, description, suggested_readings), `docs/event_info/theme_descriptions.md` file, `parseThemeMarkdown` utility.
- Status: Draft

### Feature: Theme Description Revamp
- Added: 2025-04-02 12:13:26
- Updated: 2025-04-02 12:15:44
- Description: Outline and potentially execute a process to improve theme descriptions stored in the database, ensuring the new descriptions are informed by the broader event context.
- Acceptance criteria: 1. Process documented. 2. Process includes reading relevant context docs (`docs/event_info/*.md`, `docs/project_specifications.md`), fetching current data, generating new descriptions (external step), formulating SQL UPDATEs, and executing them.
- Dependencies: Access to Supabase DB, `docs/event_info/*.md` files, `docs/project_specifications.md`, external process/tool for description generation.
- Status: Draft

### Feature: Theme Card Enhancement
- Added: 2025-04-02 12:13:26
- Description: Add a "See More Details" link to each `ThemeCard` component, pointing to the corresponding dynamic theme detail page.
- Acceptance criteria: 1. Link exists on each card. 2. Link points to the correct `/themes/[themeId]` URL.
- Dependencies: `ThemeCard.tsx` component, `theme.id` property.
- Status: Draft

## System Constraints
### Constraint: Admin Edit Page Data Fetching
- Added: [2025-04-18 07:35:00]
- Description: Single edit pages (e.g., /admin/themes/edit) rely on a query parameter (`?id=...`) passed from the list view. The page component must correctly parse this ID and fetch the corresponding data.
- Impact: Incorrect ID parsing or missing parameter will prevent editing. Requires careful linking from list views and robust handling in the edit page component.
- Mitigation strategy: Ensure list views generate correct links. Edit page Server Component should validate the ID and handle cases where data isn't found (e.g., redirect, show error).

### Constraint: Server Action State Management
- Added: [2025-04-18 07:35:00]
- Description: Client components using Server Actions rely on mechanisms like `useFormState` to receive feedback (validation errors, success/failure status).
- Impact: Without proper state handling, users won't get feedback on form submissions.
- Mitigation strategy: Consistently use `useFormState` in forms calling Server Actions. Ensure Server Actions return clear status/error objects.


<!-- Append new constraints using the format below -->
### Constraint: RAG Optimizer - References Identifier
- Added: 2025-04-17 22:57:00
- Description: The script relies on specific heading patterns (e.g., `## References`, `References\n----------`, case-insensitive) to identify the start of the references section.
- Impact: Files with differently formatted reference sections might have their references incorrectly modified.
- Mitigation strategy: Clearly document the expected patterns. Consider adding more patterns or a configuration option if needed.

### Constraint: RAG Optimizer - File Encoding
- Added: 2025-04-17 22:57:00
- Description: The script assumes UTF-8 encoding for Markdown files.
- Impact: Processing files with different encodings might lead to errors or corrupted output.
- Mitigation strategy: Default to UTF-8, log errors if decoding fails. Could add an encoding parameter as an enhancement.

### Constraint: RAG Optimizer - Performance
- Added: 2025-04-17 22:57:00
- Description: Initial pseudocode reads the entire file content into memory, which might be inefficient for very large files.
- Impact: Potential high memory usage for large files.
- Mitigation strategy: Implement line-by-line or chunked processing if performance becomes a bottleneck in practice.

### Constraint: Theme Detail Page Data Sources
- Added: 2025-04-02 12:13:26
- Description: Theme detail pages require data from both the database (title, description, suggested readings) and a static markdown file (`theme_descriptions.md` for philosopher lists).
- Impact: Requires combining data sources in `getStaticProps`. Parsing logic for markdown is needed. Suggested readings must be added to the DB.
- Mitigation strategy: Implement robust markdown parsing (`parseThemeMarkdown`). Add `suggested_readings` column to `themes` table.

## Edge Cases
### Edge Case: Admin Edit - Invalid/Missing ID
- Identified: [2025-04-18 07:35:00]
- Scenario: User navigates directly to an edit URL (e.g., /admin/themes/edit) without an ID, or with an ID that doesn't exist in the database.
- Expected behavior: The edit page Server Component should detect the missing/invalid ID, handle the error gracefully (e.g., redirect to the list view, show a 'Not Found' message).
- Testing approach: Manual navigation test. Unit test the edit page's data fetching logic with invalid/missing IDs.

### Edge Case: Admin Delete - Race Condition/Stale Data
- Identified: [2025-04-18 07:35:00]
- Scenario: Two admins attempt to delete the same item simultaneously, or an admin tries to delete an item that was just modified.
- Expected behavior: The database operation should handle this (e.g., first delete succeeds, second fails). The UI should reflect the final state after revalidation.
- Testing approach: Difficult to automate reliably. Manual testing consideration. Ensure `revalidatePath` is used correctly.

### Edge Case: Admin Form Submission - Network Error
- Identified: [2025-04-18 07:35:00]
- Scenario: Network connection is lost while submitting a form via a Server Action.
- Expected behavior: The Server Action won't complete. The client form should ideally handle this (e.g., maintain input state, allow retry). `useFormState` might show a pending state indefinitely.
- Testing approach: Simulate network interruption in browser dev tools during manual testing.


<!-- Append new edge cases using the format below -->
### Edge Case: RAG Optimizer - Directory Not Found
- Identified: 2025-04-17 22:57:00
- Scenario: The input directory path provided to the script does not exist or is inaccessible.
- Expected behavior: Log a critical error and exit gracefully.
- Testing approach: Run script with an invalid path.

### Edge Case: RAG Optimizer - No Markdown Files
- Identified: 2025-04-17 22:57:00
- Scenario: The input directory exists but contains no .md files.
- Expected behavior: Log an informational message and exit gracefully.
- Testing approach: Run script on a directory without .md files.

### Edge Case: RAG Optimizer - File I/O Errors
- Identified: 2025-04-17 22:57:00
- Scenario: Script lacks read or write permissions for a specific .md file.
- Expected behavior: Log an error for that file, skip it, continue with others, report in summary.
- Testing approach: Modify file permissions in a test directory and run the script.

### Edge Case: RAG Optimizer - Malformed Patterns
- Identified: 2025-04-17 22:57:00
- Scenario: File contains text resembling citations or footnotes but not matching the exact regex.
- Expected behavior: Malformed patterns are ignored and left untouched.
- Testing approach: Create test files with near-miss patterns.

### Edge Case: RAG Optimizer - No References Section
- Identified: 2025-04-17 22:57:00
- Scenario: An .md file lacks a recognizable "References" section heading.
- Expected behavior: Process the entire file content, log a warning.
- Testing approach: Create a test file without a references heading.

### Edge Case: Theme Detail Page - Theme Not Found
- Identified: 2025-04-02 12:13:26
- Scenario: User navigates to `/themes/[invalidId]` or `getStaticProps` receives an ID not in the database.
- Expected behavior: Return a 404 page (`notFound: true` from `getStaticProps`).
- Testing approach: Unit test `getStaticProps` with invalid ID. Manual test navigation.

### Edge Case: Theme Detail Page - Markdown Parsing Failure
- Identified: 2025-04-02 12:13:26
- Scenario: `theme_descriptions.md` is missing, structure changes, or theme title mismatch prevents finding the correct section.
- Expected behavior: Log a warning, return empty philosopher lists to the component, page still renders with DB data.
- Testing approach: Unit test `parseThemeMarkdown` with malformed input/missing sections. Modify markdown temporarily for manual test.

### Edge Case: Theme Detail Page - Missing Suggested Readings
- Identified: 2025-04-02 12:13:26
- Scenario: `suggested_readings` column in DB is NULL or an empty array for a specific theme.
- Expected behavior: The "Suggested Readings" section is not rendered on the page. No errors occur.
- Testing approach: Ensure DB has themes with null/empty readings. Unit test component rendering logic. Manual test.

## Pseudocode Library
### Pseudocode: Admin Authentication - `signInWithOtp`, `signOut`, Route Protection
- Created: [2025-04-18 07:35:00]
- Updated: [2025-04-18 07:35:00]
```pseudocode
// src/app/admin/auth/actions.ts
'use server';
import { createServerClient } from '@/lib/supabase/server'; // Assumed utility
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

ASYNC FUNCTION signInWithOtp(previousState, formData) {
  origin = headers().get('origin'); // Get base URL for redirect
  email = formData.get('email');

  // Basic validation
  IF (!email || typeof email !== 'string' || !email.includes('@')) {
    RETURN { error: 'Invalid email address provided.' };
  }

  supabase = createServerClient();
  { data, error } = AWAIT supabase.auth.signInWithOtp({
    email: email,
    options: {
      // shouldCreateUser: false, // Optional: prevent creating new users
      emailRedirectTo: `${origin}/api/auth/callback`, // Supabase callback URL
    },
  });

  IF (error) {
    console.error('OTP Sign In Error:', error);
    RETURN { error: `Could not authenticate user: ${error.message}` };
  }

  RETURN { success: true, message: 'Check your email for the magic link!' };
}

ASYNC FUNCTION signOut() {
  supabase = createServerClient();
  AWAIT supabase.auth.signOut();
  redirect('/admin/login');
}

// src/app/admin/layout.tsx (Conceptual)
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
// ... other imports (NavBar, LogoutButton etc)

ASYNC FUNCTION AdminLayout({ children }) {
  supabase = createServerClient();
  { data: { user } } = AWAIT supabase.auth.getUser();

  IF (!user) {
    redirect('/admin/login');
  }

  RETURN (
    <div className="admin-layout">
      <AdminSidebar /> // Contains navigation and LogoutButton
      <main>{children}</main>
    </div>
  );
}
```
#### TDD Anchors:
- Test `signInWithOtp` validation.
- Test `signInWithOtp` Supabase call success/error.
- Test `signOut` Supabase call and redirect.
- Test `AdminLayout` redirect when no user.
- Test `AdminLayout` renders children when user exists.

### Pseudocode: Admin CRUD Server Actions (Example: Themes) - `src/app/admin/themes/actions.ts`
- Created: [2025-04-18 07:35:00]
- Updated: [2025-04-18 07:35:00]
```pseudocode
// src/app/admin/themes/actions.ts
'use server';
import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod'; // Example using Zod for validation

// Define schema for validation
const ThemeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  analytic_tradition: z.string().optional(),
  continental_tradition: z.string().optional(),
});

// --- Create Action --- (Used with useFormState)
ASYNC FUNCTION createTheme(previousState, formData) {
  // Validate form data
  validatedFields = ThemeSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    analytic_tradition: formData.get('analytic_tradition'),
    continental_tradition: formData.get('continental_tradition'),
  });

  IF (!validatedFields.success) {
    RETURN {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
    };
  }

  // Prepare data for Supabase
  themeData = validatedFields.data;

  TRY {
    supabase = createServerClient();
    { error } = AWAIT supabase.from('themes').insert(themeData);

    IF (error) throw error;

    // Revalidate cache and redirect on success
    revalidatePath('/admin/themes');
    // No need to return state on success if redirecting immediately
    // RETURN { message: 'Theme created successfully.', success: true };
  } CATCH (e) {
    console.error('Create Theme Error:', e);
    RETURN { message: `Database Error: Failed to create theme. ${e.message}` };
  }

  // Redirect after successful insert (outside try-catch)
  redirect('/admin/themes');
}

// --- Update Action --- (Used with useFormState)
ASYNC FUNCTION updateTheme(id, previousState, formData) {
  IF (!id) RETURN { message: 'Error: Missing theme ID.' };

  validatedFields = ThemeSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    analytic_tradition: formData.get('analytic_tradition'),
    continental_tradition: formData.get('continental_tradition'),
  });

  IF (!validatedFields.success) {
    RETURN {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
    };
  }

  themeData = validatedFields.data;

  TRY {
    supabase = createServerClient();
    { error } = AWAIT supabase.from('themes').update(themeData).eq('id', id);

    IF (error) throw error;

    revalidatePath('/admin/themes');
    revalidatePath(`/admin/themes/edit?id=${id}`); // Revalidate edit page too
    // RETURN { message: 'Theme updated successfully.', success: true };
  } CATCH (e) {
    console.error('Update Theme Error:', e);
    RETURN { message: `Database Error: Failed to update theme. ${e.message}` };
  }

  redirect('/admin/themes');
}

// --- Delete Action --- (Called directly, not usually with useFormState)
ASYNC FUNCTION deleteTheme(id) {
  IF (!id) throw new Error('Missing theme ID for deletion.');

  TRY {
    supabase = createServerClient();
    { error } = AWAIT supabase.from('themes').delete().eq('id', id);

    IF (error) throw error;

    revalidatePath('/admin/themes');
    RETURN { success: true, message: 'Theme deleted.' }; // Return status for client feedback

  } CATCH (e) {
    console.error('Delete Theme Error:', e);
    // Re-throw or return error structure
    throw new Error(`Database Error: Failed to delete theme. ${e.message}`);
    // OR: return { success: false, message: `Database Error: Failed to delete theme. ${e.message}` };
  }
}

// Similar actions for Workshops and FAQs would follow this pattern
// adapting the schema and table names.
```
#### TDD Anchors:
- Test `createTheme` validation (Zod schema).
- Test `createTheme` success path (Supabase insert call, revalidate, redirect).
- Test `createTheme` DB error handling.
- Test `updateTheme` validation.
- Test `updateTheme` success path (Supabase update call, revalidate, redirect).
- Test `updateTheme` DB error handling.
- Test `deleteTheme` success path (Supabase delete call, revalidate).
- Test `deleteTheme` DB error handling.
- Test `deleteTheme` missing ID handling.


<!-- Append new pseudocode blocks using the format below -->
### Pseudocode: RAG Markdown Optimizer Script - rag_markdown_optimizer.py
- Created: 2025-04-17 22:57:00
- Updated: 2025-04-17 22:57:00
```pseudocode
// rag_markdown_optimizer.py

IMPORT os
IMPORT re
IMPORT logging
IMPORT argparse

// --- Configuration ---
DEFINE REFERENCE_SECTION_PATTERNS: [
    r"^\s*##\s+References\s*$", // ## References
    r"^\s*References\s*\n-{3,}\s*$" // References\n---
]
DEFINE CITATION_PATTERN: r"\(([^,]+),\s*\[(\d{4})\]\([^)]+\s+\"[^\"]+\"\)\)" // (Author, [Year](URL "Full Citation")) -> Captures Author, Year
DEFINE FOOTNOTE_PATTERN: r"(\[Footnote\s+\d+\])\(\#[^)]+\)" // [Footnote N](#...) -> Captures [Footnote N] (Corrected from #FnN to general #...)

// --- Setup ---
FUNCTION setup_logging():
    // Configure logging (level, format, output - e.g., console and/or file)
    // Example: Log INFO level messages to console
END FUNCTION

FUNCTION parse_arguments():
    // Use argparse to get the input directory path from command line
    // Add argument for '--directory' or positional argument
    // RETURN parsed arguments (e.g., args.directory)
END FUNCTION

// --- Core Logic ---

FUNCTION find_markdown_files(directory_path):
    // Initialize empty list: markdown_files
    // FOR root, dirs, files IN os.walk(directory_path):
    //   FOR file IN files:
    //     IF file ends with ".md":
    //       ADD os.path.join(root, file) TO markdown_files
    // RETURN markdown_files
END FUNCTION

FUNCTION find_references_start(lines):
    // Iterate through lines with index
    // FOR index, line IN enumerate(lines):
    //   FOR pattern IN REFERENCE_SECTION_PATTERNS:
    //     IF re.match(pattern, line, re.IGNORECASE):
    //       RETURN index // Return the line number where references start
    // RETURN -1 // Indicate not found
END FUNCTION

FUNCTION process_markdown_file(file_path):
    TRY
        // Log processing start for file_path
        logging.info(f"Processing file: {file_path}")

        // Read file content
        WITH open(file_path, 'r', encoding='utf-8') AS f:
            lines = f.readlines() // Read as lines to easily find reference start

        // Find where the main content ends (start of references)
        references_start_index = find_references_start(lines)

        // Separate main content and references
        IF references_start_index != -1:
            main_content_lines = lines[:references_start_index]
            reference_content_lines = lines[references_start_index:]
            main_content = "".join(main_content_lines)
            logging.debug(f"References section found at line {references_start_index} in {file_path}")
        ELSE:
            main_content = "".join(lines)
            reference_content_lines = [] // No references section
            logging.warning(f"No references section found in {file_path}. Processing entire file.")

        // Perform replacements on main content only
        // 1. Simplify citations
        modified_content = re.sub(CITATION_PATTERN, r"(\1, \2)", main_content) // Replace with (Author, Year)

        // 2. Simplify footnotes
        modified_content = re.sub(FOOTNOTE_PATTERN, r"\1", modified_content) // Replace with [Footnote N]

        // Combine modified main content with original references
        final_content = modified_content + "".join(reference_content_lines)

        // Write modified content back to the file (in-place)
        WITH open(file_path, 'w', encoding='utf-8') AS f:
            f.write(final_content)

        logging.info(f"Successfully processed and updated: {file_path}")
        RETURN True // Indicate success

    EXCEPT FileNotFoundError:
        logging.error(f"Error: File not found - {file_path}")
        RETURN False
    EXCEPT PermissionError:
        logging.error(f"Error: Permission denied for file - {file_path}")
        RETURN False
    EXCEPT Exception as e:
        logging.error(f"Error processing file {file_path}: {e}")
        RETURN False
END FUNCTION

// --- Main Execution ---
FUNCTION main():
    setup_logging()
    args = parse_arguments()
    directory = args.directory // Assuming 'directory' is the argument name

    IF NOT os.path.isdir(directory):
        logging.critical(f"Error: Input path is not a valid directory: {directory}")
        EXIT // Or raise error

    markdown_files = find_markdown_files(directory)

    IF NOT markdown_files:
        logging.info(f"No Markdown files found in directory: {directory}")
        EXIT

    logging.info(f"Found {len(markdown_files)} Markdown files to process.")

    success_count = 0
    error_count = 0

    FOR file_path IN markdown_files:
        IF process_markdown_file(file_path):
            success_count += 1
        ELSE:
            error_count += 1

    // Log summary
    logging.info("--- Processing Summary ---")
    logging.info(f"Total files processed: {success_count}")
    logging.info(f"Total errors: {error_count}")
    logging.info("--------------------------")

END FUNCTION

// --- Entry Point ---
IF __name__ == "__main__":
    main()
```
#### TDD Anchors:
- Test `find_markdown_files`: Various directory structures, file types.
- Test `find_references_start`: Different header patterns, positions, absence.
- Test `process_markdown_file` (Mock I/O): Valid/invalid citations/footnotes, presence/absence of references section, content before/after references.
- Test `process_markdown_file` (Real I/O): Success case, FileNotFoundError, PermissionError.
- Test `main`: Arg parsing, directory validation, summary reporting.

### Pseudocode: Theme Detail Page - `platform/src/app/themes/[themeId]/page.tsx`
- Created: 2025-04-02 12:13:26
- Updated: 2025-04-02 12:13:26
```pseudocode
// platform/src/app/themes/[themeId]/page.tsx
// (Conceptual Pseudocode)

import { getThemeById, getAllThemeIds } from '@/lib/data/themes'; // Assumed data fetching functions
import { parseThemeMarkdown } from '@/lib/markdownUtils'; // Assumed markdown parsing utility
import { Theme } from '@/lib/types'; // Assumed Theme type definition
import { notFound } from 'next/navigation';
import fs from 'fs/promises'; // For reading markdown file
import path from 'path';

// Define structure for props, including parsed philosophers
type ThemeDetailPageProps = {
  params: { themeId: string };
};

type ParsedPhilosophers = {
  analytic: string[];
  continental: string[];
};

// --- Data Fetching ---

// Generate static paths for all themes
FUNCTION getStaticPaths():
  // Fetch all theme IDs (or slugs if using slugs) from the database
  allThemeIds = CALL getAllThemeIds() // Returns array like [{ id: 'minds-and-machines' }, ...]

  // Map IDs to the format Next.js expects
  paths = allThemeIds.map(theme => ({
    params: { themeId: theme.id }
  }))

  RETURN {
    paths: paths,
    fallback: false // Or 'blocking'/'true' if needed, but false is typical for fully static
  }
END FUNCTION

// Fetch data for a specific theme page
ASYNC FUNCTION getStaticProps(context):
  themeId = context.params.themeId

  // 1. Fetch theme data from DB
  themeData: Theme | null = AWAIT getThemeById(themeId)

  // Handle theme not found
  IF themeData IS NULL THEN
    RETURN { notFound: true }
  END IF

  // 2. Read markdown content
  markdownFilePath = path.join(process.cwd(), 'docs/event_info/theme_descriptions.md')
  markdownContent = AWAIT fs.readFile(markdownFilePath, 'utf-8')

  // 3. Parse markdown for philosophers related to this theme
  // parseThemeMarkdown needs to find the section by themeData.title
  // and extract bullet points under specific subheadings.
  philosophers: ParsedPhilosophers = parseThemeMarkdown(markdownContent, themeData.title)

  // 4. Return props
  RETURN {
    props: {
      theme: themeData,
      philosophers: philosophers
    },
    // Optional: Add revalidate period for ISR if needed
    // revalidate: 3600 // Revalidate every hour
  }
END FUNCTION

// --- Page Component ---

COMPONENT ThemeDetailPage(props: { theme: Theme, philosophers: ParsedPhilosophers }):
  theme = props.theme
  philosophers = props.philosophers

  // Basic structure - apply actual styling and layout components
  RETURN (
    DIV container // Apply layout styles
      H1 {theme.title}

      P {theme.description} // Render the (revamped) description

      // Display Philosopher Lists
      IF philosophers.analytic.length > 0 THEN
        DIV section
          H2 "Analytic Tradition"
          UL
            FOR philosopher IN philosophers.analytic:
              LI {philosopher}
            END FOR
          END UL
        END DIV
      END IF

      IF philosophers.continental.length > 0 THEN
        DIV section
          H2 "Continental Tradition"
          UL
            FOR philosopher IN philosophers.continental:
              LI {philosopher}
            END FOR
          END UL
        END DIV
      END IF

      // Display Suggested Readings (if available)
      IF theme.suggested_readings AND theme.suggested_readings.length > 0 THEN
        DIV section
          H2 "Suggested Readings"
          UL
            FOR reading IN theme.suggested_readings:
              LI {reading} // Assuming readings are simple strings for now
            END FOR
          END UL
        END DIV
      END IF
    END DIV
  )
END COMPONENT
```
#### TDD Anchors:
- Test case 1 (getStaticPaths): Should return an array of objects with `params: { themeId: string }` for all themes in the DB.
- Test case 2 (getStaticProps - Success): Given a valid themeId, should return props containing correct theme data and parsed philosopher lists.
- Test case 3 (getStaticProps - Not Found): Given an invalid themeId, should return `{ notFound: true }`.
- Test case 4 (getStaticProps - Markdown Parse): Should handle missing theme section or malformed markdown gracefully (e.g., empty philosopher lists).
- Test case 5 (Component Rendering): Should correctly render title, description, philosopher lists (analytic/continental), and suggested readings when provided.
- Test case 6 (Component Rendering - No Readings): Should not render the "Suggested Readings" section if the data is null or empty.

### Pseudocode: Theme Card Modification - `platform/src/components/ThemeCard.tsx`
- Created: 2025-04-02 12:13:26
- Updated: 2025-04-02 12:13:26
```pseudocode
// platform/src/components/ThemeCard.tsx
// (Conceptual Pseudocode - Showing modification)

import { Theme } from '@/lib/types';
import Link from 'next/link'; // Import Next.js Link

COMPONENT ThemeCard(props: { theme: Theme }):
  theme = props.theme

  RETURN (
    DIV card // Existing card structure and styling
      H3 {theme.title}
      P {theme.description} // Display the short/original description

      // --- ADDED ---
      // Add a link to the dynamic theme page
      // Use theme.id (or slug if available) for the href
      Link href={`/themes/${theme.id}`}
        A className="text-accent hover:underline" // Style as needed
          "See More Details"
        END A
      END Link
      // --- END ADDED ---

      // Existing display of philosopher lists (analytic/continental) might remain here
      // or be removed if the detail page is sufficient. User decision needed.
      // ... existing rendering of philosopher lists ...

    END DIV
  )
END COMPONENT
```
#### TDD Anchors:
- Test case 1 (Link Presence): The rendered card should include a Next.js Link component.
- Test case 2 (Link Destination): The Link's `href` attribute should correctly point to `/themes/[theme.id]`.
- Test case 3 (Link Text): The link should contain visible text like "See More Details".