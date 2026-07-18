const db = require('../db');

// 1. Get Store Owner Dashboard data (Store details, average rating, and list of users who rated their store)
exports.getOwnerDashboard = async (req, res) => {
  const ownerId = req.user.id;
  const { sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

  const allowedSortFields = ['reviewer_name', 'reviewer_email', 'rating', 'created_at'];
  const cleanSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
  const cleanSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  try {
    // Find store owned by this user
    const stores = await db.query('SELECT id, name, address, logo_url FROM stores WHERE owner_id = ?', [ownerId]);
    if (stores.length === 0) {
      return res.json({
        hasStore: false,
        message: 'No store has been assigned to your account yet. Please contact the administrator.'
      });
    }

    const store = stores[0];
    const storeId = store.id;

    // Get average rating
    const ratingStats = await db.query(`
      SELECT 
        COALESCE(AVG(rating), 0) as average_rating,
        COUNT(id) as total_ratings
      FROM ratings
      WHERE store_id = ?
    `, [storeId]);

    const averageRating = parseFloat(ratingStats[0].average_rating).toFixed(1);
    const totalRatings = ratingStats[0].total_ratings;

    // Get list of users who rated this store
    let reviewersSql = `
      SELECT 
        r.id as rating_id,
        r.rating,
        r.created_at,
        u.name as reviewer_name,
        u.email as reviewer_email,
        u.address as reviewer_address
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.store_id = ?
    `;

    // Map sort fields to sql
    let orderClause = '';
    if (cleanSortBy === 'reviewer_name') {
      orderClause = `ORDER BY u.name ${cleanSortOrder}`;
    } else if (cleanSortBy === 'reviewer_email') {
      orderClause = `ORDER BY u.email ${cleanSortOrder}`;
    } else if (cleanSortBy === 'rating') {
      orderClause = `ORDER BY r.rating ${cleanSortOrder}`;
    } else {
      orderClause = `ORDER BY r.created_at ${cleanSortOrder}`;
    }

    reviewersSql += ` ${orderClause}`;

    const reviewers = await db.query(reviewersSql, [storeId]);

    return res.json({
      hasStore: true,
      store: {
        id: store.id,
        name: store.name,
        address: store.address,
        logoUrl: store.logo_url,
        averageRating,
        totalRatings
      },
      reviewers
    });
  } catch (err) {
    console.error('Owner dashboard fetch error:', err);
    return res.status(500).json({ error: 'Failed to retrieve dashboard data.' });
  }
};
