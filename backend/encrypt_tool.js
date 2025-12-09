const bcrypt = require('bcrypt');

const password = process.argv[2];

if (!password) {
    console.log('Por favor proporciona una contraseña. Ejemplo: node encrypt_tool.js "mi_contraseña"');
    process.exit(1);
}

bcrypt.hash(password, 10).then(hash => {
    console.log('\n--- CONTRASEÑA ENCRIPTADA ---');
    console.log(hash);
    console.log('-----------------------------\n');
    console.log('Copia este valor largo y pégalo en la columna "contraseña" de tu tabla "usuarios".');
});
