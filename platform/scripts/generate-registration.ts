import fs from 'fs';
import path from 'path';
// Correct the import path relative to the script's location in platform/scripts/
import { registrationSchema, QuestionDefinition, generateRegistrationSchema as generateZodSchemaFromConfig } from '../config/registrationSchema';
import { z } from 'zod'; // Import Zod for schema generation logic

// --- Configuration ---
const frontendQuestionsPath = path.resolve(__dirname, '../src/app/register/data/registrationQuestions.ts');
const actionsPath = path.resolve(__dirname, '../src/app/register/actions.ts');
const migrationsDir = path.resolve(__dirname, '../../supabase/migrations');
// Use a more specific import path assuming '@/' maps to 'src/'
const zodSchemaImport = "import { generateRegistrationSchema } from '@/config/registrationSchema';";
const zodSchemaUsage = "export const RegistrationSchema = generateRegistrationSchema();"; // Ensure this matches usage in actions.ts

// --- Helper Functions ---

// Helper to escape backticks and dollar signs for template literals
function escapeString(str: string | undefined): string {
  if (str === undefined) return '';
  return str.replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

function generateFrontendQuestionsContent(): string {
  console.log("Generating content for registrationQuestions.ts...");

  // Dynamically generate QuestionType based on unique types in the schema
  const uniqueTypes = [...new Set(registrationSchema.map(q => q.type))];
  const questionTypeAlias = `
// Define abstract types dynamically based on the central schema
export type QuestionType =
${uniqueTypes.map(type => `  | '${type}'`).join('\n')};
`;

  // Dynamically generate the Question interface string based on known properties
  const properties = [
    { name: 'id', type: 'string', required: true },
    { name: 'section', type: 'string', required: true },
    { name: 'order', type: 'number', required: true },
    { name: 'label', type: 'string', required: true },
    { name: 'type', type: 'QuestionType', required: true }, // Use dynamically generated QuestionType alias
    { name: 'required', type: 'boolean', required: true },
    { name: 'options', type: 'string[]', required: false },
    { name: 'hint', type: 'string', required: true }, // Marked as required in schema
    { name: 'description', type: 'string', required: true }, // Marked as required in schema
    { name: 'validationRules', type: "QuestionDefinition['validationRules']", required: false },
    { name: 'dependsOn', type: 'string', required: false },
    { name: 'dependsValue', type: 'any', required: false }, // Type 'any' is okay here as value varies
    { name: 'dbType', type: "QuestionDefinition['dbType']", required: true },
    { name: 'otherField', type: 'boolean', required: false },
  ];

  const dynamicInterfaceContent = `
// Re-import QuestionDefinition to reuse nested types if needed
// NOTE: This import might become redundant if QuestionDefinition isn't used elsewhere after this refactor.
import { QuestionDefinition } from '@/../config/registrationSchema';

export interface Question {
${properties.map(prop => `  ${prop.name}${prop.required ? '' : '?'}: ${prop.type};`).join('\n')}
}`;

  // Generate the questions array content
  const questionsArrayContent = registrationSchema
    .sort((a, b) => a.order - b.order) // Ensure order is maintained
    .map(q => {
      // Use helper for labels, hints, descriptions
      const escapedLabel = escapeString(q.label);
      const escapedHint = escapeString(q.hint);
      const escapedDescription = escapeString(q.description);

      let questionObject = `  {
    id: '${q.id}',
    section: '${q.section}', // Added
    order: ${q.order}, // Added
    label: \`${escapedLabel}\`,
    type: '${q.type}',
    required: ${q.required},`;

      if (q.options) {
        questionObject += `\n    options: ${JSON.stringify(q.options)},`;
      }
      // Add mandatory and optional fields
      questionObject += `\n    hint: \`${escapedHint}\`,`; // Added
      questionObject += `\n    description: \`${escapedDescription}\`,`; // Added
      if (q.validationRules) { // Check if validationRules exists
         // Stringify carefully, ensuring keys are quoted if needed by JS syntax
         // JSON.stringify should handle this correctly for valid JSON structure
        questionObject += `\n    validationRules: ${JSON.stringify(q.validationRules, null, 6)},`; // Added with indentation
      }
      if (q.dependsOn) {
        questionObject += `\n    dependsOn: '${q.dependsOn}',`;
      }
      if (q.dependsValue !== undefined) {
        questionObject += `\n    dependsValue: ${JSON.stringify(q.dependsValue)},`;
      }
      questionObject += `\n    dbType: '${q.dbType}',`; // Added
      if (q.otherField !== undefined) { // Check if otherField exists
         questionObject += `\n    otherField: ${q.otherField},`; // Added
      }

      questionObject += `\n  }`;
      return questionObject;
    })
    .join(',\n');

  // Generate FormDataStore type
  const formDataStoreTypeContent = `
export type FormDataStore = {
${registrationSchema
  .filter(q => q.dbType !== 'SKIP') // Only include fields that are stored
  .map(q => `  ${q.id}?: any; // TODO: Refine types based on q.type`)
  .join('\n')}
  currentQuestionIndex?: number;
  isVerified?: boolean; // Track if email/password step is done
};
`;

  return `// Generated by generate-registration.ts. Do not edit manually.\n\n${questionTypeAlias}\n\n${dynamicInterfaceContent}\n\n${formDataStoreTypeContent}\n\nexport const questions: Question[] = [\n${questionsArrayContent}\n];\n`;
}

function ensureSchemaUsageInActions(): string {
    console.log(`Ensuring schema usage in ${path.basename(actionsPath)}...`);
    let content = fs.readFileSync(actionsPath, 'utf-8');
    const originalContent = content; // Keep original to check if modified
    const useServerDirective = "'use server';";
    const correctImportPath = '../../../config/registrationSchema'; // Relative path from actions.ts
    const correctImportStatement = `import { generateRegistrationSchema } from '${correctImportPath}';`;

    // --- Handle 'use server' directive ---
    const lines = content.split('\n');
    const useServerFoundOnTop = lines.length > 0 && lines[0].trim() === useServerDirective;

    // Remove all existing 'use server' directives
    const cleanedLines = lines.filter(line => line.trim() !== useServerDirective);
    content = cleanedLines.join('\n');

    // Add 'use server' at the very top
    content = `${useServerDirective}\n${content}`;
    if (!useServerFoundOnTop) {
        console.log(`Moved/Added 'use server' directive to the top of ${path.basename(actionsPath)}.`);
    }

    // --- Handle Import Statement ---
    // Remove any incorrect/duplicate imports first
    const importRegex = /import\s+\{\s*generateRegistrationSchema\s*\}\s+from\s+['"].*config\/registrationSchema['"];?\s*/g;
    let correctImportFound = false;
    const contentWithoutImports = content.replace(importRegex, (match) => {
        if (match.includes(correctImportPath)) {
            correctImportFound = true; // Mark if the correct one was found
        } else {
            console.log(`Removing incorrect/duplicate import: ${match.trim()}`);
        }
        return ''; // Remove all matches initially
    });

    // Clean up potential extra newlines left by removal
    const tempContent = contentWithoutImports.split('\n');
    // Find the line index after 'use server;'
    const insertLineIndex = 1; // Start checking from the second line

    // Add the correct import statement back in the right place (after 'use server;')
    tempContent.splice(insertLineIndex, 0, correctImportStatement);
    content = tempContent.join('\n');

    if (!correctImportFound) {
        console.log(`Added correct schema import to ${path.basename(actionsPath)}.`);
    } else {
        console.log(`Ensured correct schema import exists in ${path.basename(actionsPath)}.`);
    }


    // --- Handle Schema Usage (Export) ---
    // Ensure the export line exists, replace if necessary to ensure comment is correct
    const schemaExportRegex = /export\s+const\s+RegistrationSchema\s*=\s*generateRegistrationSchema\(\);?/m; // Use multiline flag
    const schemaExportDefinition = `// Generated Zod schema based on central configuration\nexport const RegistrationSchema = generateRegistrationSchema();`;

    if (!schemaExportRegex.test(content)) {
         // Attempt to add it after imports (find first line after imports)
         const lastImportIndex = content.lastIndexOf('import ');
         const nextLineAfterImports = content.indexOf('\n', lastImportIndex >= 0 ? lastImportIndex : 0) + 1;
         let insertPos = nextLineAfterImports;
         // Find the next non-empty line to insert before potential code
         while (insertPos < content.length && (content[insertPos] === '\n' || content[insertPos] === '\r')) {
             insertPos++;
         }
         content = content.slice(0, insertPos) + `\n${schemaExportDefinition}\n` + content.slice(insertPos);
         console.log(`Added schema usage export to ${path.basename(actionsPath)}.`);
    } else {
         // Replace existing to ensure comment is present/correct
         content = content.replace(schemaExportRegex, schemaExportDefinition);
         console.log(`Ensured schema usage export exists in ${path.basename(actionsPath)}.`);
    }

    // Check if content was actually modified compared to the start
    const modified = content !== originalContent;

    // Return modified content only if changes were made
    return modified ? content : originalContent;
}


function generateSqlMigrationContent(): { filename: string; content: string } {
  console.log("Generating draft SQL migration...");
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const filename = `${timestamp}_update_registrations_table_generated.sql`;

  let sqlContent = `-- Draft migration generated by generate-registration.ts at ${new Date().toISOString()}\n`;
  sqlContent += `-- Please review and adjust column types, constraints, and defaults before applying.\n\n`;
  sqlContent += `BEGIN;\n\n`;
  sqlContent += `-- Ensure the registrations table exists (adjust if needed)\n`;
  sqlContent += `-- CREATE TABLE IF NOT EXISTS public.registrations (\n`;
  sqlContent += `--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`;
  sqlContent += `--   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,\n`;
  sqlContent += `--   created_at TIMESTAMPTZ DEFAULT now(),\n`;
  sqlContent += `--   updated_at TIMESTAMPTZ DEFAULT now()\n`;
  sqlContent += `--   -- Add other base columns as needed\n`;
  sqlContent += `-- );\n\n`;

  sqlContent += `-- Add columns based on registrationSchema\n`;

  const columnsToAdd: string[] = [];
  registrationSchema.forEach(q => {
    if (q.dbType !== 'SKIP') {
      let columnDefinition = `ADD COLUMN IF NOT EXISTS "${q.id}"`; // Use quotes for potential reserved words
      switch (q.dbType) {
        case 'VARCHAR(255)':
          columnDefinition += ` VARCHAR(255)`;
          break;
        case 'INTEGER':
          columnDefinition += ` INTEGER`;
          break;
        case 'BOOLEAN':
          columnDefinition += ` BOOLEAN`;
          break;
        case 'TEXT[]':
          columnDefinition += ` TEXT[]`; // Assumes PostgreSQL array type
          break;
        case 'JSONB':
          columnDefinition += ` JSONB`;
          break;
        case 'TEXT':
        default:
          columnDefinition += ` TEXT`;
          break;
      }
      // Basic NOT NULL constraint - review if defaults are needed
      // Example: Add default for boolean consents?
      // if (q.required) {
      //   columnDefinition += ` NOT NULL`; // Be cautious adding NOT NULL without defaults to existing tables
      // }
      columnsToAdd.push(columnDefinition);
    }
  });

  if (columnsToAdd.length > 0) {
      sqlContent += `ALTER TABLE public.registrations\n`;
      sqlContent += columnsToAdd.map(col => `  ${col}`).join(',\n');
      sqlContent += `;\n\n`;
  } else {
      sqlContent += `-- No new columns to add based on schema dbType hints.\n\n`;
  }


  sqlContent += `-- Add/Update foreign key constraint to link registrations to users (if not already present)\n`;
  sqlContent += `ALTER TABLE public.registrations\n`;
  sqlContent += `  ADD COLUMN IF NOT EXISTS user_id UUID,\n`;
  sqlContent += `  ADD CONSTRAINT registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;\n\n`;
  sqlContent += `-- Optional: Index on user_id\n`;
  sqlContent += `CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON public.registrations(user_id);\n\n`;


  sqlContent += `COMMIT;\n`;

  return { filename, content: sqlContent };
}

// --- Main Execution ---

try {
  // 1. Generate and write frontend questions file
  const frontendContent = generateFrontendQuestionsContent();
  // Ensure directory exists
  fs.mkdirSync(path.dirname(frontendQuestionsPath), { recursive: true });
  fs.writeFileSync(frontendQuestionsPath, frontendContent, 'utf-8');
  console.log(`Successfully generated ${path.basename(frontendQuestionsPath)}`);

  // 2. Ensure schema usage in actions file
  const originalActionsContent = fs.existsSync(actionsPath) ? fs.readFileSync(actionsPath, 'utf-8') : '';
  const updatedActionsContent = ensureSchemaUsageInActions();
   if (updatedActionsContent !== originalActionsContent) {
       fs.writeFileSync(actionsPath, updatedActionsContent, 'utf-8');
       console.log(`Successfully updated ${path.basename(actionsPath)} with schema usage.`);
   } else {
        console.log(`${path.basename(actionsPath)} already up-to-date regarding schema usage.`);
   }


  // 3. Generate and write draft SQL migration
  const { filename: migrationFilename, content: migrationContent } = generateSqlMigrationContent();
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
    console.log(`Created migrations directory: ${migrationsDir}`);
  }
  const migrationPath = path.join(migrationsDir, migrationFilename);
  fs.writeFileSync(migrationPath, migrationContent, 'utf-8');
  console.log(`Successfully generated draft migration: ${migrationFilename}`);
  console.log("---");
  console.log("IMPORTANT: Review the generated migration file before applying it to your database!");
  console.log(`Migration file path: ${path.relative(process.cwd(), migrationPath)}`);
  console.log("---");


  console.log("SSOT generation script completed successfully.");

} catch (error) {
  console.error("Error running SSOT generation script:", error);
  process.exit(1);
}