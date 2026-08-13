import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Appointment, AppointmentStatus, AppointmentType } from './appointment.entity';
import { Session } from '@modules/sessions/session.entity';
import { User, UserRole } from '@modules/users/user.entity';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentQueryDto,
} from './dto/appointment.dto';
import { CreateSessionDto } from '@modules/sessions/dto/session.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,

    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // ─── CREATE ───────────────────────────────────────────────

  async create(
    dto: CreateAppointmentDto,
    tenantId: string,
    createdById: string,
  ): Promise<Appointment> {
    // التحقق من عدم وجود تعارض في المواعيد
    await this.checkConflict(dto.specialistId, dto.scheduledAt, dto.durationMinutes ?? 60);

    // التحقق من أن الأخصائي ينتمي للمركز
    const specialist = await this.userRepo.findOne({
      where: { id: dto.specialistId, tenantId, role: UserRole.SPECIALIST },
    });
    if (!specialist) throw new BadRequestException('الأخصائي غير موجود في هذا المركز');

    const appointment = this.appointmentRepo.create({
      ...dto,
      tenantId,
      createdById,
      scheduledAt: new Date(dto.scheduledAt),
    });

    const saved = await this.appointmentRepo.save(appointment);
    return this.findOne(saved.id, tenantId);
  }

  // ─── READ ALL ─────────────────────────────────────────────

  async findAll(query: AppointmentQueryDto, tenantId: string, requestingUser: User) {
    const {
      specialistId,
      beneficiaryId,
      status,
      type,
      dateFrom,
      dateTo,
      page = 1,
      limit = 50,
    } = query;

    const qb = this.appointmentRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.beneficiary', 'beneficiary')
      .leftJoinAndSelect('a.specialist', 'specialist')
      .leftJoinAndSelect('a.createdBy', 'createdBy')
      .where('a.tenant_id = :tenantId', { tenantId });

    // الأخصائي يرى مواعيده فقط
    if (requestingUser.role === UserRole.SPECIALIST) {
      qb.andWhere('a.specialist_id = :sid', { sid: requestingUser.id });
    } else if (specialistId) {
      qb.andWhere('a.specialist_id = :sid', { sid: specialistId });
    }

    // المستفيد يرى مواعيده فقط
    if (requestingUser.role === UserRole.BENEFICIARY) {
      qb.andWhere('a.beneficiary_id = :bid', { bid: requestingUser.beneficiaryId });
    } else if (beneficiaryId) {
      qb.andWhere('a.beneficiary_id = :bid', { bid: beneficiaryId });
    }

    if (status) qb.andWhere('a.status = :status', { status });
    if (type) qb.andWhere('a.type = :type', { type });

    if (dateFrom) {
      qb.andWhere('a.scheduled_at >= :from', { from: new Date(dateFrom) });
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59);
      qb.andWhere('a.scheduled_at <= :to', { to: end });
    }

    qb.orderBy('a.scheduledAt', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── READ CALENDAR (للتقويم التفاعلي) ────────────────────

  async getCalendarData(
    year: number,
    month: number,
    tenantId: string,
    requestingUser: User,
    filters?: Record<string, any>,
  ) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const qb = this.appointmentRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.beneficiary', 'b')
      .leftJoinAndSelect('a.specialist', 's')
      .where('a.tenant_id = :tenantId', { tenantId })
      .andWhere('a.scheduled_at BETWEEN :start AND :end', { start, end });

    if (requestingUser.role === UserRole.SPECIALIST) {
      qb.andWhere('a.specialist_id = :sid', { sid: requestingUser.id });
    }
    if (requestingUser.role === UserRole.BENEFICIARY) {
      qb.andWhere('a.beneficiary_id = :bid', { bid: requestingUser.beneficiaryId });
    }

    if (filters) {
      if (filters.specialistId)
        qb.andWhere('a.specialistId = :sid2', { sid2: filters.specialistId });
      if (filters.beneficiaryId)
        qb.andWhere('a.beneficiaryId = :bid2', { bid2: filters.beneficiaryId });
      if (filters.status) qb.andWhere('a.status = :status', { status: filters.status });
      if (filters.type) qb.andWhere('a.type = :type', { type: filters.type });
      if (filters.location)
        qb.andWhere('a.location LIKE :location', { location: `%${filters.location}%` });
    }

    const appointments = await qb.orderBy('a.scheduledAt', 'ASC').getMany();

    // تنظيم حسب اليوم للتقويم
    const byDay: Record<string, Appointment[]> = {};
    appointments.forEach((a) => {
      const day = a.scheduledAt.toISOString().split('T')[0];
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(a);
    });

    return { appointments, byDay };
  }

  // ─── READ ONE ─────────────────────────────────────────────

  async findOne(id: string, tenantId: string, requestingUser?: User): Promise<Appointment> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id, tenantId },
      relations: ['beneficiary', 'specialist', 'createdBy'],
      select: {
        beneficiary: { id: true, firstName: true, lastName: true, fileNumber: true },
        specialist: { id: true, firstName: true, lastName: true, email: true },
        createdBy: { id: true, firstName: true, lastName: true },
      },
    });
    if (!appointment) throw new NotFoundException('الموعد غير موجود');

    if (requestingUser) {
      if (
        requestingUser.role === UserRole.BENEFICIARY &&
        appointment.beneficiaryId !== requestingUser.beneficiaryId
      ) {
        throw new NotFoundException('الموعد غير موجود');
      }
      if (
        requestingUser.role === UserRole.SPECIALIST &&
        appointment.specialistId !== requestingUser.id
      ) {
        throw new NotFoundException('الموعد غير موجود');
      }
    }

    return appointment;
  }

  // ─── UPDATE ───────────────────────────────────────────────

  async update(id: string, dto: UpdateAppointmentDto, tenantId: string): Promise<Appointment> {
    const appointment = await this.findOne(id, tenantId);

    if (
      appointment.status === AppointmentStatus.COMPLETED ||
      appointment.status === AppointmentStatus.CANCELLED
    ) {
      throw new BadRequestException('لا يمكن تعديل موعد مكتمل أو ملغي');
    }

    if (dto.scheduledAt && dto.scheduledAt !== appointment.scheduledAt.toISOString()) {
      await this.checkConflict(
        dto.specialistId ?? appointment.specialistId,
        dto.scheduledAt,
        dto.durationMinutes ?? appointment.durationMinutes,
        id,
      );
    }

    Object.assign(appointment, {
      ...dto,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : appointment.scheduledAt,
    });

    await this.appointmentRepo.save(appointment);
    return this.findOne(id, tenantId);
  }

  // ─── CONFIRM / CANCEL ─────────────────────────────────────

  async confirm(id: string, tenantId: string): Promise<Appointment> {
    const appointment = await this.findOne(id, tenantId);
    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('يمكن تأكيد المواعيد المجدولة فقط');
    }
    appointment.status = AppointmentStatus.CONFIRMED;
    await this.appointmentRepo.save(appointment);
    return this.findOne(id, tenantId);
  }

  async cancel(id: string, reason: string, tenantId: string): Promise<Appointment> {
    const appointment = await this.findOne(id, tenantId);
    if ([AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED].includes(appointment.status)) {
      throw new BadRequestException('لا يمكن إلغاء هذا الموعد');
    }
    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancellationReason = reason;
    await this.appointmentRepo.save(appointment);
    return this.findOne(id, tenantId);
  }

  // ─── MARK NO SHOW ─────────────────────────────────────────

  async markNoShow(id: string, tenantId: string): Promise<Appointment> {
    const appointment = await this.findOne(id, tenantId);
    appointment.status = AppointmentStatus.NO_SHOW;
    await this.appointmentRepo.save(appointment);
    return this.findOne(id, tenantId);
  }

  // ─── COMPLETE + CREATE SESSION ────────────────────────────

  async complete(
    id: string,
    sessionData: CreateSessionDto,
    tenantId: string,
    specialistId: string,
  ): Promise<{ appointment: Appointment; session: Session }> {
    const appointment = await this.findOne(id, tenantId);

    if (![AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED].includes(appointment.status)) {
      throw new BadRequestException('لا يمكن إكمال هذا الموعد');
    }

    // حساب رقم الجلسة (الترتيب للمستفيد)
    const sessionCount = await this.sessionRepo.count({
      where: { beneficiaryId: appointment.beneficiaryId, tenantId },
    });

    appointment.status = AppointmentStatus.COMPLETED;
    await this.appointmentRepo.save(appointment);

    const session = await this.sessionRepo.save(
      this.sessionRepo.create({
        ...sessionData,
        startedAt: sessionData.startedAt
          ? new Date(sessionData.startedAt)
          : appointment.scheduledAt,
        endedAt: sessionData.endedAt ? new Date(sessionData.endedAt) : undefined,
        appointmentId: appointment.id,
        beneficiaryId: appointment.beneficiaryId,
        specialistId,
        tenantId,
        sessionNumber: sessionCount + 1,
      }),
    );

    return { appointment: await this.findOne(id, tenantId), session };
  }

  // ─── TODAY'S APPOINTMENTS ─────────────────────────────────

  async getTodayAppointments(tenantId: string, specialistId?: string) {
    const today = new Date();
    const startDay = new Date(today.setHours(0, 0, 0, 0));
    const endDay = new Date(today.setHours(23, 59, 59, 999));

    const where: FindOptionsWhere<Appointment> = {
      tenantId,
      scheduledAt: Between(startDay, endDay),
    };
    if (specialistId) where.specialistId = specialistId;

    return this.appointmentRepo.find({
      where,
      relations: ['beneficiary', 'specialist'],
      select: {
        beneficiary: { id: true, firstName: true, lastName: true, fileNumber: true },
        specialist: { id: true, firstName: true, lastName: true },
      },
      order: { scheduledAt: 'ASC' },
    });
  }

  // ─── STATS ────────────────────────────────────────────────

  async getStats(tenantId: string) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [total, thisMonth, completed, cancelled, noShow, upcoming] = await Promise.all([
      this.appointmentRepo.count({ where: { tenantId } }),
      this.appointmentRepo.count({
        where: { tenantId, scheduledAt: MoreThanOrEqual(startOfMonth) },
      }),
      this.appointmentRepo.count({ where: { tenantId, status: AppointmentStatus.COMPLETED } }),
      this.appointmentRepo.count({ where: { tenantId, status: AppointmentStatus.CANCELLED } }),
      this.appointmentRepo.count({ where: { tenantId, status: AppointmentStatus.NO_SHOW } }),
      this.appointmentRepo.count({
        where: {
          tenantId,
          status: AppointmentStatus.SCHEDULED,
          scheduledAt: MoreThanOrEqual(new Date()),
        },
      }),
    ]);

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, thisMonth, completed, cancelled, noShow, upcoming, completionRate };
  }

  // ─── PRIVATE: Conflict Check ──────────────────────────────

  private async checkConflict(
    specialistId: string,
    scheduledAt: string,
    durationMinutes: number,
    excludeId?: string,
  ): Promise<void> {
    const start = new Date(scheduledAt);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    const potentials = await this.appointmentRepo
      .createQueryBuilder('a')
      .where('a.specialist_id = :specialistId', { specialistId })
      .andWhere('a.status NOT IN (:...statuses)', {
        statuses: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
      })
      .andWhere('a.scheduled_at < :end', { end })
      .getMany();

    const conflict = potentials.find((a) => {
      const existingEnd = new Date(a.scheduledAt.getTime() + a.durationMinutes * 60 * 1000);
      return existingEnd > start && a.id !== excludeId;
    });

    if (conflict) {
      throw new ConflictException(
        `الأخصائي لديه موعد متعارض في هذا الوقت (${conflict.scheduledAt.toLocaleTimeString('ar')})`,
      );
    }
  }
}
