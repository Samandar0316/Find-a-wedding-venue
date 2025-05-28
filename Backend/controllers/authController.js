const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const signup = async (req, res) => {
  const { role, username, password, first_name, last_name, phone } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    let query, values;

    if (role === 'admin') {
      query = `
        INSERT INTO Admin (Username, Password)
        VALUES ($1, $2)
        RETURNING Admin_Id, Username;
      `;
      values = [username, hashedPassword];
    } else if (role === 'owner') {
      query = `
        INSERT INTO Owner (Ism, Familiya, Username, Password, Phone)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING Owner_Id, Username;
      `;
      values = [first_name, last_name, username, hashedPassword, phone];
    } else {
      return res.status(400).json({ error: 'Noto‘g‘ri role' });
    }

    const result = await pool.query(query, values);
    res.status(201).json({ message: 'Muvaffaqiyatli ro‘yxatdan o‘tdi', user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server xatosi' });
  }
};

const login = async (req, res) => {
  const { username, password, role } = req.body;

  try {
    let query, result;

    if (role === 'admin') {
      query = 'SELECT * FROM Admin WHERE Username = $1';
      result = await pool.query(query, [username]);
      if (result.rows.length === 0) return res.status(401).json({ error: 'Admin topilmadi' });
    } else if (role === 'owner') {
      query = 'SELECT * FROM Owner WHERE Username = $1';
      result = await pool.query(query, [username]);
      if (result.rows.length === 0) return res.status(401).json({ error: 'Owner topilmadi' });
    } else {
      return res.status(400).json({ error: 'Noto‘g‘ri role' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.Password);

    if (!isMatch) return res.status(401).json({ error: 'Noto‘g‘ri parol' });

    const token = jwt.sign(
      { id: user[`${role}_Id`], username, role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Muvaffaqiyatli kirdingiz', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server xatosi' });
  }
};

module.exports = { signup, login };