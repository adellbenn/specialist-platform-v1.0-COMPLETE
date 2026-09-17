import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TENANT_TABLES = [
  'beneficiaries',
  'beneficiary_files',
  'appointments',
  'sessions',
  'reports',
  'service_packages',
  'subscriptions',
  'invoices',
];

export class AllowNullTenantForTenantScopedEntities1721690000000
  implements MigrationInterface
{
  name = 'AllowNullTenantForTenantScopedEntities1721690000000';

  private async setTenantNullable(
    queryRunner: QueryRunner,
    tableName: string,
    nullable: boolean,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (!table) return;

    const column = table.findColumnByName('tenant_id');
    if (!column || column.isNullable === nullable) return;

    await queryRunner.changeColumn(
      tableName,
      'tenant_id',
      new TableColumn({
        name: 'tenant_id',
        type: queryRunner.connection.options.type === 'sqlite' ? 'text' : 'uuid',
        isNullable: nullable,
      }),
    );
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of TENANT_TABLES) {
      await this.setTenantNullable(queryRunner, tableName, true);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of TENANT_TABLES) {
      await this.setTenantNullable(queryRunner, tableName, false);
    }
  }
}