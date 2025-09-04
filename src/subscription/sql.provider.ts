import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sql from 'mssql';

export const SQL_POOL = 'SQL_POOL';

export const sqlPoolProvider: Provider = {
  provide: SQL_POOL,
  useFactory: async (configService: ConfigService) => {
    const server = configService.get<string>('AZURE_SQL_SERVER');
    const user = configService.get<string>('AZURE_SQL_USER');
    const password = configService.get<string>('AZURE_SQL_PASSWORD');
    const database = configService.get<string>('AZURE_SQL_DATABASE');

    console.log('Debug - Environment variables retrieved:');
    console.log('AZURE_SQL_SERVER:', server);
    console.log('AZURE_SQL_USER:', user);
    console.log('AZURE_SQL_PASSWORD:', password ? '[HIDDEN]' : 'undefined');
    console.log('AZURE_SQL_DATABASE:', database);

    if (!server || !user || !password || !database) {
      throw new Error('Missing required Azure SQL configuration. Please check your environment variables.');
    }

    const config: sql.config = {
      user,
      password,
      server,
      database,
      options: {
        encrypt: true,
        trustServerCertificate: false,
      },
    };
    
    console.log('Debug - Final config object:', JSON.stringify(config, null, 2));
    
    const pool = await new sql.ConnectionPool(config).connect();
    return pool;
  },
  inject: [ConfigService],
};
