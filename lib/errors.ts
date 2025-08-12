export class BaseError extends Error {
  public readonly statusCode: number;

  constructor(name: string, statusCode: number, message: string) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ApiError extends BaseError {
  constructor(
    statusCode = 500,
    message = 'An unexpected error occurred'
  ) {
    super('ApiError', statusCode, message);
  }
}

export class ValidationError extends BaseError {
  constructor(message = 'Invalid input') {
    super('ValidationError', 400, message);
  }
}
