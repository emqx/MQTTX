import { z } from 'zod/v4'
import { tool, ToolSet } from 'ai'
import { AgentToolDeps } from './types'
import { saveArchive } from '../files'

/**
 * Tools that write into the app's own data directory.
 *
 * `save_files` is read-only from the user's point of view: it never touches MQTTX data or the network,
 * so it does not need approval.
 */
export const createFileTools = (deps: AgentToolDeps): ToolSet => ({
  save_files: tool({
    title: 'Save project files',
    description:
      'Save a multi-file result as a downloadable zip: the source files, the dependency manifest ' +
      '(for example package.json or requirements.txt) and a README with the install and run steps. ' +
      'After saving, do not paste the code into the chat; reply with a short summary and how to run it. ' +
      'Paths are relative and must be unique ignoring case.',
    inputSchema: z.object({
      name: z.string().describe('Project name, used as the archive and folder name'),
      files: z
        .array(
          z.object({
            path: z.string().describe('Relative path, e.g. src/main.py'),
            content: z.string(),
          }),
        )
        .describe('Every file of the project'),
    }),
    execute: async ({ name, files }) => {
      const saved = await saveArchive({ conversationId: deps.getConversationId(), name, files })
      // The file contents are already in the zip; only metadata goes back to the model
      return {
        fileId: saved.fileId,
        name: saved.name,
        fileName: saved.fileName,
        downloadName: saved.downloadName,
        relativePath: saved.relativePath,
        size: saved.size,
        fileCount: saved.files.length,
      }
    },
  }),
})
