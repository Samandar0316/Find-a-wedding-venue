const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Owner ro‘yxatdan o‘tkazish (signup)
exports.signup = async (req, res) => {
  const { ism, familiya, username, password, phone } = req.body;

  try {
    if (!ism || !familiya || !username || !password || !phone) {
      return res.status(400).json({ error: 'Barcha maydonlar to‘ldirilishi kerak' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO Owner (Ism, Familiya, Username, Password, Phone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING Owner_Id, Ism, Familiya, Username, Phone;
    `;
    const values = [ism, familiya, username, hashedPassword, phone];
    const result = await pool.query(query, values);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
};

// Owner login
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    console.log('Login request body:', req.body);

    if (!username || !password) {
      return res.status(400).json({ error: 'Username va parol kiritilishi kerak' });
    }

    const query = `
      SELECT owner_id, ism, familiya, username, password, phone 
      FROM Owner
      WHERE username = $1;
    `;
    const result = await pool.query(query, [username]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    const owner = result.rows[0];
    console.log('Owner data:', owner);

    if (!owner.password) {
      return res.status(500).json({ error: 'Foydalanuvchi paroli saqlanmagan' });
    }

    const isMatch = await bcrypt.compare(password, owner.password);
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ error: 'Parol xato' });
    }

    res.json({
      owner_id: owner.owner_id,
      ism: owner.ism,
      familiya: owner.familiya,
      phone: owner.phone
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
};
// To’yxona ro‘yxatdan o‘tkazish (Owner tomonidan)
exports.registerWeddingHall = async (req, res) => {
  const { nomi, sigim, narx, telefon, rayon, address, owner_id } = req.body;

  // Multer orqali kelgan fayllarni URL ko‘rinishiga o‘tkazamiz
  const images = req.files?.map(file => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`);

  try {
    const query = `
      INSERT INTO Toyxona (Nomi, Sigim, Narx, Telefon, Status, Rayon, Address, Owner_Id)
      VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7)
      RETURNING *;
    `;
    const values = [nomi, sigim, narx, telefon, rayon, address, owner_id];
    const result = await pool.query(query, values);

    if (images && images.length > 0) {
      const imageQuery = `
        INSERT INTO Toy_Images (Toyxona_Id, Url)
        VALUES ($1, $2);
      `;
      for (const url of images) {
        await pool.query(imageQuery, [result.rows[0].Toyxona_Id, url]);
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server xatosi' });
  }
};

// To’yxona ma’lumotlarini o‘zgartirish (Owner tomonidan)
exports.updateWeddingHall = async (req, res) => {
  const { id } = req.params;
  const { nomi, sigim, narx, telefon, rayon, address, owner_id, images } = req.body;

  try {
    // Faqat o‘z to’yxonasini o‘zgartirishi uchun tekshirish
    const checkQuery = `
      SELECT * FROM Toyxona
      WHERE Toyxona_Id = $1 AND Owner_Id = $2;
    `;
    const checkResult = await pool.query(checkQuery, [id, owner_id]);

    if (checkResult.rowCount === 0) {
      return res.status(403).json({ error: 'Bu to’yxona sizga tegishli emas yoki topilmadi' });
    }

    const updateQuery = `
      UPDATE Toyxona
      SET Nomi = $1, Sigim = $2, Narx = $3, Telefon = $4, Rayon = $5, Address = $6, Owner_Id = $7
      WHERE Toyxona_Id = $8
      RETURNING *;
    `;
    const updateValues = [nomi, sigim, narx, telefon, rayon, address, owner_id, id];
    const result = await pool.query(updateQuery, updateValues);

    if (images && images.length > 0) {
      await pool.query('DELETE FROM Toy_Images WHERE Toyxona_Id = $1', [id]);
      const imageQuery = `
        INSERT INTO Toy_Images (Toyxona_Id, Url)
        VALUES ($1, $2);
      `;
      for (const url of images) {
        await pool.query(imageQuery, [id, url]);
      }
    }

    res.json({
      message: 'To‘yxona muvaffaqiyatli yangilandi',
      weddingHall: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server xatosi' });
  }
};

// O‘z to’yxonasidagi bronlarni ko‘rish
exports.getOwnerBookings = async (req, res) => {
  const { owner_id } = req.params;
  const { sort_by = 'sana', order = 'asc', toyxona, rayon, status } = req.query;

  try {
    let query = `
      SELECT 
        b.Bron_Id,
        t.Nomi AS Toyxona_Nomi,
        r.Rayon_Name,
        b.Sana,
        b.Odem_Soni,
        u.Ism,
        u.Familiya,
        u.Phone,
        b.Status
      FROM Bronlar b
      JOIN Toyxona t ON b.Toyxona_Id = t.Toyxona_Id
      JOIN Users u ON b.User_Id = u.User_Id
      JOIN Rayonlar r ON t.Rayon = r.Rayon_Id
      WHERE t.Owner_Id = $1
    `;
    const values = [owner_id];

    if (toyxona) {
      query += ` AND t.Nomi ILIKE $${values.length + 1}`;
      values.push(`%${toyxona}%`);
    }
    if (rayon) {
      query += ` AND r.Rayon_Id = $${values.length + 1}`;
      values.push(rayon);
    }
    if (status) {
      query += ` AND b.Status = $${values.length + 1}`;
      values.push(status);
    }

    if (sort_by) {
      const validSortFields = ['sana', 'toyxona_nomi', 'rayon_name', 'status'];
      const sortField = validSortFields.includes(sort_by.toLowerCase()) ? sort_by.toLowerCase() : 'sana';
      const fieldMapping = {
        sana: 'b.Sana',
        toyxona_nomi: 't.Nomi',
        rayon_name: 'r.Rayon_Name',
        status: 'b.Status'
      };
      query += ` ORDER BY ${fieldMapping[sortField]} ${order.toLowerCase() === 'desc' ? 'DESC' : 'ASC'}`;
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server xatosi' });
  }
};

// O‘z to’yxonasidagi bronni bekor qilish
exports.cancelOwnerBooking = async (req, res) => {
  const { id, owner_id } = req.params;

  try {
    const query = `
      DELETE FROM Bronlar b
      USING Toyxona t
      WHERE b.Bron_Id = $1
      AND b.Toyxona_Id = t.Toyxona_Id
      AND t.Owner_Id = $2
      RETURNING b.*;
    `;
    const result = await pool.query(query, [id, owner_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Bron topilmadi yoki bu to’yxona sizga tegishli emas' });
    }

    res.json({ message: 'Bron muvaffaqiyatli bekor qilindi', data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server xatosi' });
  }
};  