import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateThemeDto {
  @ApiProperty({ enum: ['light', 'dark', 'system'] })
  @IsIn(['light', 'dark', 'system'], { message: 'يجب أن تكون السمة light أو dark أو system' })
  theme: string;
}
