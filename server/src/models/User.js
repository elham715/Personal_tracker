import { pool, toCamelCase } from '../config/database.js';
import bcrypt from 'bcryptjs';

const User = {
  // Find user by ID (excludes password by default)
  async findById(id, includePassword = false) {
    const fields = includePassword
      ? '*'
      : 'id, firebase_uid, name, email, avatar, bio, created_at, updated_at';
    const { rows } = await pool.query(
      `SELECT ${fields} FROM users WHERE id = $1`,
      [id]
    );
    return toCamelCase(rows[0]);
  },

  // Find user by email
  async findByEmail(email, includePassword = false) {
    const fields = includePassword
      ? '*'
      : 'id, firebase_uid, name, email, avatar, bio, created_at, updated_at';
    const { rows } = await pool.query(
      `SELECT ${fields} FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );
    return toCamelCase(rows[0]);
  },

  // Find user by Firebase UID
  async findByFirebaseUid(uid) {
    const { rows } = await pool.query(
      'SELECT id, firebase_uid, name, email, avatar, bio, created_at, updated_at FROM users WHERE firebase_uid = $1',
      [uid]
    );
    return toCamelCase(rows[0]);
  },

  // Create a new user
  async create({ name, email, password, avatar, bio, firebaseUid }) {
    let hashedPassword = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, avatar, bio, firebase_uid)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, firebase_uid, name, email, avatar, bio, created_at, updated_at`,
      [
        name,
        email.toLowerCase(),
        hashedPassword,
        avatar || '🚀',
        bio || 'Building better habits, one day at a time',
        firebaseUid || null,
      ]
    );
    return toCamelCase(rows[0]);
  },

  // Update user profile
  async updateById(id, { name, avatar, bio }) {
    const { rows } = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name), avatar = COALESCE($2, avatar), bio = COALESCE($3, bio)
       WHERE id = $4
       RETURNING id, firebase_uid, name, email, avatar, bio, created_at, updated_at`,
      [name, avatar, bio, id]
    );
    return toCamelCase(rows[0]);
  },

  // Update user password
  async updatePassword(id, newPassword) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, id]);
  },

  // Compare plain text password with hashed password
  async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  },
};

export default User;
