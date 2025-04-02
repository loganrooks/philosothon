# TDD Specific Memory

## Test Plans (Driving Implementation)
<!-- Append new test plans using the format below -->
### Test Plan: Admin Theme CRUD Actions - 2025-04-01 21:28:00
#### Unit Tests:
- Test Case: `addTheme` should call Supabase insert with correct data / Expected: `insert` called with correct theme object / Status: Passing
- Test Case: `addTheme` should call revalidatePath on success / Expected: `revalidatePath` called for `/admin/themes` and `/themes` / Status: Passing
- Test Case: `addTheme` should call redirect on success / Expected: `redirect` called for `/admin/themes` / Status: Passing
- Test Case: `addTheme` should return error on Supabase insert failure / Expected: Returns `{success: false, message: ...}` / Status: Passing
- Test Case: `addTheme` should return error if title is missing / Expected: Returns `{success: false, message: 'Title and description are required.'}` / Status: Passing
- Test Case: `addTheme` should return error if description is missing / Expected: Returns `{success: false, message: 'Title and description are required.'}` / Status: Passing
- Test Case: `updateTheme` should call Supabase update with correct data and ID / Expected: `update().eq()` called with correct data and ID / Status: Passing
- Test Case: `updateTheme` should call revalidatePath and redirect on success / Expected: `revalidatePath` and `redirect` called / Status: Passing
- Test Case: `updateTheme` should return error if title is missing / Expected: Returns `{success: false, message: 'Title and description are required.'}` / Status: Passing
- Test Case: `updateTheme` should return error on Supabase update failure / Expected: Returns `{success: false, message: ...}` / Status: Passing
- Test Case: `deleteTheme` should call Supabase delete with correct ID / Expected: `delete().match()` called with correct ID / Status: Passing
- Test Case: `deleteTheme` should call revalidatePath on success / Expected: `revalidatePath` called for `/admin/themes` / Status: Passing
- Test Case: `deleteTheme` should log error on Supabase delete failure / Expected: `revalidatePath` not called / Status: Passing
- Test Case: `deleteTheme` should not call Supabase if ID is missing / Expected: `delete` and `revalidatePath` not called / Status: Passing
#### Integration Tests: - Test Case: N/A / Expected: N/A / Status: Planned
#### Edge Cases Covered: - Missing title/description: Validation returns error. - DB errors: Actions return error state.
### Test Plan: Admin Workshop CRUD Actions - 2025-04-01 22:00:00
#### Unit Tests:
- Test Case: `addWorkshop` should call Supabase insert with correct data / Expected: `insert` called with correct workshop object / Status: Passing
- Test Case: `addWorkshop` should call revalidatePath on success / Expected: `revalidatePath` called for `/admin/workshops` / Status: Passing
- Test Case: `addWorkshop` should call redirect on success / Expected: `redirect` called for `/admin/workshops` / Status: Passing
- Test Case: `addWorkshop` should return error on Supabase insert failure / Expected: Logs error, does not revalidate/redirect / Status: Passing
- Test Case: `addWorkshop` should return error if title/description/date/location missing / Expected: Logs error, does not call insert / Status: Passing
- Test Case: `updateWorkshop` should call Supabase update with correct data and ID / Expected: `update().match()` called with correct data and ID / Status: Passing
- Test Case: `updateWorkshop` should call revalidatePath and redirect on success / Expected: `revalidatePath` (admin list, edit page) and `redirect` called / Status: Passing
- Test Case: `updateWorkshop` should return error if title/description/date/location missing / Expected: Logs error, does not call update / Status: Passing
- Test Case: `updateWorkshop` should return error on Supabase update failure / Expected: Logs error, does not revalidate/redirect / Status: Passing
- Test Case: `deleteWorkshop` should call Supabase delete with correct ID / Expected: `delete().match()` called with correct ID / Status: Passing
- Test Case: `deleteWorkshop` should call revalidatePath on success / Expected: `revalidatePath` called for `/admin/workshops` / Status: Passing
- Test Case: `deleteWorkshop` should log error on Supabase delete failure / Expected: `revalidatePath` not called / Status: Passing
- Test Case: `deleteWorkshop` should not call Supabase if ID is missing / Expected: Logs error, `delete` and `revalidatePath` not called / Status: Passing
#### Integration Tests: - Test Case: N/A / Expected: N/A / Status: Planned
#### Edge Cases Covered: - Missing required fields: Validation logs error. - DB errors: Actions log error, don't proceed. - Invalid JSON/number parsing: Handled gracefully (uses null).

### Test Plan: Admin FAQ CRUD Actions - 2025-04-01 22:00:00
#### Unit Tests:
- Test Case: `addFaqItem` should call Supabase insert with correct data / Expected: `insert` called with correct FAQ object / Status: Passing
- Test Case: `addFaqItem` should handle optional display_order / Expected: `insert` called with `display_order: null` if omitted/invalid / Status: Passing
- Test Case: `addFaqItem` should call revalidatePath and redirect on success / Expected: `revalidatePath` (admin, public) and `redirect` called / Status: Passing
- Test Case: `addFaqItem` should return error state if question/answer missing / Expected: Returns `{success: false, message: ...}` / Status: Passing
- Test Case: `addFaqItem` should return error state on Supabase insert failure / Expected: Returns `{success: false, message: ...}` / Status: Passing
- Test Case: `updateFaqItem` should call Supabase update with correct data and ID / Expected: `update().match()` called with correct data and ID / Status: Passing
- Test Case: `updateFaqItem` should call revalidatePath and redirect on success / Expected: `revalidatePath` (admin list, edit page, public) and `redirect` called / Status: Passing
- Test Case: `updateFaqItem` should return error state if question/answer missing / Expected: Returns `{success: false, message: ...}` / Status: Passing
- Test Case: `updateFaqItem` should return error state on Supabase update failure / Expected: Returns `{success: false, message: ...}` / Status: Passing
- Test Case: `deleteFaqItem` should call Supabase delete with correct ID / Expected: `delete().match()` called with correct ID / Status: Passing
- Test Case: `deleteFaqItem` should call revalidatePath on success / Expected: `revalidatePath` called for `/admin/faq` and `/faq` / Status: Passing
- Test Case: `deleteFaqItem` should log error on Supabase delete failure / Expected: `revalidatePath` not called / Status: Passing
- Test Case: `deleteFaqItem` should not call Supabase if ID is missing / Expected: Logs error, `delete` and `revalidatePath` not called / Status: Passing
#### Integration Tests: - Test Case: N/A / Expected: N/A / Status: Planned
#### Edge Cases Covered: - Missing required fields: Validation returns error state. - DB errors: Actions return error state. - Invalid number parsing: Handled gracefully (uses null).

## Test Coverage Summary
<!-- Update coverage summary using the format below -->
### Coverage Update: 2025-04-01 22:00:00
- **Overall**: Line: [TBD] / Branch: [TBD] / Function: [TBD] (Need to run coverage report)
- **By Component**: `themes/actions.ts`: Passing, `workshops/actions.ts`: Passing, `faq/actions.ts`: Passing
- **Areas Needing Attention**: Need tests for Forms (e.g., `ThemeForm`) and Action components (e.g., `ThemeActions`). Need to configure and run coverage report.

## Test Fixtures
<!-- Append new fixtures using the format below -->
### Fixture: Vitest Mocks for Supabase/Next.js - 2025-04-01 21:28:00
- **Purpose**: Mock `createClient`, `revalidatePath`, `redirect` for server action unit tests.
- **Location**: `platform/src/app/admin/themes/actions.test.ts`
- **Usage**: Defined globally, reset in `beforeEach`, overridden in specific tests for error cases.

## TDD Cycles Log
<!-- Append TDD cycle outcomes using the format below -->
### TDD Cycle: Theme Server Actions (add/update) - 2025-04-01 21:28:00
- **Start**: ~2025-04-01 20:12:00
- **End**: ~2025-04-01 21:28:00
- **Red**: Wrote initial failing tests for `addTheme` and `updateTheme` covering success, validation errors, and DB errors.
- **Green**: Modified `addTheme` and `updateTheme` actions to handle `useFormState` return types, correct field names, fix Supabase call chains (`.update().eq()`), and ensure proper error returns. Iteratively fixed complex mock setups in tests (`beforeEach`, test-specific overrides) to align with action logic and resolve type/runtime errors.
- **Refactor**: Minor adjustments to mock variable names and test structure for clarity. No major code refactoring deemed necessary for actions at this stage.
- **Outcomes**: Successfully implemented and tested `addTheme` and `updateTheme`. Highlighted challenges with complex mocking in Vitest and context window limitations affecting diff application.
### TDD Cycle: Theme Server Actions (delete fix) - 2025-04-01 22:00:00
- **Start**: ~2025-04-01 21:56:00
- **End**: ~2025-04-01 21:57:30
- **Red**: Test `deleteTheme > should call revalidatePath on successful delete` failing with `TypeError: You must provide a Promise to expect() when using .resolves, not 'function'.`
- **Green**: Removed incorrect `await expect(mockEqDelete).resolves.toEqual(...)` assertion. The preceding `await deleteTheme(themeId)` already ensures the promise resolves before subsequent assertions.
- **Refactor**: N/A.
- **Outcomes**: Corrected assertion logic for async operations in Vitest. `deleteTheme` tests now pass.

## Test Execution Results
<!-- Append test run summaries using the format below -->
### Test Run: 2025-04-01 20:53:23
- **Trigger**: Manual / **Env**: Local / **Suite**: `actions.test.ts`
- **Result**: FAIL / **Summary**: 14 Total/11 Passed/3 Failed/0 Skipped
- **Report Link**: N/A / **Failures**: `deleteTheme > should call revalidatePath on successful delete` (`TypeError: You must provide a Promise to expect() when using .resolves, not 'function'.`)

### Test Run: 2025-04-01 21:57:29
- **Trigger**: Manual / **Env**: Local / **Suite**: `platform/src/app/admin/themes/actions.test.ts`
- **Result**: PASS / **Summary**: 49 Total/49 Passed/0 Failed/0 Skipped (Includes other test files run by Vitest)
- **Report Link**: N/A / **Failures**: None

### Test Run: 2025-04-01 21:58:41
- **Trigger**: Manual / **Env**: Local / **Suite**: `platform/src/app/admin/workshops/actions.test.ts`
- **Result**: PASS / **Summary**: 49 Total/49 Passed/0 Failed/0 Skipped (Includes other test files run by Vitest)
- **Report Link**: N/A / **Failures**: None

### Test Run: 2025-04-01 22:59:34
- **Trigger**: Manual / **Env**: Local / **Suite**: `platform/src/app/admin/faq/actions.test.ts`
- **Result**: PASS / **Summary**: 49 Total/49 Passed/0 Failed/0 Skipped (Includes other test files run by Vitest)
- **Report Link**: N/A / **Failures**: None