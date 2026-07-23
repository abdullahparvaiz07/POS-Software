const fs = require('fs');

const content = fs.readFileSync('workspace_responses.txt', 'utf-8');
const chunks = content.split('====================');
chunks.forEach((c, i) => {
  fs.writeFileSync(`chunk_${i}.txt`, c.trim());
});
console.log(`Wrote ${chunks.length} chunks`);
