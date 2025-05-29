const pool = require('../config/db');

exports.addWeddingHall = async (req, res) => {
  const { nomi, sigim, narx, telefon, rayon, address, owner_id, images } = req.body;

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

exports.approveWeddingHall = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      UPDATE Toyxona
      SET Status = 'approved'
      WHERE Toyxona_Id = $1
      RETURNING *;
    `;
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Toyxona topilmadi' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server xatosi' });
  }
};

exports.getWeddingHalls = async (req, res) => {
  const { search, rayon, sort_by, order = 'asc', status } = req.query;

  try {
    let query = `
      SELECT t.*, r.Rayon_Name
      FROM Toyxona t
      JOIN Rayonlar r ON t.Rayon = r.Rayon_Id
      WHERE 1=1
    `;
    const values = [];

    if (search) {
      query += ` AND t.Nomi ILIKE $${values.length + 1}`;
      values.push(`%${search}%`);
    }
    if (rayon) {
      query += ` AND t.Rayon = $${values.length + 1}`;
      values.push(rayon);
    }
    if (status) {
      query += ` AND t.Status = $${values.length + 1}`;
      values.push(status);
    }
    if (sort_by) {
      const validSortFields = ['Narx', 'Sigim'];
      const sortField = validSortFields.includes(sort_by) ? sort_by : 'Nomi';
      query += ` ORDER BY t.${sortField} ${order.toLowerCase() === 'desc' ? 'DESC' : 'ASC'}`;
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server xatosi' });
  }
};

exports.deleteWeddingHall = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      DELETE FROM Toyxona
      WHERE Toyxona_Id = $1
      RETURNING *;
    `;
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Toyxona topilmadi' });
    }

    res.json({ message: 'Toyxona muvaffaqiyatli o‘chirildi', data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server xatosi' });
  }
};

exports.cancelBooking = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      DELETE FROM Bronlar
      WHERE Bron_Id = $1
      RETURNING *;
    `;
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Bron topilmadi' });
    }

    res.json({ message: 'Bron muvaffaqiyatli bekor qilindi', data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server xatosi' });
  }
};

exports.getBookings = async (req, res) => {
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
      WHERE 1=1
    `;
    const values = [];

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

exports.updateWeddingHall = async (req, res) => {
  const { id } = req.params;
  const { nomi, sigim, narx, telefon, rayon, address, owner_id, images } = req.body;

  try {
    const updateQuery = `
      UPDATE Toyxona
      SET Nomi = $1, Sigim = $2, Narx = $3, Telefon = $4, Rayon = $5, Address = $6, Owner_Id = $7
      WHERE Toyxona_Id = $8
      RETURNING *;
    `;
    const updateValues = [nomi, sigim, narx, telefon, rayon, address, owner_id, id];
    const result = await pool.query(updateQuery, updateValues);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'To‘yxona topilmadi' });
    }

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

exports.getWeddingHallDetails = async (req, res) => {
  const { id } = req.params;
  const { start_date = '2025-01-01', end_date = '2025-12-31' } = req.query;

  try {
    // To‘yxona ma’lumotlarini olish
    const hallQuery = `
      SELECT t.*, r.Rayon_Name
      FROM Toyxona t
      JOIN Rayonlar r ON t.Rayon = r.Rayon_Id
      WHERE t.Toyxona_Id = $1;
    `;
    const hallResult = await pool.query(hallQuery, [id]);

    if (hallResult.rows.length === 0) {
      return res.status(404).json({ error: 'To‘yxona topilmadi' });
    }

    const hall = hallResult.rows[0];

    // Bronlarni olish
    const bookingsQuery = `
      SELECT b.Sana, b.Odem_Soni, u.Ism, u.Familiya, u.Phone
      FROM Bronlar b
      JOIN Users u ON b.User_Id = u.User_Id
      WHERE b.Toyxona_Id = $1
      AND b.Status = 'upcoming'
      AND b.Sana BETWEEN $2 AND $3;
    `;
    const bookingsResult = await pool.query(bookingsQuery, [id, start_date, end_date]);

    // Bronlarni log qilish (debug uchun)
    console.log('Bookings:', bookingsResult.rows);

    // Kalendar ma’lumotlarini tayyorlash
    const calendar = [];
    let currentDate = new Date(start_date);
    const endDate = new Date(end_date);

    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      const booking = bookingsResult.rows.find(b => b.Sana === dateString);

      if (booking) {
        calendar.push({
          date: dateString,
          status: 'booked',
          details: {
            odem_soni: booking.Odem_Soni,
            ism: booking.Ism,
            familiya: booking.Familiya,
            phone: booking.Phone
          }
        });
      } else {
        calendar.push({
          date: dateString,
          status: 'available'
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      weddingHall: hall,
      calendar: calendar
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server xatosi' });
  }
};

exports.getOwners = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT t.Owner_Id, o.Ism, o.Familiya, o.Phone,
             array_agg(t.Nomi) AS wedding_halls
      FROM Toyxona t
      JOIN Owner o ON o.Owner_Id = t.Owner_Id
      GROUP BY t.Owner_Id, o.Ism, o.Familiya, o.Phone
      ORDER BY t.Owner_Id;
    `;
    const result = await pool.query(query);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server xatosi' });
  }
};