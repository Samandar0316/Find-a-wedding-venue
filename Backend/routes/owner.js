const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');

// Owner ro‘yxatdan o‘tkazish
router.post('/signup', ownerController.signup);

// Owner login
router.post('/login', ownerController.login);

// To’yxona ro‘yxatdan o‘tkazish
router.post('/register-hall', ownerController.registerWeddingHall);

// To’yxona ma’lumotlarini o‘zgartirish
router.put('/update-hall/:id', ownerController.updateWeddingHall);

// O‘z to’yxonasidagi bronlarni ko‘rish
router.get('/bookings/:owner_id', ownerController.getOwnerBookings);

// O‘z to’yxonasidagi bronni bekor qilish
router.delete('/cancel-booking/:id/:owner_id', ownerController.cancelOwnerBooking);

module.exports = router;