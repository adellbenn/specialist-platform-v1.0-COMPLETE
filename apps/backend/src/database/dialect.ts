export const isPostgresDialect = process.env.DB_TYPE === 'postgres';

export const timestampColumnType = isPostgresDialect ? 'timestamp' : 'datetime';
