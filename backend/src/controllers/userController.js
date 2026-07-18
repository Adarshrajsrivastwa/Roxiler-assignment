const db = require('../db');

// 1. Get list of all stores for Normal User (includes overall rating and user's specific submitted rating)
exports.getStoresForUser = async (req, res) => {
  const userId = req.user.id;
  const { search = '', sortBy = 'name', sortOrder = 'ASC' } = req.query;

  const allowedSortFields = ['name', 'address', 'rating'];
  const cleanSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
  const cleanSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  try {
    let sql = `
      SELECT 
        s.id, s.name, s.email, s.address, s.logo_url,
        COALESCE(AVG(r.rating), 0) as overall_rating,
        COUNT(r.id) as rating_count,
        (SELECT rating FROM ratings WHERE user_id = ? AND store_id = s.id) as user_rating,
        (SELECT id FROM ratings WHERE user_id = ? AND store_id = s.id) as rating_id
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
    `;
    
    const params = [userId, userId];

    // Filter by name and address
    if (search.trim()) {
      sql += ` WHERE s.name LIKE ? OR s.address LIKE ?`;
      const likeParam = `%${search}%`;
      params.push(likeParam, likeParam);
    }

    sql += ` GROUP BY s.id`;

    // Sorting
    if (cleanSortBy === 'rating') {
      sql += ` ORDER BY overall_rating ${cleanSortOrder}`;
    } else {
      sql += ` ORDER BY s.${cleanSortBy} ${cleanSortOrder}`;
    }

    const stores = await db.query(sql, params);
    return res.json(stores);
  } catch (err) {
    console.error('Get user stores error:', err);
    return res.status(500).json({ error: 'Failed to retrieve store listings.' });
  }
};

// 2. Submit rating for a store (1 to 5)
exports.submitRating = async (req, res) => {
  const userId = req.user.id;
  const { storeId, rating } = req.body;

  const intRating = parseInt(rating);
  if (!storeId || isNaN(intRating) || intRating < 1 || intRating > 5) {
    return res.status(400).json({ error: 'Please select a store and a rating between 1 and 5.' });
  }

  try {
    // Check if store exists
    const store = await db.query('SELECT id FROM stores WHERE id = ?', [storeId]);
    if (store.length === 0) {
      return res.status(404).json({ error: 'Store not found.' });
    }

    // Check if user already rated this store
    const existingRating = await db.query('SELECT id FROM ratings WHERE user_id = ? AND store_id = ?', [userId, storeId]);
    if (existingRating.length > 0) {
      return res.status(400).json({ error: 'You have already rated this store. Please modify your rating instead.' });
    }

    await db.query(
      'INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)',
      [userId, storeId, intRating]
    );

    return res.status(201).json({ message: 'Rating submitted successfully!' });
  } catch (err) {
    console.error('Submit rating error:', err);
    return res.status(500).json({ error: 'Failed to submit rating.' });
  }
};

// 3. Modify rating
exports.modifyRating = async (req, res) => {
  const userId = req.user.id;
  const ratingId = req.params.id;
  const { rating } = req.body;

  const intRating = parseInt(rating);
  if (isNaN(intRating) || intRating < 1 || intRating > 5) {
    return res.status(400).json({ error: 'Please enter a valid rating between 1 and 5.' });
  }

  try {
    // Check if rating exists and belongs to the user
    const existingRating = await db.query('SELECT id FROM ratings WHERE id = ? AND user_id = ?', [ratingId, userId]);
    if (existingRating.length === 0) {
      return res.status(404).json({ error: 'Rating not found or unauthorized.' });
    }

    await db.query('UPDATE ratings SET rating = ? WHERE id = ?', [intRating, ratingId]);

    return res.json({ message: 'Rating updated successfully!' });
  } catch (err) {
    console.error('Modify rating error:', err);
    return res.status(500).json({ error: 'Failed to modify rating.' });
  }
};
