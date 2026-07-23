const fs = require('fs');
const readline = require('readline');

const path = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\3fc20d40-49f2-4401-9871-cba510124483\\.system_generated\\logs\\transcript_full.jsonl';

async function processLineByLine() {
  const fileStream = fs.createReadStream(path);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let menuWorkspaceContent = null;
  let menuServiceContent = null;
  let menuWorkspaceCounter = 0;
  let menuServiceCounter = 0;

  for await (const line of rl) {
    try {
      const data = JSON.parse(line);
      if (data.type === 'PLANNER_RESPONSE' && data.tool_calls) {
        for (const tc of data.tool_calls) {
          if (tc.name === 'write_to_file') {
            const target = tc.arguments.TargetFile || '';
            if (target.includes('MenuWorkspace.tsx')) {
              menuWorkspaceContent = tc.arguments.CodeContent;
              menuWorkspaceCounter++;
            }
          }
          if (tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
            const target = tc.arguments.TargetFile || '';
            // For replace_file_content we'd have to reconstruct the file.
            // Let's just track if they were modified.
          }
        }
      }
    } catch (e) {}
  }
  
  console.log(`MenuWorkspace.tsx modified times via write_to_file: ${menuWorkspaceCounter}`);
  if (menuWorkspaceCounter > 1) {
    // If I wrote it multiple times, I want the second-to-last or the one before the current session.
    // Actually, I can just write out the history to a file so I can inspect it.
  }
}
processLineByLine();
