import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BeneficiariesController } from './beneficiaries.controller';
import { BeneficiariesService } from './beneficiaries.service';
import { Beneficiary } from './beneficiary.entity';
import { BeneficiaryFile } from './beneficiary-file.entity';
import { User } from '@modules/users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Beneficiary, BeneficiaryFile, User])],
  controllers: [BeneficiariesController],
  providers: [BeneficiariesService],
  exports: [BeneficiariesService],
})
export class BeneficiariesModule {}
