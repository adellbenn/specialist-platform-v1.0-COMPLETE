import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Session, AttendanceStatus } from './session.entity';
import { User, UserRole } from '@modules/users/user.entity';
import { Beneficiary } from '@modules/beneficiaries/beneficiary.entity';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { NotificationType } from '@modules/notifications/notification.entity';
import { CreateSessionDto, UpdateSessionDto, SessionQueryDto } from './dto/session.dto';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,

    @InjectRepository(Beneficiary)
    private beneficiaryRepo: Repository<Beneficiary>,

    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateSessionDto, tenantId: string, actorId?: string): Promise<Session> {
    if (!dto.beneficiaryId) {
      throw new BadRequestException('المستفيد غير موجود في هذا المركز');
    }
    const beneficiary = await this.beneficiaryRepo.findOne({
      where: { id: dto.beneficiaryId, tenantId },
    });
    if (!beneficiary) throw new BadRequestException('المستفيد غير موجود في هذا المركز');

    const specialist = await this.sessionRepo.manager.findOne(User, {
      where: { id: dto.specialistId, tenantId, role: UserRole.SPECIALIST },
    });
    if (!specialist) throw new BadRequestException('الأخصائي غير موجود في هذا المركز');

    const count = await this.sessionRepo.count({
      where: { beneficiaryId: dto.beneficiaryId, tenantId },
    });

    const session = this.sessionRepo.create({
      ...dto,
      tenantId,
      sessionNumber: count + 1,
      startedAt: new Date(dto.startedAt),
      endedAt: dto.endedAt ? new Date(dto.endedAt) : undefined,
    });

    const saved = await this.sessionRepo.save(session);

    try {
      const recipients = saved.specialistId && saved.specialistId !== actorId
        ? [saved.specialistId]
        : [];
      await this.notificationsService.broadcastSafe(recipients, {
        tenantId,
        type: NotificationType.SESSION_DUE,
        title: 'جلسة جديدة',
        message: `تم تسجيل جلسة جديدة للمستفيد رقم ${beneficiary.fileNumber}.`,
        link: `/dashboard/sessions/${saved.id}`,
      });
    } catch (error) {
      this.logger.warn(`تعذّر إرسال إشعار الجلسة: ${(error as Error)?.message ?? error}`);
    }

    return this.findOne(saved.id, tenantId);
  }

  async findAll(query: SessionQueryDto, tenantId: string, requestingUser: User) {
    const {
      beneficiaryId,
      specialistId,
      attendance,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = query;

    const qb = this.sessionRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.beneficiary', 'beneficiary')
      .leftJoinAndSelect('s.specialist', 'specialist')
      .where('s.tenant_id = :tenantId', { tenantId });

    // الأخصائي يرى جلساته فقط
    if (requestingUser.role === UserRole.SPECIALIST) {
      qb.andWhere('s.specialist_id = :sid', { sid: requestingUser.id });
    } else if (specialistId) {
      qb.andWhere('s.specialist_id = :sid', { sid: specialistId });
    }

    // المستفيد يرى جلساته فقط
    if (requestingUser.role === UserRole.BENEFICIARY) {
      qb.andWhere('s.beneficiary_id = :bid', { bid: requestingUser.beneficiaryId });
    } else if (beneficiaryId) {
      qb.andWhere('s.beneficiary_id = :bid', { bid: beneficiaryId });
    }

    if (attendance) qb.andWhere('s.attendance = :attendance', { attendance });
    if (dateFrom) qb.andWhere('s.started_at >= :from', { from: new Date(dateFrom) });
    if (dateTo) qb.andWhere('s.started_at <= :to', { to: new Date(dateTo) });

    const [data, total] = await qb
      .orderBy('s.startedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, tenantId: string, requestingUser?: User): Promise<Session> {
    const session = await this.sessionRepo.findOne({
      where: { id, tenantId },
      relations: ['beneficiary', 'specialist', 'appointment'],
      select: {
        beneficiary: { id: true, firstName: true, lastName: true, fileNumber: true },
        specialist: { id: true, firstName: true, lastName: true },
      },
    });
    if (!session) throw new NotFoundException('الجلسة غير موجودة');

    if (requestingUser) {
      if (
        requestingUser.role === UserRole.SPECIALIST &&
        session.specialistId !== requestingUser.id
      ) {
        throw new NotFoundException('الجلسة غير موجودة');
      }
      if (
        requestingUser.role === UserRole.BENEFICIARY &&
        session.beneficiaryId !== requestingUser.beneficiaryId
      ) {
        throw new NotFoundException('الجلسة غير موجودة');
      }
    }

    return session;
  }

  async update(
    id: string,
    dto: UpdateSessionDto,
    tenantId: string,
    requestingUser?: User,
  ): Promise<Session> {
    const session = await this.findOne(id, tenantId, requestingUser);

    if (dto.specialistId) {
      const specialist = await this.sessionRepo.manager.findOne(User, {
        where: { id: dto.specialistId, tenantId, role: UserRole.SPECIALIST },
      });
      if (!specialist) throw new BadRequestException('الأخصائي غير موجود في هذا المركز');
    }

    if (dto.beneficiaryId) {
      const beneficiary = await this.beneficiaryRepo.findOne({
        where: { id: dto.beneficiaryId, tenantId },
      });
      if (!beneficiary) throw new BadRequestException('المستفيد غير موجود في هذا المركز');
    }

    Object.assign(session, {
      ...dto,
      startedAt: dto.startedAt ? new Date(dto.startedAt) : session.startedAt,
      endedAt: dto.endedAt ? new Date(dto.endedAt) : session.endedAt,
    });
    await this.sessionRepo.save(session);
    return this.findOne(id, tenantId);
  }

  async getStats(tenantId: string) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [total, thisMonth, present, absent, late] = await Promise.all([
      this.sessionRepo.count({ where: { tenantId } }),
      this.sessionRepo.count({ where: { tenantId, startedAt: MoreThanOrEqual(startOfMonth) } }),
      this.sessionRepo.count({ where: { tenantId, attendance: AttendanceStatus.PRESENT } }),
      this.sessionRepo.count({ where: { tenantId, attendance: AttendanceStatus.ABSENT } }),
      this.sessionRepo.count({ where: { tenantId, attendance: AttendanceStatus.LATE } }),
    ]);

    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, thisMonth, present, absent, late, attendanceRate };
  }
}
