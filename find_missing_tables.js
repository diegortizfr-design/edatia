const fs = require('fs');
const path = require('path');

function getModelsFromSchema() {
  const schemaPath = path.join(__dirname, 'backend', 'prisma', 'schema.prisma');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const modelRegex = /^model\s+(\w+)\s+\{/gm;
  const models = [];
  let match;
  while ((match = modelRegex.exec(schema)) !== null) {
    models.push(match[1]);
  }
  return models;
}

function getCreatedTablesFromMigrations() {
  const migrationsDir = path.join(__dirname, 'backend', 'prisma', 'migrations');
  const sqlFiles = [];

  function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else if (file === 'migration.sql') {
        sqlFiles.push(fullPath);
      }
    }
  }

  walk(migrationsDir);

  const tables = new Set();
  for (const file of sqlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    // Match CREATE TABLE "TableName"
    const createTableRegex = /CREATE TABLE (?:IF NOT EXISTS )?"([^"]+)"/g;
    let match;
    while ((match = createTableRegex.exec(content)) !== null) {
      tables.add(match[1]);
    }
  }
  return tables;
}

const models = getModelsFromSchema();
const createdTables = getCreatedTablesFromMigrations();

console.log('Total models in schema.prisma:', models.length);
console.log('Total tables created in migrations:', createdTables.size);

const missing = [];
for (const model of models) {
  if (!createdTables.has(model)) {
    missing.push(model);
  }
}

console.log('Models missing CREATE TABLE in migrations:', missing);
