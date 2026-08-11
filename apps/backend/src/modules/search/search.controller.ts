import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { TenantGuard } from '@common/guards/tenant.guard';
import { AllRoles, CurrentUser, TenantId } from '@common/decorators';
import { User } from '@modules/users/user.entity';

@ApiTags('البحث')
@ApiBearerAuth()
@Throttle({ relaxed: {} })
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly service: SearchService) {}

  /** البحث الشامل */
  @Get()
  @AllRoles()
  @ApiOperation({ summary: 'بحث شامل في النظام' })
  async search(
    @Query('q') q: string,
    @Query('limit') limit: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.service.search(q, tenantId, user, parseInt(limit) || 5);
    return { data: result };
  }

  /** بحث في المستفيدين فقط */
  @Get('beneficiaries')
  @AllRoles()
  @ApiOperation({ summary: 'بحث في المستفيدين' })
  async searchBeneficiaries(
    @Query('q') q: string,
    @Query('limit') limit: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: User,
  ) {
    const results = await this.service.searchBeneficiaries(
      q,
      tenantId,
      user,
      parseInt(limit) || 10,
    );
    return { data: results };
  }
}
