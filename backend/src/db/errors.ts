export interface PostgresError extends Error {
    code?: string;
    detail?: string;
    table?: string;
    constraint?: string;
    column?: string;
    dataType?: string;
    schema?: string;
}

export enum PostgresErrorCode {
    UNIQUE_VIOLATION = '23505',
    FOREIGN_KEY_VIOLATION = '23503',
    NOT_NULL_VIOLATION = '23502',
    CHECK_VIOLATION = '23514',
    EXCLUSION_VIOLATION = '23P01',
}

export class DatabaseError extends Error {
    constructor(
        message: string,
        public originalError?: PostgresError,
        public code?: string
    ) {
        super(message);
        this.name = 'DatabaseError';
    }
}

export class UniqueConstraintError extends DatabaseError {
    constructor(
        message: string,
        public field?: string,
        originalError?: PostgresError
    ) {
        super(message, originalError, PostgresErrorCode.UNIQUE_VIOLATION);
        this.name = 'UniqueConstraintError';
    }
}

export class ForeignKeyConstraintError extends DatabaseError {
    constructor(message: string, originalError?: PostgresError) {
        super(message, originalError, PostgresErrorCode.FOREIGN_KEY_VIOLATION);
        this.name = 'ForeignKeyConstraintError';
    }
}

export function processDatabaseError(error: unknown): Error {
    if (!isPostgresError(error)) {
        return error instanceof Error ? error : new Error(String(error));
    }

    switch (error.code) {
        case PostgresErrorCode.UNIQUE_VIOLATION: {
            const field = extractFieldFromError(error);
            const message =
                field === 'email' ? 'Email already exists' : `Duplicate value for ${field || 'unique field'}`;
            return new UniqueConstraintError(message, field, error);
        }

        case PostgresErrorCode.FOREIGN_KEY_VIOLATION:
            return new ForeignKeyConstraintError('Referenced record does not exist', error);

        case PostgresErrorCode.NOT_NULL_VIOLATION:
            return new DatabaseError(`Required field ${error.column || 'unknown'} cannot be null`, error, error.code);

        case PostgresErrorCode.CHECK_VIOLATION:
            return new DatabaseError('Value violates check constraint', error, error.code);

        default:
            return new DatabaseError(error.message || 'Database operation failed', error, error.code);
    }
}

export function isPostgresError(error: unknown): error is PostgresError {
    return error instanceof Error && 'code' in error && typeof (error as Record<string, unknown>).code === 'string';
}

function extractFieldFromError(error: PostgresError): string | undefined {
    if (error.constraint) {
        const match = error.constraint.match(/(.+)_(.+)_key/);
        if (match) return match[2];
    }

    if (error.detail) {
        const match = error.detail.match(/Key \((.+)\)=/);
        if (match) return match[1];
    }

    return error.column;
}
