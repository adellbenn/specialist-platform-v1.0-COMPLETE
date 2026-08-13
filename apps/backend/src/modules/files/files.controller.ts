import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { memoryStorage } from 'multer';
import { FilesService } from './files.service';
import { EntityType } from './file-attachment.entity';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { TenantGuard } from '@common/guards/tenant.guard';
import { RbacGuard } from '@common/guards/rbac.guard';
import {
  AllStaff,
  WriterOnly,
  RequirePermissions,
  CurrentUser,
  TenantId,
} from '@common/decorators';
import { Permission } from '@common/permissions/permissions.enum';
import { User } from '@modules/users/user.entity';

@ApiTags('الملفات')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly service: FilesService) {}

  /**
   * رفع ملف مرتبط بكيان معين
   * POST /files/upload?entityType=beneficiary&entityId=UUID
   */
  @Post('upload')
  @WriterOnly()
  @RequirePermissions(Permission.FILE_UPDATE)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'رفع ملف' })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('entityType') entityType: EntityType,
    @Query('entityId') entityId: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: User,
  ) {
    if (!Object.values(EntityType).includes(entityType)) {
      throw new BadRequestException('نوع الكيان غير صحيح');
    }
    if (!entityId) throw new BadRequestException('معرّف الكيان مطلوب');

    const result = await this.service.upload(file, entityType, entityId, tenantId, user.id);
    return { data: result, message: 'تم رفع الملف بنجاح' };
  }

  /**
   * جلب ملفات — إن تم تحديد entityType+entityId يتم التصفية، وإلا جميع الملفات مع pagination
   * GET /files?entityType=beneficiary&entityId=UUID
   * GET /files?page=1&limit=24&mimeType=application/pdf
   */
  @Get()
  @AllStaff()
  @RequirePermissions(Permission.FILE_VIEW)
  @ApiOperation({ summary: 'قائمة الملفات (لكيان أو جميع الملفات)' })
  async getEntityFiles(
    @TenantId() tenantId: string,
    @Query('entityType') entityType?: EntityType,
    @Query('entityId') entityId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(24), ParseIntPipe) limit?: number,
    @Query('mimeType') mimeType?: string,
  ) {
    if (entityType && entityId) {
      const files = await this.service.getEntityFiles(entityType, entityId, tenantId);
      return { data: files };
    }
    const result = await this.service.findAll(tenantId, { page, limit, mimeType });
    return result;
  }

  /**
   * تحميل ملف
   * GET /files/:id/download
   */
  @Get(':id/download')
  @AllStaff()
  @RequirePermissions(Permission.FILE_VIEW)
  @ApiOperation({ summary: 'تحميل ملف' })
  async download(@Param('id') id: string, @TenantId() tenantId: string, @Res() res: Response, @CurrentUser() user: User) {
    const { file, absolutePath } = await this.service.getFilePath(id, tenantId, user);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
    );
    res.sendFile(absolutePath);
  }

  /**
   * حذف ملف
   * DELETE /files/:id
   */
  @Delete(':id')
  @WriterOnly()
  @RequirePermissions(Permission.FILE_UPDATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف ملف' })
  async delete(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.service.delete(id, tenantId);
    return { message: 'تم حذف الملف بنجاح' };
  }
}
