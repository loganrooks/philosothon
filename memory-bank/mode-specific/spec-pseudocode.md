# Specification Writer Specific Memory

## Functional Requirements
<!-- Append new requirements using the format below -->
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
<!-- Append new constraints using the format below -->
### Constraint: Theme Detail Page Data Sources
- Added: 2025-04-02 12:13:26
- Description: Theme detail pages require data from both the database (title, description, suggested readings) and a static markdown file (`theme_descriptions.md` for philosopher lists).
- Impact: Requires combining data sources in `getStaticProps`. Parsing logic for markdown is needed. Suggested readings must be added to the DB.
- Mitigation strategy: Implement robust markdown parsing (`parseThemeMarkdown`). Add `suggested_readings` column to `themes` table.

## Edge Cases
<!-- Append new edge cases using the format below -->
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
<!-- Append new pseudocode blocks using the format below -->
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