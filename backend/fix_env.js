const fs = require('fs');

try {
    const content = fs.readFileSync('datos.env', 'utf8');
    const lines = content.split(/\r?\n/);
    const newLines = lines.map(line => {
        // Trim inputs to remove accidental spaces
        const trimmed = line.trim();
        if (trimmed.startsWith('DB_HOST=')) {
            return 'DB_HOST=217.21.77.0';
        }
        return trimmed; // Clean up other lines too
    });
    fs.writeFileSync('datos.env', newLines.join('\n'));
    console.log('Fixed datos.env host and formatting');
} catch (err) {
    console.error('Error fixing env:', err);
}
