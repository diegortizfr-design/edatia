const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: 'df418bgrx',
    api_key: '484519111281134',
    api_secret: '4Fh2BDps5NHsBJ4tIFjiPM2X2TA'
});

module.exports = cloudinary;
