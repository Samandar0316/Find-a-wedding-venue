const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/book', userController.bookWeddingHall);
router.get('/bookings', userController.getUserBookings);
router.get('/available-dates/:toyxona_id', userController.getAvailableDates);
router.post('/my-bookings', userController.getMyBookings);
router.get('/wedding-halls', userController.getWeddingHalls);

module.exports = router;