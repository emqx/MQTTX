// scripts/patch-azure-sdk.js
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
      console.log(`✅ Successfully patched ${targetFilePath} with correct import path.`)
    } else if (content.includes(correctImport)) {
      console.log(`☑️ File already patched or has correct import: ${targetFilePath}. Skipping.`)
    } else {
      console.warn(
        `⚠️ Could not find the expected incorrect import statement in ${targetFilePath}. Patch script might need an update.`,
      )
    }
  } else {
    console.warn(`⚠️ Target file not found: ${targetFilePath}. Skipping patch. Maybe run yarn install?`)
  }
  console.log('🎉 Azure SDK patch process completed.')
} catch (error) {
  console.error(`❌ Error during Azure SDK patch process for ${targetFilePath}:`, error)
  process.exit(1) // Exit with error code if patching fails
}
