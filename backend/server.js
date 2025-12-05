// backend/server.js
const http = require('http');
const app = require('./app');
const dotenv = require('dotenv');
dotenv.config({ path: './datos.env' });

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // en ambiente prod: process.exit(1)
});
