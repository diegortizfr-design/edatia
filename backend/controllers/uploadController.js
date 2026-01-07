const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'erpod_products',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const upload = multer({ storage: storage });

exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No se subió ningún archivo' });
        }

        res.json({
            success: true,
            url: req.file.path,
            public_id: req.file.filename
        });
    } catch (error) {
        console.error('Error in uploadImage:', error);
        res.status(500).json({ success: false, message: 'Error al subir la imagen a Cloudinary' });
    }
};

exports.uploadMiddleware = upload.single('image');
