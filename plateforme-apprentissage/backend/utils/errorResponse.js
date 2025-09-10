class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    // Capture la stack trace pour un meilleur débogage
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorResponse;
