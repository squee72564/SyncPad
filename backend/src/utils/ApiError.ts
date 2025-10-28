export default class ApiError extends Error {
  statusCode: number;
  status: number;
  isOperational: boolean;
  expose: boolean;

  constructor(
    statusCode: number,
    message: string,
    isOperational: boolean = true,
    stack: string = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode;
    this.isOperational = isOperational;
    this.expose = statusCode < 500;
    Object.setPrototypeOf(this, ApiError.prototype);

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
