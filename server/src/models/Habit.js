import { pool, toCamelCase, toCamelCaseArray } from '../config/database.js';

const Habit = {
  // Get all habits for a user (active or trashed)
  async findByUser(userId, isTrashed = false) {
    const { rows } = await pool.query(
      'SELECT * FROM habits WHERE user_id = $1 AND is_trashed = $2 ORDER BY created_at DESC',
      [userId, isTrashed]
    );
    return toCamelCaseArray(rows);
  },

  // Find a single habit by id and userId
  async findOne(id, userId) {
    const { rows } = await pool.query(
      'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return toCamelCase(rows[0]);
  },

  // Find an active (non-trashed) habit
  async findOneActive(id, userId) {
    const { rows } = await pool.query(
      'SELECT * FROM habits WHERE id = $1 AND user_id = $2 AND is_trashed = false',
      [id, userId]
    );
    return toCamelCase(rows[0]);
  },

  // Find a trashed habit
  async findOneTrashed(id, userId) {
    const { rows } = await pool.query(
      'SELECT * FROM habits WHERE id = $1 AND user_id = $2 AND is_trashed = true',
      [id, userId]
    );
    return toCamelCase(rows[0]);
  },

  // Create a new habit
  async create({ userId, name, icon, category, color, target }) {
    const { rows } = await pool.query(
      `INSERT INTO habits (user_id, name, icon, category, color, target, streak, completed_dates)
       VALUES ($1, $2, $3, $4, $5, $6, 0, '{}')
       RETURNING *`,
      [userId, name, icon || '✨', category || 'Health', color || 'purple', target || 1]
    );
    return toCamelCase(rows[0]);
  },

  // Update habit fields
  async update(id, userId, { name, icon, category, color, target }) {
    const { rows } = await pool.query(
      `UPDATE habits SET
        name = COALESCE($1, name),
        icon = COALESCE($2, icon),
        category = COALESCE($3, category),
        color = COALESCE($4, color),
        target = COALESCE($5, target)
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [name, icon, category, color, target, id, userId]
    );
    return toCamelCase(rows[0]);
  },

  // Toggle a date in completedDates array
  async toggleDate(id, date) {
    const { rows: current } = await pool.query(
      'SELECT completed_dates FROM habits WHERE id = $1',
      [id]
    );
    if (!current[0]) return null;

    const dates = current[0].completed_dates || [];
    const exists = dates.includes(date);

    const query = exists
      ? 'UPDATE habits SET completed_dates = array_remove(completed_dates, $1) WHERE id = $2 RETURNING *'
      : 'UPDATE habits SET completed_dates = array_append(completed_dates, $1) WHERE id = $2 RETURNING *';

    const { rows } = await pool.query(query, [date, id]);
    return toCamelCase(rows[0]);
  },

  // Update streak value
  async updateStreak(id, streak) {
    const { rows } = await pool.query(
      'UPDATE habits SET streak = $1 WHERE id = $2 RETURNING *',
      [streak, id]
    );
    return toCamelCase(rows[0]);
  },

  // Move habit to trash
  async moveToTrash(id) {
    const { rows } = await pool.query(
      'UPDATE habits SET is_trashed = true, trashed_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
    return toCamelCase(rows[0]);
  },

  // Restore habit from trash (clears history)
  async restore(id) {
    const { rows } = await pool.query(
      `UPDATE habits SET is_trashed = false, trashed_at = NULL, completed_dates = '{}', streak = 0
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return toCamelCase(rows[0]);
  },

  // Permanently delete a habit
  async deleteOne(id) {
    await pool.query('DELETE FROM habits WHERE id = $1', [id]);
  },

  // Delete all trashed habits for a user
  async deleteManyTrashed(userId) {
    const result = await pool.query(
      'DELETE FROM habits WHERE user_id = $1 AND is_trashed = true',
      [userId]
    );
    return result.rowCount;
  },
};

export default Habit;
