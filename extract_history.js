const fs = require('fs');
const readline = require('readline');

const path = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\3fc20d40-49f2-4401-9871-cba510124483\\.system_generated\\logs\\transcript_full.jsonl';

async function extract() {
  const fileStream = fs.createReadStream(path);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let out = [];

  for await (const line of rl) {
    try {
      const data = JSON.parse(line);
      if (data.type === 'TOOL_RESPONSE' && data.content) {
        if (data.content.includes('MenuWorkspace.tsx') && (data.content.includes('export const MenuWorkspace') || data.content.includes('renderStep5'))) {
          // parse the view_file or Get-Content output
          let content = data.content;
          // Clean up line numbers if it's from view_file
          content = content.replace(/^[0-9]+: /gm, '');
          out.push(content);
        }
      }
    } catch (e) {}
  }
  
  fs.writeFileSync('workspace_responses.txt', out.join('\n\n====================\n\n'));
}
extract();
