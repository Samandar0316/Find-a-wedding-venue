const multer = require('multer');
const path = require('path');

// Saqlash joyini sozlash
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // uploads/ papkasiga saqlanadi
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Faqat rasm fayllarini qabul qilish
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Faqat rasm fayllarini yuklash mumkin'), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
