/**
 * MCP SDK Compatibility Patch Script
 *
 * This script modifies the MCP SDK files to ensure compatibility with Electron environments
 * and older Node.js versions that don't fully support the 'node:' protocol prefix.
 *
 * The Problem:
 * - Node.js 16+ introduced a 'node:' prefix for built-in modules (e.g., 'node:fs')
 *   which makes it explicit that you're importing a Node.js core module
 * - However, Electron (especially in older versions) and some Node.js environments
 *   don't fully support this syntax, causing runtime errors
 * - When running in an Electron context, these imports cause errors like:
 *   "Cannot find module 'node:fs'" or similar
 *
 * The Solution:
 * - This script finds and removes all 'node:' prefixes from import statements
 *   and require() calls in the MCP SDK files
 * - This allows the SDK to work in both modern Node.js and Electron environments
 *
 * When to run this script:
 * - After installing or updating the MCP SDK dependencies
 * - Before building your Electron application
 */

const fs = require('fs')

// Define the files that need node: import prefix removal
const filesToModify = [
  'node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js',
  'node_modules/@modelcontextprotocol/sdk/dist/cjs/client/stdio.js',
]

// Process each file
filesToModify.forEach((filePath) => {
  if (fs.existsSync(filePath)) {
    console.log(`🔍 Processing file: ${filePath}`)
    let content = fs.readFileSync(filePath, 'utf8')

    // Replace node: prefix imports for compatibility with older Node.js versions
    // The following replacements convert modern imports like:
    //   import { spawn } from 'node:child_process'
    // to compatible versions like:
    //   import { spawn } from 'child_process'
    content = content.replace(/from ["']node:child_process["']/g, 'from "child_process"')
    content = content.replace(/from ["']node:process["']/g, 'from "process"')
    content = content.replace(/from ["']node:fs["']/g, 'from "fs"')
    content = content.replace(/from ["']node:path["']/g, 'from "path"')
    content = content.replace(/from ["']node:os["']/g, 'from "os"')
    content = content.replace(/from ["']node:util["']/g, 'from "util"')
    content = content.replace(/from ["']node:events["']/g, 'from "events"')

    // Replace require('node:...') form
    // This converts calls like:
    //   const fs = require('node:fs')
    // to compatible versions like:
    //   const fs = require('fs')
    content = content.replace(/require\(["']node:([^"']+)["']\)/g, 'require("$1")')

    // Write back to file
    fs.writeFileSync(filePath, content)
    console.log(`✅ Modified imports in file: ${filePath} (removed 'node:' prefixes for compatibility)`)
  } else {
    console.log(`⚠️ File not found, skipping: ${filePath}`)
  }
})

console.log(
  '🎉 Import modification completed successfully! SDK files are now compatible with MQTTX Electron environment.',
)

// Now patch the pkce-challenge module which has modern syntax issues
const pkceChallengePath = 'node_modules/pkce-challenge/dist/index.node.js'

if (fs.existsSync(pkceChallengePath)) {
  console.log(`🔍 Processing pkce-challenge module: ${pkceChallengePath}`)

  // Replace the entire file content with a compatible implementation
  const replacementCode = `
let crypto = require('crypto');
/**
 * Creates an array of length \`size\` of random bytes
 * @param size
 */
function randomBytes(size) {
    return crypto.randomBytes(size);
}
/**
 * Creates a base64url encoded challenge string of random bytes
 * @param size Size in bytes
 */
function generateChallenge(size = 32) {
    const bytes = randomBytes(size);
    const challenge = base64url(bytes);
    return challenge;
}
/**
 * Encodes a buffer object as a base64url string
 * @param buffer Raw buffer data
 */
function base64url(buffer) {
    return buffer.toString('base64')
        .replace(/\\+/g, '-')
        .replace(/\\//g, '_')
        .replace(/=+$/, '');
}
/**
 * Creates and returns PKCE challenge and verifier strings
 */
function pkceChallenge() {
    const verifier = generateChallenge();
    const sha256 = crypto.createHash("sha256").update(verifier).digest();
    const challenge = base64url(sha256);
    return { code_challenge: challenge, code_verifier: verifier };
}
module.exports = pkceChallenge;
module.exports.default = pkceChallenge;
`

  // Write the replacement implementation to the file
  fs.writeFileSync(pkceChallengePath, replacementCode)
  console.log(`✅ Successfully patched pkce-challenge module with compatible implementation!`)
} else {
  console.log(`⚠️ pkce-challenge module not found at: ${pkceChallengePath}`)
}
