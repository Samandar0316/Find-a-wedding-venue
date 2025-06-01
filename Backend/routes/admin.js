const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const ownerController = require('../controllers/ownerController');
const adminController = require('../controllers/adminController');

// Yangi to‘yxona qo‘shish
router.post('/add-hall', adminController.addWeddingHall);

// To‘yxonani tasdiqlash
router.put('/approve-hall/:id', adminController.approveWeddingHall);

// Barcha to‘yxonalarni ko‘rish
router.get('/wedding-halls', adminController.getWeddingHalls);

// To‘yxonani o‘chirish
router.delete('/delete-hall/:id', adminController.deleteWeddingHall);

// Bronni bekor qilish
router.delete('/cancel-booking/:id', adminController.cancelBooking);

// Barcha bronlarni ko‘rish
router.get('/bookings', adminController.getBookings);

// To‘yxona ma’lumotlarini o‘zgartirish
router.put('/update-hall/:id', adminController.updateWeddingHall);

// Yakka to‘yxona ma’lumotlarini ko‘rish
router.get('/wedding-hall/:id', adminController.getWeddingHallDetails);

// Barcha to‘yxona egalarini ko‘rish
router.get('/owners', adminController.getOwners);

// Rasm(lar) bilan to‘yxona qo‘shish
router.post(
  '/register-hall',
  upload.array('images', 5), // maksimal 5 ta rasm
  ownerController.registerWeddingHall
);

module.exports = router;