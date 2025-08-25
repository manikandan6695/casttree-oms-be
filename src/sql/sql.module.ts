import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { sqlPoolProvider } from './sql.provider';


@Global()
@Module({
  imports: [ConfigModule],
  providers: [sqlPoolProvider],
  exports: [sqlPoolProvider],
})
export class SqlModule {}
