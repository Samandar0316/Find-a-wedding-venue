const pool = require('../config/db');
const bcrypt = require('bcrypt');

const bookWeddingHall = async (req, res) => {
  const { toyxona_id, sana, odem_soni, ism, familiya, phone, username, password } = req.body;

  if (!toyxona_id || !sana || !odem_soni || !ism || !familiya || !phone || !username || !password) {
    return res.status(400).json({ error: 'Barcha maydonlar to‘ldirilishi kerak' });
  }

  try {
    let user;
    const userCheckQuery = 'SELECT * FROM Users WHERE Username = $1';
    const userCheckResult = await pool.query(userCheckQuery, [username]);

    if (userCheckResult.rows.length > 0) {
      user = userCheckResult.rows[0];
      const isMatch = await bcrypt.compare(password, user.Password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Noto‘g‘ri parol' });
      }
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const userInsertQuery = `
        INSERT INTO Users (Ism, Familiya, Phone, Username, Password)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const userInsertValues = [ism, familiya, phone, username, hashedPassword];
      const userInsertResult = await pool.query(userInsertQuery, userInsertValues);
      user = userInsertResult.rows[0];
    }

    const toyxonaQuery = 'SELECT * FROM Toyxona WHERE Toyxona_Id = $1 AND Status = $2';
    const toyxonaResult = await pool.query(toyxonaQuery, [toyxona_id, 'approved']);
    if (toyxonaResult.rows.length === 0) {
      return res.status(404).json({ error: 'To‘yxona topilmadi yoki tasdiqlanmagan' });
    }

    const bookingCheckQuery = `
      SELECT * FROM Bronlar
      WHERE Toyxona_Id = $1 AND Sana = $2 AND Status != 'cancelled';
    `;
    const bookingCheckResult = await pool.query(bookingCheckQuery, [toyxona_id, sana]);
    if (bookingCheckResult.rows.length > 0) {
      return res.status(400).json({ error: 'Bu sanada to‘yxona band' });
    }

    const bookingInsertQuery = `
      INSERT INTO Bronlar (Toyxona_Id, User_Id, Sana, Odem_Soni, Status)
      VALUES ($1, $2, $3::DATE, $4, 'upcoming')
      RETURNING *;
    `;
    const bookingInsertValues = [toyxona_id, user.User_Id, sana, odem_soni];
    const bookingResult = await pool.query(bookingInsertQuery, bookingInsertValues);

    res.status(201).json({
      message: 'To‘yxona muvaffaqiyatli bron qilindi',
      booking: bookingResult.rows[0],
      user: { id: user.User_Id, username: user.Username }
    });
  } catch (error) {
    console.error('Xato:', error.message);
    res.status(500).json({ error: 'Server xatosi: ' + error.message });
  }
};

const getUserBookings = async (req, res) => {
  try {
    const bookingsQuery = `
      SELECT 
        b.Bron_Id,
        t.Nomi AS Toyxona_Nomi,
        r.Rayon_Name,
        b.Sana,
        b.Odem_Soni,
        b.Status
      FROM Bronlar b
      JOIN Toyxona t ON b.Toyxona_Id = t.Toyxona_Id
      JOIN Rayonlar r ON t.Rayon = r.Rayon_Id;
    `;
    const bookingsResult = await pool.query(bookingsQuery);

    res.json(bookingsResult.rows);
  } catch (error) {
    console.error('Xato:', error.message);
    res.status(500).json({ error: 'Server xatosi: ' + error.message });
  }
};

const getAvailableDates = async (req, res) => {
  const { toyxona_id } = req.params;
  const { start_date, end_date } = req.query;

  try {
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date va end_date kerak' });
    }

    const toyxonaQuery = 'SELECT * FROM Toyxona WHERE Toyxona_Id = $1 AND Status = $2';
    const toyxonaResult = await pool.query(toyxonaQuery, [toyxona_id, 'approved']);
    if (toyxonaResult.rows.length === 0) {
      return res.status(404).json({ error: 'To‘yxona topilmadi yoki tasdiqlanmagan' });
    }

    const bookedDatesQuery = `
      SELECT Sana
      FROM Bronlar
      WHERE Toyxona_Id = $1 AND Status != 'cancelled'
      AND Sana BETWEEN $2 AND $3;
    `;
    const bookedDatesResult = await pool.query(bookedDatesQuery, [toyxona_id, start_date, end_date]);
    const bookedDates = bookedDatesResult.rows.map(row => row.Sana);

    const availableDates = [];
    let currentDate = new Date(start_date);
    const endDate = new Date(end_date);

    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      if (!bookedDates.includes(dateString)) {
        availableDates.push(dateString);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({ toyxona_id, available_dates: availableDates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMyBookings = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ error: 'Username va password kerak' });
    }

    const userQuery = 'SELECT * FROM Users WHERE Username = $1';
    const userResult = await pool.query(userQuery, [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Noto‘g‘ri parol' });
    }

    const bookingsQuery = `
      SELECT 
        b.Bron_Id,
        t.Nomi AS Toyxona_Nomi,
        r.Rayon_Name,
        b.Sana,
        b.Odem_Soni,
        b.Status
      FROM Bronlar b
      JOIN Toyxona t ON b.Toyxona_Id = t.Toyxona_Id
      JOIN Rayonlar r ON t.Rayon = r.Rayon_Id
      WHERE b.User_Id = $1;
    `;
    const bookingsResult = await pool.query(bookingsQuery, [user.User_Id]);

    res.json(bookingsResult.rows);
  } catch (error) {
    console.error('Xato:', error.message);
    res.status(500).json({ error: 'Server xatosi: ' + error.message });
  }
};

const getWeddingHalls = async (req, res) => {
  const { priceSort, capacitySort, rayon, search } = req.query;

  try {
    let query = `
      SELECT 
        t.Toyxona_Id,
        t.Nomi,
        t.Sigim,
        t.Narx,
        t.Telefon,
        t.Address,
        r.Rayon_Name
      FROM Toyxona t
      JOIN Rayonlar r ON t.Rayon = r.Rayon_Id
      WHERE t.Status = 'approved'
    `;
    const values = [];

    // Filtrlash: Rayon bo‘yicha
    if (rayon) {
      query += ` AND r.Rayon_Id = $${values.length + 1}`;
      values.push(rayon);
    }

    // Qidiruv: Nomi bo‘yicha (katta-kichik harf sezgir emas)
    if (search) {
      query += ` AND t.Nomi ILIKE $${values.length + 1}`;
      values.push(`%${search}%`);
    }

    // Tartiblash: Narx bo‘yicha
    if (priceSort) {
      query += ` ORDER BY t.Narx ${priceSort === 'asc' ? 'ASC' : 'DESC'}`;
    }
    // Tartiblash: Sig‘im bo‘yicha (agar priceSort bo‘lmasa yoki qo‘shimcha tartib sifatida)
    else if (capacitySort) {
      query += ` ORDER BY t.Sigim ${capacitySort === 'asc' ? 'ASC' : 'DESC'}`;
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Xato:', error.message);
    res.status(500).json({ error: 'Server xatosi: ' + error.message });
  }
};

const cancelUserBooking = async (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;

  try {
    const userQuery = 'SELECT * FROM Users WHERE Username = $1';
    const userResult = await pool.query(userQuery, [username]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Noto‘g‘ri parol' });
    }

    const deleteQuery = `
      DELETE FROM Bronlar
      WHERE Bron_Id = $1 AND User_Id = $2
      RETURNING *;
    `;
    const result = await pool.query(deleteQuery, [id, user.User_Id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Bron topilmadi yoki sizga tegishli emas' });
    }

    res.json({ message: 'Bron muvaffaqiyatli bekor qilindi', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi: ' + error.message });
  }
};

module.exports = { bookWeddingHall, getUserBookings, getAvailableDates, getMyBookings, getWeddingHalls, cancelUserBooking };