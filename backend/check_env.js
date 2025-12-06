const dotenv = require('dotenv');
const result = dotenv.config({ path: './datos.env' });

if (result.error) {
    console.log('Error loading datos.env:', result.error);
} else {
    console.log('datos.env loaded successfully');
}

console.log('RAW DB_HOST:', process.env.DB_HOST);
console.log('RAW DB_USER:', process.env.DB_USER);
