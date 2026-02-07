import { pool, toCamelCase, toCamelCaseArray } from '../config/database.js';

// Helper to format a task row for API response
const formatTask = (row) => {
  const task = toCamelCase(row);
  if (!task) return null;
  // Add date alias for frontend compatibility
  task.date = task.createdDate;
  return task;
};

const formatTaskArray = (rows) => {
  return rows.map(row => formatTask(row));
};

const Task = {
  // Get all tasks for a user with optional filters
  async findByUser(userId, filters = {}) {
    let query = 'SELECT * FROM tasks WHERE user_id = $1';
    const params = [userId];
    let paramIdx = 2;

    if (filters.date) {
      query += ` AND created_date = $${paramIdx}`;
      params.push(filters.date);
      paramIdx++;
    }

    if (filters.completed !== undefined) {
      query += ` AND completed = $${paramIdx}`;
      params.push(filters.completed);
      paramIdx++;
    }

    query += ' ORDER BY created_date DESC, created_at DESC';

    const { rows } = await pool.query(query, params);
    return formatTaskArray(rows);
  },

  // Get tasks for a specific date
  async findByDate(userId, date) {
    const { rows } = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 AND created_date = $2 ORDER BY created_at ASC',
      [userId, date]
    );
    return formatTaskArray(rows);
  },

  // Find a single task
  async findOne(id, userId) {
    const { rows } = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return formatTask(rows[0]);
  },

  // Create a new task
  async create({ userId, text, priority, isHabit, habitId, createdDate }) {
    const { rows } = await pool.query(
      `INSERT INTO tasks (user_id, text, priority, is_habit, habit_id, created_date, completed)
       VALUES ($1, $2, $3, $4, $5, $6, false)
       RETURNING *`,
      [userId, text, priority || 'medium', isHabit || false, habitId || null, createdDate]
    );
    return formatTask(rows[0]);
  },

  // Update a task
  async update(id, userId, { text, priority, completed }) {
    // Get current task first
    const current = await this.findOne(id, userId);
    if (!current) return null;

    const newText = text !== undefined ? text : current.text;
    const newPriority = priority !== undefined ? priority : current.priority;
    const newCompleted = completed !== undefined ? completed : current.completed;
    const newCompletedAt = completed !== undefined ? (completed ? new Date() : null) : current.completedAt;

    const { rows } = await pool.query(
      `UPDATE tasks SET text = $1, priority = $2, completed = $3, completed_at = $4
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [newText, newPriority, newCompleted, newCompletedAt, id, userId]
    );
    return formatTask(rows[0]);
  },

  // Toggle task completion
  async toggle(id, userId) {
    const { rows } = await pool.query(
      `UPDATE tasks SET
        completed = NOT completed,
        completed_at = CASE WHEN NOT completed THEN NOW() ELSE NULL END
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );
    if (!rows[0]) return null;
    return formatTask(rows[0]);
  },

  // Delete a task
  async deleteOne(id, userId) {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rowCount > 0;
  },
};

export default Task;
