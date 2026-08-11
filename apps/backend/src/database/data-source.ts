import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

const isPostgres = process.env.DB_TYPE === 'postgres';
const baseDir = path.resolve(__dirname);

const options: DataSourceOptions = isPostgres
  ? {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'specialist_platform',
      entities: [path.join(baseDir, '..', '**', '*.entity.js')],
      migrations: [path.join(baseDir, 'migrations', '*.js')],
      synchronize: false,
      logging: process.env.DB_LOGGING === 'true',
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
          : false,
    }
  : {
      type: 'sqlite',
      database: path.join(baseDir, '..', '..', 'data', 'specialist_platform.sqlite'),
      entities: [path.join(baseDir, '..', '**', '*.entity.js')],
      migrations: [path.join(baseDir, 'migrations', '*.js')],
      synchronize: false,
      logging: process.env.DB_LOGGING === 'true',
    };

export default new DataSource(options);
