# Admin Section Rebuild: Specifications & Pseudocode

## 1. Core Requirements (MVP)

Based on the original project specifications and the need to restore content management functionality, the Minimum Viable Product (MVP) for the rebuilt Admin section includes:

*   **Authentication:**
    *   Passwordless login using Supabase Auth Magic Link at `/admin/login`.
    *   Protection of all routes under `/admin` using middleware or layout checks, redirecting unauthenticated users to `/admin/login`.
    *   A mechanism for logging out.
*   **Dashboard:**
    *   A simple landing page at `/admin` after login.
    *   Initially, this can just contain links to the management sections (Themes, Workshops, FAQs). (Viewing registration data, as per the original spec, is deferred post-MVP rebuild).
*   **Theme Management:**
    *   **List View (`/admin/themes`):** Display all existing themes in a table with columns for Title, Description (truncated), and Actions (Edit, Delete).
    *   **Add Functionality (`/admin/themes/new`):** A form to create a new theme (Title, Description, Analytic Tradition, Continental Tradition).
    *   **Edit Functionality (`/admin/themes/edit?id=...`):** A form pre-filled with existing theme data to update Title, Description, Analytic Tradition, Continental Tradition.
    *   **Delete Functionality:** A button/action on the list view (or edit view) to delete a theme, likely with a confirmation modal.
*   **Workshop Management:**
    *   **List View (`/admin/workshops`):** Display all existing workshops in a table (Title, Description truncated, Facilitator, Actions).
    *   **Add Functionality (`/admin/workshops/new`):** Form to create a new workshop (Title, Description, Relevant Themes (multi-select/tags based on `themes` table), Facilitator, Max Capacity).
    *   **Edit Functionality (`/admin/workshops/edit?id=...`):** Form to update workshop details.
    *   **Delete Functionality:** Action to delete a workshop with confirmation.
*   **FAQ Management:**
    *   **List View (`/admin/faq`):** Display all FAQ items in a table (Question, Answer truncated, Category, Order, Actions). Allow reordering (potentially drag-and-drop or simple up/down arrows triggering updates).
    *   **Add Functionality (`/admin/faq/new`):** Form to create a new FAQ item (Question, Answer, Category, Display Order).
    *   **Edit Functionality (`/admin/faq/edit?id=...`):** Form to update FAQ details.
    *   **Delete Functionality:** Action to delete an FAQ item with confirmation.

## 2. Proposed Routing Strategy

The following routes will be implemented under the `/admin` path:

*   `/admin/login`: Publicly accessible page for Magic Link authentication.
*   `/admin`: Protected dashboard page, redirects to `/admin/login` if not authenticated. Serves as the main landing page with links to management sections.
*   `/admin/themes`: Protected page displaying a list of all themes.
*   `/admin/themes/new`: Protected page with a form to add a new theme.
*   `/admin/themes/edit`: A single page that takes a theme `id` as a query parameter (e.g., `/admin/themes/edit?id=abc`).
*   `/admin/workshops`: Protected page displaying a list of all workshops.
*   `/admin/workshops/new`: Protected page with a form to add a new workshop.
*   `/admin/workshops/edit`: A single page using `/admin/workshops/edit?id=xyz`.
*   `/admin/faq`: Protected page displaying a list of all FAQ items.
*   `/admin/faq/new`: Protected page with a form to add a new FAQ item.
*   `/admin/faq/edit`: A single page using `/admin/faq/edit?id=123`.

**Addressing the Edit Route Challenge (`/admin/.../edit/[id]`):**

**Proposed Solution: Single Edit Page per Content Type + Server Actions**

*   **Rationale:** Avoids previous dynamic route build issues, simplifies data mutations using Server Actions, aligns with modern Next.js patterns.
*   **Data Fetching:** Edit pages (`/admin/.../edit`) are Server Components, read `id` from `searchParams`, fetch data, pass to client form. Handle not found.
*   **Form Submission:** Use Server Actions (`actions.ts`) invoked from client forms (`<form action={serverAction}>` or programmatically). Actions handle validation, DB interaction (Supabase server client), `revalidatePath`, and `redirect`.
*   **Delete Operations:** Use Server Actions triggered via confirmation modal.

## 3. Component Specifications

The following React components will be needed for the Admin section (likely under `platform/src/app/admin/components/`):

*   **`AdminLayout` (`app/admin/layout.tsx`):** Server Component wrapper, handles auth check/redirect, includes sidebar nav & logout.
*   **`LoginForm` (`app/admin/login/components/LoginForm.tsx`):** Client Component for email input, calls `signInWithOtp` Server Action. Uses `useFormState`.
*   **`LogoutButton` (`app/admin/components/LogoutButton.tsx`):** Client Component, calls `signOut` Server Action.
*   **`AdminDashboard` (`app/admin/page.tsx`):** Server Component, links to management sections.
*   **`DataTable` (Reusable):** Generic table component (props: `columns`, `data`), includes slot for action buttons.
*   **`DeleteConfirmationModal` (Reusable):** Client Component modal (props: `isOpen`, `onClose`, `onConfirm`, `itemName`).
*   **`ThemeList` (`app/admin/themes/components/ThemeList.tsx`):** Server Component, fetches themes, uses `DataTable`, includes Add/Edit/Delete controls.
*   **`ThemeForm` (`app/admin/themes/components/ThemeForm.tsx`):** Client Component (Add/Edit), uses `useFormState`, calls `createTheme`/`updateTheme` Server Actions.
*   **`WorkshopList` (`app/admin/workshops/components/WorkshopList.tsx`):** Server Component, similar to `ThemeList`.
*   **`WorkshopForm` (`app/admin/workshops/components/WorkshopForm.tsx`):** Client Component (Add/Edit), similar to `ThemeForm`, includes multi-select for themes.
*   **`FaqList` (`app/admin/faq/components/FaqList.tsx`):** Server Component, similar to `ThemeList`, includes reordering controls.
*   **`FaqForm` (`app/admin/faq/components/FaqForm.tsx`):** Client Component (Add/Edit), similar to `ThemeForm`.

## 4. Data Flow & Logic (Pseudocode)

This section outlines the logic for authentication and CRUD operations using Server Components, Client Components, and Server Actions.

### 4.1 Authentication

**Login Page (`/admin/login`)**

*   **UI (`LoginForm.tsx` - Client Component):**
    *   Displays email input and "Send Magic Link" button.
    *   Uses `useFormState` to manage feedback from the Server Action.
    *   On form submit: Invokes `signInWithOtp` Server Action passed via `action` prop.
*   **Server Action (`src/app/admin/auth/actions.ts` - `signInWithOtp`):**
    *   Receives form data (email).
    *   Validates email format. // TDD: Test email validation (required, format).
    *   Creates Supabase server client (`@supabase/ssr`).
    *   Calls `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: 'URL_TO_ADMIN_DASHBOARD_AFTER_CONFIRM' } })`.
    *   Returns status object (e.g., `{ success: true }` or `{ error: 'Invalid email' }`) to `useFormState`. // TDD: Test OTP sign-in success/failure scenarios.

**Route Protection (`AdminLayout` - Server Component):**

*   Reads session using Supabase server client.
*   IF no active session: `redirect('/admin/login')`.
*   ELSE: Render child components (the requested admin page). // TDD: Test authenticated access. // TDD: Test unauthenticated redirect.

**Logout (`LogoutButton.tsx` - Client Component & Server Action):**

*   **UI (`LogoutButton.tsx`):**
    *   Renders a "Logout" button.
    *   On click: Invokes `signOut` Server Action.
*   **Server Action (`src/app/admin/auth/actions.ts` - `signOut`):**
    *   Creates Supabase server client.
    *   Calls `supabase.auth.signOut()`.
    *   Calls `redirect('/admin/login')`. // TDD: Test sign-out redirects correctly.

### 4.2 Themes CRUD

**List View (`/admin/themes` - `ThemeList.tsx` - Server Component):**

*   Creates Supabase server client.
*   Fetches all themes: `supabase.from('themes').select('*').order('title')`. // TDD: Test theme fetching success/error.
*   Passes fetched data to `DataTable`.
*   Actions column in `DataTable` includes:
    *   Link to `/admin/themes/edit?id={theme.id}`.
    *   Delete button (Client Component interaction needed).

**Add Theme (`/admin/themes/new` page -> `ThemeForm.tsx` - Client Component):**

*   Renders empty form fields.
*   Uses `useFormState` hooked to `createTheme` Server Action.
*   On submit: Invokes `createTheme` Server Action.

**Server Action (`src/app/admin/themes/actions.ts` - `createTheme`):**

*   Receives previous state and form data.
*   Validates form data (e.g., title required). // TDD: Test theme creation validation (required fields).
*   Creates Supabase server client.
*   Inserts data: `supabase.from('themes').insert({ title, description, ... })`.
*   Handles potential DB errors.
*   IF success: `revalidatePath('/admin/themes')`, `redirect('/admin/themes')`.
*   ELSE: Return error messages via state. // TDD: Test theme creation success (DB call, revalidate, redirect). // TDD: Test theme creation failure (DB error).

**Edit Theme (`/admin/themes/edit?id=...` page -> `ThemeForm.tsx` - Client Component):**

*   **Page (Server Component):**
    *   Reads `id` from `searchParams`.
    *   Fetches theme data: `supabase.from('themes').select('*').eq('id', id).single()`. // TDD: Test fetching single theme for edit.
    *   Handles not found (redirect or error).
    *   Passes fetched `initialData` to `ThemeForm`.
*   **Form (`ThemeForm.tsx`):**
    *   Renders form fields pre-filled with `initialData`.
    *   Uses `useFormState` hooked to `updateTheme` Server Action.
    *   On submit: Invokes `updateTheme` Server Action (passing the theme `id` along with form data).

**Server Action (`src/app/admin/themes/actions.ts` - `updateTheme`):**

*   Receives previous state, theme `id`, and form data.
*   Validates form data. // TDD: Test theme update validation.
*   Creates Supabase server client.
*   Updates data: `supabase.from('themes').update({ title, description, ... }).eq('id', id)`.
*   Handles potential DB errors.
*   IF success: `revalidatePath('/admin/themes')`, `revalidatePath('/admin/themes/edit?id={id}')` (optional), `redirect('/admin/themes')`.
*   ELSE: Return error messages via state. // TDD: Test theme update success (DB call, revalidate, redirect). // TDD: Test theme update failure (DB error).

**Delete Theme (Interaction from `ThemeList.tsx`):**

*   **UI (`ThemeList.tsx`):**
    *   Delete button click sets client state `(itemToDeleteId, isModalOpen)`.
    *   Renders `DeleteConfirmationModal` with `isOpen={isModalOpen}`.
    *   `onConfirm` prop of modal calls `handleDeleteConfirm`.
*   **Handler (`handleDeleteConfirm` in `ThemeList.tsx` or separate client component):**
    *   Invokes `deleteTheme` Server Action, passing `itemToDeleteId`.
    *   Handles loading/disabled state for button.
    *   Closes modal on completion/error.
    *   Optionally displays toast notification for success/error.
*   **Server Action (`src/app/admin/themes/actions.ts` - `deleteTheme`):**
    *   Receives theme `id`.
    *   Creates Supabase server client.
    *   Deletes data: `supabase.from('themes').delete().eq('id', id)`.
    *   Handles potential DB errors.
    *   IF success: `revalidatePath('/admin/themes')`. (No redirect needed if called from list view).
    *   ELSE: Throw error or return error status (can be caught by client). // TDD: Test theme deletion success (DB call, revalidate). // TDD: Test theme deletion failure (DB error).

### 4.3 Workshops CRUD

*   Follows the same pattern as Themes CRUD:
    *   List View (`/admin/workshops`, `WorkshopList.tsx`) fetches and displays workshops using `DataTable`.
    *   Add View (`/admin/workshops/new`, `WorkshopForm.tsx`) uses `createWorkshop` Server Action.
    *   Edit View (`/admin/workshops/edit?id=...`, `WorkshopForm.tsx`) fetches single workshop, uses `updateWorkshop` Server Action.
    *   Delete uses `DeleteConfirmationModal` and `deleteWorkshop` Server Action.
    *   Server Actions (`src/app/admin/workshops/actions.ts`) handle validation, Supabase interaction (`workshops` table), `revalidatePath('/admin/workshops')`, and redirects.
    *   // TDD: Add tests for workshop fetch, create, update, delete (validation, DB calls, revalidate, redirect).

### 4.4 FAQs CRUD

*   Follows the same pattern as Themes CRUD:
    *   List View (`/admin/faq`, `FaqList.tsx`) fetches and displays FAQs using `DataTable`, ordered by `display_order`. May include reorder controls.
    *   Add View (`/admin/faq/new`, `FaqForm.tsx`) uses `createFaqItem` Server Action.
    *   Edit View (`/admin/faq/edit?id=...`, `FaqForm.tsx`) fetches single FAQ, uses `updateFaqItem` Server Action.
    *   Delete uses `DeleteConfirmationModal` and `deleteFaqItem` Server Action.
    *   Server Actions (`src/app/admin/faq/actions.ts`) handle validation, Supabase interaction (`faq_items` table), `revalidatePath('/admin/faq')`, and redirects.
    *   *Reordering (if implemented):* Up/Down arrows could trigger a dedicated `reorderFaqItem` Server Action passing the item ID and direction ('up'/'down'). This action would fetch adjacent items, calculate new `display_order` values, and perform UPDATE operations. // TDD: Test FAQ reordering logic.
    *   // TDD: Add tests for FAQ fetch, create, update, delete (validation, DB calls, revalidate, redirect).

## 5. TDD Anchors

The following is a summary of the Test-Driven Development anchors identified in the pseudocode. These represent key areas for unit and integration tests.

**Authentication:**

*   Test email validation (required, format) in `signInWithOtp`.
*   Test OTP sign-in success scenario (Supabase call, return value).
*   Test OTP sign-in failure scenarios (invalid email, Supabase error).
*   Test route protection: authenticated access allowed.
*   Test route protection: unauthenticated access redirects to login.
*   Test sign-out redirects correctly.

**Themes CRUD:**

*   Test theme fetching success/error (`ThemeList`).
*   Test fetching single theme for edit (`/admin/themes/edit` page).
*   Test theme creation validation (required fields) in `createTheme`.
*   Test theme creation success (DB call, `revalidatePath`, `redirect`) in `createTheme`.
*   Test theme creation failure (DB error) in `createTheme`.
*   Test theme update validation in `updateTheme`.
*   Test theme update success (DB call, `revalidatePath`, `redirect`) in `updateTheme`.
*   Test theme update failure (DB error) in `updateTheme`.
*   Test theme deletion success (DB call, `revalidatePath`) in `deleteTheme`.
*   Test theme deletion failure (DB error) in `deleteTheme`.

**Workshops CRUD:**

*   Test workshop fetching success/error (`WorkshopList`).
*   Test fetching single workshop for edit (`/admin/workshops/edit` page).
*   Test workshop creation validation in `createWorkshop`.
*   Test workshop creation success (DB call, `revalidatePath`, `redirect`) in `createWorkshop`.
*   Test workshop creation failure (DB error) in `createWorkshop`.
*   Test workshop update validation in `updateWorkshop`.
*   Test workshop update success (DB call, `revalidatePath`, `redirect`) in `updateWorkshop`.
*   Test workshop update failure (DB error) in `updateWorkshop`.
*   Test workshop deletion success (DB call, `revalidatePath`) in `deleteWorkshop`.
*   Test workshop deletion failure (DB error) in `deleteWorkshop`.

**FAQs CRUD:**

*   Test FAQ fetching success/error (`FaqList`).
*   Test fetching single FAQ for edit (`/admin/faq/edit` page).
*   Test FAQ creation validation in `createFaqItem`.
*   Test FAQ creation success (DB call, `revalidatePath`, `redirect`) in `createFaqItem`.
*   Test FAQ creation failure (DB error) in `createFaqItem`.
*   Test FAQ update validation in `updateFaqItem`.
*   Test FAQ update success (DB call, `revalidatePath`, `redirect`) in `updateFaqItem`.
*   Test FAQ update failure (DB error) in `updateFaqItem`.
*   Test FAQ deletion success (DB call, `revalidatePath`) in `deleteFaqItem`.
*   Test FAQ deletion failure (DB error) in `deleteFaqItem`.
*   Test FAQ reordering logic (if implemented) in `reorderFaqItem`.