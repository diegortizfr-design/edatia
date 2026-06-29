const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('Running prisma migrate diff inside backend...');
  const output = execSync('npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script', {
    cwd: path.join(__dirname, 'backend'),
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024 // 50MB
  });
  
  const destPath = path.join(__dirname, 'create_all_schema.sql');
  fs.writeFileSync(destPath, output, 'utf8');
  console.log('Successfully wrote SQL schema diff to create_all_schema.sql. Length:', output.length);
} catch (error) {
  console.error('Error generating schema diff:', error.message);
  if (error.stdout) console.error('Stdout:', error.stdout);
  if (error.stderr) console.error('Stderr:', error.stderr);
}
