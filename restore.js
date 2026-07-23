const fs = require('fs');
const readline = require('readline');

const path = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\3fc20d40-49f2-4401-9871-cba510124483\\.system_generated\\logs\\transcript_full.jsonl';

async function processLineByLine() {
  const fileStream = fs.createReadStream(path);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let contents = [];

  for await (const line of rl) {
    try {
      const data = JSON.parse(line);
      if (data.type === 'PLANNER_RESPONSE' && data.tool_calls) {
        for (const tc of data.tool_calls) {
          if (tc.name === 'write_to_file') {
            const target = tc.arguments.TargetFile || '';
            if (target.includes('MenuWizard.tsx') || target.includes('MenuWorkspace.tsx')) {
              contents.push(tc.arguments.CodeContent);
            }
          }
        }
      }
    } catch (e) {}
  }
  
  if (contents.length >= 2) {
    fs.writeFileSync('x:\\Internship Projects\\restaurant-pos\\client\\src\\components\\dashboard\\MenuWorkspace.tsx', contents[contents.length - 2]);
    console.log("Restored MenuWorkspace.tsx from previous history");
  } else if (contents.length === 1) {
    fs.writeFileSync('x:\\Internship Projects\\restaurant-pos\\client\\src\\components\\dashboard\\MenuWorkspace.tsx', contents[0]);
    console.log("Restored MenuWorkspace.tsx from only history");
  } else {
    console.log("Could not find full content");
  }
}
processLineByLine();
