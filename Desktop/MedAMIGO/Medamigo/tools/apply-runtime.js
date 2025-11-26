const fs = require('fs');
const path = require('path');

const DEFAULT_INPUT = path.resolve(process.cwd(), 'faculdades.runtime.json');
const OUTPUT = path.resolve(
  process.cwd(),
  'src',
  'data',
  'faculdades.sample.json'
);

const input = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : DEFAULT_INPUT;

if (!fs.existsSync(input)) {
  console.error('Input file not found:', input);
  process.exit(2);
}

try {
  const raw = fs.readFileSync(input, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    console.error('Input JSON must be an array');
    process.exit(3);
  }
  fs.writeFileSync(OUTPUT, JSON.stringify(parsed, null, 2), 'utf8');
  console.log('Wrote runtime to', OUTPUT);
} catch (e) {
  console.error('Failed to apply runtime:', e.message || e);
  process.exit(1);
}
