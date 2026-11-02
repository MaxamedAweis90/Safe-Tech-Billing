import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message: string }>;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[Error Handler]', err);

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {}).join(', ');
    res.status(409).json({
      success: false,
      error: `Duplicate entry error: field(s) [${fields}] must be unique`,
      keyValue: err.keyValue,
    });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError' && err.errors) {
    const messages = Object.values(err.errors).map((e) => e.message);
    res.status(400).json({
      success: false,
      error: 'Database schema validation error',
      details: messages,
    });
    return;
  }

  // CastError (e.g. invalid MongoDB ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: 'Invalid resource identifier format',
    });
    return;
  }

  const statusCode = err.statusCode || 400;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'An unexpected internal error occurred',
  });
};

