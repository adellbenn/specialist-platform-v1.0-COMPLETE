import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FileAttachment } from './file-attachment.entity';
import { VirusScannerService } from '@common/security/virus-scanner.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileAttachment]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        limits: {
          fileSize: configService.get<number>('storage.maxFileSize') ?? 10 * 1024 * 1024,
        },
      }),
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService, VirusScannerService],
  exports: [FilesService],
})
export class FilesModule {}
