export class ApiError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) {
      super(message);
      this.statusCode = statusCode;
      Object.setPrototypeOf(this, new.target.prototype);
    }
  }
  
  export class NotFoundError extends ApiError {
    constructor(message = "Resource not found") {
      super(404, message);
    }
  }
  
  export class BadRequestError extends ApiError {
    constructor(message = "Bad request") {
      super(400, message);
    }
  }
  
  export class UnauthorizedError extends ApiError {
    constructor(message = "Unauthorized access") {
      super(401, message);
    }
  }
  
  export class ForbiddenError extends ApiError {
    constructor(message = "Forbidden") {
      super(403, message);
    }
  }
  
  export class InternalServerError extends ApiError {
    constructor(message = "Internal server error") {
      super(500, message);
    }
  }