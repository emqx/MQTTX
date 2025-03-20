<template>
  <div class="message-render">
    <div v-for="(part, index) in parsedContent" :key="index">
      <MCP-call-card v-if="part.type === 'mcp'" :content="part.content" />
      <vue-markdown
        v-else
        class="chat-content"
        :data-prismjs-copy="copyText"
        :data-prismjs-copy-error="copyFailedText"
        :data-prismjs-copy-success="copiedText"
        :data-prismjs-line-numbers="true"
        data-download-link
        data-download-link-label="Download this file"
        :source="part.content"
        :anchor-attributes="{ target: '_blank' }"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import VueMarkdown from 'vue-markdown'
import MCPCallCard from './MCPCallCard.vue'

interface ContentPart {
  type: 'text' | 'mcp'
  content: string
}

@Component({
  components: {
    VueMarkdown,
    MCPCallCard,
  },
})
export default class MessageRender extends Vue {
  @Prop({ required: true }) readonly content!: string
  @Prop({ default: 'Copy' }) readonly copyText!: string
  @Prop({ default: 'Copy failed' }) readonly copyFailedText!: string
  @Prop({ default: 'Copied' }) readonly copiedText!: string

  parsedContent: ContentPart[] = []
  private lastContent = ''

  @Watch('content', { immediate: true })
  onContentChange(newContent: string) {
    // Only re-parse if content has actually changed
    if (this.lastContent !== newContent) {
      this.lastContent = newContent
      this.parseContent()
    }
  }

  parseContent() {
    const parts: ContentPart[] = []
    let text = this.content

    // If there are no MCP calls, process the entire text
    if (!text.includes('<mcp-call>')) {
      if (text.length > 0) {
        parts.push({ type: 'text', content: text })
      }
    } else {
      // Process text with MCP calls
      this.parseTextWithMCPCalls(text, parts)
    }

    this.parsedContent = parts
  }

  parseTextWithMCPCalls(text: string, parts: ContentPart[]) {
    const startTag = '<mcp-call>'
    const endTag = '</mcp-call>'
    let startIndex = text.indexOf(startTag)

    // Process the text before the first MCP call
    if (startIndex > 0) {
      parts.push({
        type: 'text',
        content: text.substring(0, startIndex),
      })
    }

    // Process all MCP calls and text between them
    while (startIndex !== -1) {
      const contentStart = startIndex + startTag.length
      const endIndex = text.indexOf(endTag, contentStart)

      if (endIndex === -1) {
        // No end tag yet, so the MCP call is still streaming
        parts.push({
          type: 'mcp',
          content: text.substring(contentStart),
        })
        break
      }

      // Extract the MCP call content
      parts.push({
        type: 'mcp',
        content: text.substring(contentStart, endIndex),
      })

      // Look for the next MCP call
      startIndex = text.indexOf(startTag, endIndex + endTag.length)

      // Add text between MCP calls
      this.addTextBetweenMCPCalls(text, endIndex, endTag, startIndex, parts)
    }
  }

  addTextBetweenMCPCalls(text: string, endIndex: number, endTag: string, nextStartIndex: number, parts: ContentPart[]) {
    if (nextStartIndex === -1) {
      // No more MCP calls, so process the rest as text
      if (endIndex + endTag.length < text.length) {
        parts.push({
          type: 'text',
          content: text.substring(endIndex + endTag.length),
        })
      }
    } else {
      // There's another MCP call, so process the text between them
      parts.push({
        type: 'text',
        content: text.substring(endIndex + endTag.length, nextStartIndex),
      })
    }
  }
}
</script>

<style lang="scss">
/* MCP Tool Call result styles */
mcp-result {
  display: block;
  background-color: var(--color-bg-primary);
  border-radius: 8px;
  padding: 16px;
  margin: 12px 0;
  border: 1px solid var(--color-border-default);
}

mcp-result[success='true'] {
  background-color: #13ce661a;
  border: 1px solid #13ce664d;
}

mcp-result[success='false'] {
  background-color: #f56c6c1a;
  border: 1px solid #f56c6c4d;
}

mcp-result server,
mcp-result tool,
mcp-result args {
  display: block;
  margin-bottom: 10px;
  color: var(--color-text-default);
}

mcp-result server::before {
  content: 'Server: ';
  color: var(--color-text-light);
  margin-right: 4px;
}

mcp-result tool::before {
  content: 'Tool: ';
  color: var(--color-text-light);
  margin-right: 4px;
}

mcp-result args::before {
  content: 'Arguments: ';
  color: var(--color-text-light);
  margin-right: 4px;
}

mcp-result result,
mcp-result error {
  display: block;
  margin-top: 10px;
  background-color: transparent;
  border-radius: 0;
  overflow-x: auto;
  color: var(--color-text-default);
  font-size: 14px;
}

mcp-result result::before {
  content: 'Result:';
  display: block;
  margin-bottom: 8px;
  color: var(--color-text-light);
}

mcp-result error::before {
  content: 'Error:';
  display: block;
  margin-bottom: 8px;
  color: var(--color-text-light);
}
</style>
