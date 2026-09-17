import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AllowNullTenantForFileAttachments1721680000200
  implements MigrationInterface
{
  name = 'AllowNullTenantForFileAttachments1721680000200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('file_attachments');
    if (!table) return;

    const column = table.findColumnByName('tenant_id');
    if (column && !column.isNullable) {
      await queryRunner.changeColumn(
        'file_attachments',
        'tenant_id',
        new TableColumn({
          name: 'tenant_id',
          type: queryRunner.connection.options.type === 'sqlite' ? 'text' : 'uuid',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('file_attachments');
    if (!table) return;

    const column = table.findColumnByName('tenant_id');
    if (column && column.isNullable) {
      await queryRunner.changeColumn(
        'file_attachments',
        'tenant_id',
        new TableColumn({
          name: 'tenant_id',
          type: queryRunner.connection.options.type === 'sqlite' ? 'text' : 'uuid',
          isNullable: false,
        }),
      );
    }
  }
}