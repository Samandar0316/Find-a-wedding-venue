const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users'); 
const authRoutes = require('./routes/auth');
const ownerRoutes = require('./routes/owner');

const app = express();
const port = process.env.PORT || 7777;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/owner', ownerRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
});

app.listen(port, () => {
  console.log(`Server ${port}-portda ishga tushdi brat`);
});