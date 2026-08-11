import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTwoFactorAuth1721680000100 implements MigrationInterface {
  name = 'AddTwoFactorAuth1721680000100';

  async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    if (!table) return;

    if (!table.findColumnByName('two_factor_secret')) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'two_factor_secret',
          type: 'varchar',
          isNullable: true,
        }),
      );
    }

    if (!table.findColumnByName('two_factor_enabled')) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'two_factor_enabled',
          type: 'boolean',
          default: false,
        }),
      );
    }

    if (!table.findColumnByName('two_factor_backup_codes')) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'two_factor_backup_codes',
          type: 'text',
          isNullable: true,
        }),
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'two_factor_backup_codes');
    await queryRunner.dropColumn('users', 'two_factor_enabled');
    await queryRunner.dropColumn('users', 'two_factor_secret');
  }
}
