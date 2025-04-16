/**
 * Azure SDK ESM Import Compatibility Patch Script
 *
 * This script addresses an issue with unsupported ESM import paths in the Azure SDK module by replacing them
 * with compatible paths. This ensures that the module can be correctly resolved and executed in environments
 * that do not fully support ESM imports.
 *
 * The script performs the following actions:
 * - Checks if the target file exists in the specified path.
 * - Reads the file content and searches for the unsupported ESM import statement.
 * - Replaces the unsupported import with a compatible one if found.
 * - Logs the status of the patch process, indicating success, already patched, or if the target file is missing.
 * - Exits with an error code if the patching process encounters an error.
 *
 * Common error before patching:
 * ERROR  Failed to compile with 1 error                                         5:12:59 PM
 *
 * This dependency was not found:
 *
 * * @ai-sdk/openai/internal in ./node_modules/@ai-sdk/azure/dist/index.mjs
 *
 * To install it, you can run: npm install --save @ai-sdk/openai/internal
 * No type errors found
 * Version: typescript 4.9.5
 * Time: 4294ms
 */

const fs = require('fs')
const path = require('path')

const targetFilePath = path.join(__dirname, '..', 'node_modules', '@ai-sdk', 'azure', 'dist', 'index.mjs')
const incorrectImport = 'from "@ai-sdk/openai/internal";'
const correctImport = 'from "@ai-sdk/openai/internal/dist/index.js";' // Our successful fix

try {
  if (fs.existsSync(targetFilePath)) {
    console.log(`🔍 Processing file: ${targetFilePath}`)
    let content = fs.readFileSync(targetFilePath, 'utf8')

    if (content.includes(incorrectImport)) {
      content = content.replace(incorrectImport, correctImport)
      fs.writeFileSync(targetFilePath, content, 'utf8')
      console.log(`✅ Successfully patched ${targetFilePath} with compatible import path.`)
    } else if (content.includes(correctImport)) {
      console.log(`☑️ File already patched or has compatible import: ${targetFilePath}. Skipping.`)
    } else {
      console.warn(
        `⚠️ Could not find the expected unsupported import statement in ${targetFilePath}. Patch script might need an update.`,
      )
    }
  } else {
    console.warn(`⚠️ Target file not found: ${targetFilePath}. Skipping patch. Maybe run yarn install?`)
  }
  console.log('🎉 Azure SDK patch process completed.')
} catch (error) {
  console.error(`❌ Error during Azure SDK patch process for ${targetFilePath}:`, error)
  console.error(`📄 Error details: ${error.message}`)
  process.exit(1) // Exit with error code if patching fails
}
