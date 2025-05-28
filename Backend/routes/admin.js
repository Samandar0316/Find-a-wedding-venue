const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.post('/wedding-halls', adminController.addWeddingHall);
router.put('/wedding-halls/:id/approve', adminController.approveWeddingHall);
router.get('/wedding-halls', adminController.getWeddingHalls);
router.delete('/wedding-halls/:id', adminController.deleteWeddingHall);
router.delete('/bookings/:id', adminController.cancelBooking);
router.get('/bookings', adminController.getBookings);
router.put('/wedding-halls/:id', adminController.updateWeddingHall);
router.get('/wedding-halls/:id', adminController.getWeddingHallDetails);

module.exports = router;