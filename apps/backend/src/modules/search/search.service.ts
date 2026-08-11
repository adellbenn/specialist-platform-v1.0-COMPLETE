import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Beneficiary } from '@modules/beneficiaries/beneficiary.entity';
import { Appointment } from '@modules/appointments/appointment.entity';
import { Report } from '@modules/reports/report.entity';
import { Invoice } from '@modules/payments/invoice.entity';
import { User, UserRole } from '@modules/users/user.entity';

export interface SearchResult {
  type: 'beneficiary' | 'appointment' | 'report' | 'invoice' | 'user';
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
  link: string;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Beneficiary) private beneficiaryRepo: Repository<Beneficiary>,
    @InjectRepository(Appointment) private appointmentRepo: Repository<Appointment>,
    @InjectRepository(Report) private reportRepo: Repository<Report>,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async search(
    query: string,
    tenantId: string,
    requestingUser: User,
    limit = 5,
  ): Promise<{ results: SearchResult[]; total: number }> {
    if (!query || query.trim().length < 2) {
      return { results: [], total: 0 };
    }

    const q = query.trim();

    const [beneficiaries, appointments, reports, invoices, users] = await Promise.all([
      this.searchBeneficiaries(q, tenantId, requestingUser, limit),
      this.searchAppointments(q, tenantId, requestingUser, limit),
      this.searchReports(q, tenantId, requestingUser, limit),
      this.searchInvoices(q, tenantId, requestingUser, limit),
      // البحث عن المستخدمين للأدوار الإدارية فقط
      requestingUser.role !== UserRole.SPECIALIST && requestingUser.role !== UserRole.BENEFICIARY
        ? this.searchUsers(q, tenantId, limit)
        : Promise.resolve([]),
    ]);

    const results = [...beneficiaries, ...appointments, ...reports, ...invoices, ...users];

    return { results, total: results.length };
  }

  /** البحث المتخصص في المستفيدين */
  async searchBeneficiaries(
    q: string,
    tenantId: string,
    requestingUser: User,
    limit: number,
  ): Promise<SearchResult[]> {
    const qb = this.beneficiaryRepo
      .createQueryBuilder('b')
      .where('b.tenant_id = :tenantId', { tenantId })
      .andWhere(
        '(b.first_name LIKE :q OR b.last_name LIKE :q OR b.file_number LIKE :q OR b.national_id LIKE :q OR b.phone LIKE :q)',
        { q: `%${q}%` },
      )
      .take(limit);

    // الأخصائي يبحث في حالاته فقط
    if (requestingUser.role === UserRole.SPECIALIST) {
      qb.andWhere('b.assigned_specialist_id = :sid', { sid: requestingUser.id });
    }

    const items = await qb.getMany();

    return items.map((b) => ({
      type: 'beneficiary' as const,
      id: b.id,
      title: `${b.firstName} ${b.lastName}`,
      subtitle: `ملف رقم: ${b.fileNumber}`,
      meta: b.status,
      link: `/dashboard/beneficiaries/${b.id}`,
    }));
  }

  private async searchAppointments(
    q: string,
    tenantId: string,
    requestingUser: User,
    limit: number,
  ): Promise<SearchResult[]> {
    const qb = this.appointmentRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.beneficiary', 'b')
      .leftJoinAndSelect('a.specialist', 's')
      .where('a.tenant_id = :tenantId', { tenantId })
      .andWhere(
        '(b.first_name LIKE :q OR b.last_name LIKE :q OR b.file_number LIKE :q OR a.notes LIKE :q)',
        { q: `%${q}%` },
      )
      .take(limit);

    if (requestingUser.role === UserRole.SPECIALIST) {
      qb.andWhere('a.specialist_id = :sid', { sid: requestingUser.id });
    }

    const items = await qb.getMany();

    return items.map((a) => ({
      type: 'appointment' as const,
      id: a.id,
      title: `${a.beneficiary?.firstName ?? ''} ${a.beneficiary?.lastName ?? ''}`,
      subtitle: new Date(a.scheduledAt).toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      meta: a.status,
      link: `/dashboard/appointments/${a.id}`,
    }));
  }

  private async searchReports(
    q: string,
    tenantId: string,
    requestingUser: User,
    limit: number,
  ): Promise<SearchResult[]> {
    const qb = this.reportRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.beneficiary', 'b')
      .where('r.tenant_id = :tenantId', { tenantId })
      .andWhere(
        '(r.title LIKE :q OR b.first_name LIKE :q OR b.last_name LIKE :q OR b.file_number LIKE :q)',
        { q: `%${q}%` },
      )
      .take(limit);

    if (requestingUser.role === UserRole.SPECIALIST) {
      qb.andWhere('r.specialist_id = :sid', { sid: requestingUser.id });
    }
    if (requestingUser.role === UserRole.BENEFICIARY) {
      qb.andWhere('r.shared_with_beneficiary = true');
    }

    const items = await qb.getMany();

    return items.map((r) => ({
      type: 'report' as const,
      id: r.id,
      title: r.title,
      subtitle: `${r.beneficiary?.firstName ?? ''} ${r.beneficiary?.lastName ?? ''}`,
      meta: r.status,
      link: `/dashboard/reports/${r.id}`,
    }));
  }

  private async searchInvoices(
    q: string,
    tenantId: string,
    requestingUser: User,
    limit: number,
  ): Promise<SearchResult[]> {
    if (
      requestingUser.role === UserRole.SPECIALIST ||
      requestingUser.role === UserRole.BENEFICIARY
    ) {
      return [];
    }

    const qb = this.invoiceRepo
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.beneficiary', 'b')
      .where('i.tenant_id = :tenantId', { tenantId })
      .andWhere('(i.invoice_number LIKE :q OR b.first_name LIKE :q OR b.last_name LIKE :q)', {
        q: `%${q}%`,
      })
      .take(limit);

    const items = await qb.getMany();

    return items.map((inv) => ({
      type: 'invoice' as const,
      id: inv.id,
      title: `فاتورة #${inv.invoiceNumber}`,
      subtitle: `${inv.beneficiary?.firstName ?? ''} ${inv.beneficiary?.lastName ?? ''}`,
      meta: inv.paymentStatus,
      link: `/dashboard/payments/invoices/${inv.id}`,
    }));
  }

  private async searchUsers(q: string, tenantId: string, limit: number): Promise<SearchResult[]> {
    const items = await this.userRepo
      .createQueryBuilder('u')
      .where('u.tenant_id = :tenantId', { tenantId })
      .andWhere('(u.first_name LIKE :q OR u.last_name LIKE :q OR u.email LIKE :q)', { q: `%${q}%` })
      .take(limit)
      .getMany();

    return items.map((u) => ({
      type: 'user' as const,
      id: u.id,
      title: `${u.firstName} ${u.lastName}`,
      subtitle: u.email,
      meta: u.role,
      link: `/dashboard/users`,
    }));
  }
}
