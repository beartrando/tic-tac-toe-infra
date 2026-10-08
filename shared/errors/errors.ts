export class DomainError extends Error {
    constructor(message: string, public code?: string) {
        super(message);
        this.name = 'DomainError';
    }
}

export class TokenExpiredError extends Error {
    constructor(message = 'Token has expired') {
        super(message);
        this.name = 'TokenExpiredError';
    }
}

export class InvalidAuthorizationError extends Error {
    constructor(message = 'Invalid authorization credentials') {
        super(message);
        this.name = 'InvalidAuthorizationError';
    }
}

export class ServiceUnavailableError extends Error {
    constructor(message = 'Service temporarily unavailable') {
        super(message);
        this.name = 'ServiceUnavailableError';
    }
}

export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}