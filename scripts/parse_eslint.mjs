import fs from 'fs';
const data = JSON.parse(fs.readFileSync('/dev/stdin', 'utf8'));
let totalW = 0, totalE = 0;
const errors = [];
const rules = {};
const files = {};
data.forEach(f => {
  totalW += f.warningCount;
  totalE += f.errorCount;
  f.messages.forEach(m => {
    const k = m.ruleId;
    rules[k] = (rules[k] || 0) + 1;
    const shortPath = f.filePath.replace(process.cwd() + '/', '');
    files[shortPath] = files[shortPath] || { w: 0, e: 0 };
    if (m.severity === 1) files[shortPath].w++;
    else {
      files[shortPath].e++;
      errors.push(`${shortPath}:${m.line}:${m.col} ${m.ruleId} - ${m.message}`);
    }
  });
});
console.log(`TOTAL: ${totalW} warnings, ${totalE} errors`);
if (errors.length > 0) {
  console.log('\n--- ERRORS ---');
  errors.forEach(e => console.log(e));
}
console.log('\n--- RULES BREAKDOWN ---');
Object.entries(rules).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`${v}x  ${k}`));
console.log('\n--- TOP FILES (by warnings) ---');
Object.entries(files).filter(([_, v]) => v.w > 0).sort((a, b) => b[1].w - a[1].w).slice(0, 20).forEach(([p, v]) => console.log(`${p} - ${v.w}w${v.e > 0 ? `, ${v.e}e` : ''}`));
