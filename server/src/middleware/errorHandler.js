// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // PostgreSQL unique constraint violation
  if (err.code === '23505') {
    const detail = err.detail || '';
    const match = detail.match(/Key \((.+?)\)/);
    const field = match ? match[1] : 'field';
    return res.status(400).json({
      success: false,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced resource not found'
    });
  }

  // PostgreSQL check constraint violation
  if (err.code === '23514') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error: constraint check failed'
    });
  }

  // PostgreSQL not null violation
  if (err.code === '23502') {
    return res.status(400).json({
      success: false,
      message: `${err.column || 'Field'} is required`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404 handler
export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
};
