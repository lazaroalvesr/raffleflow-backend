import { PartialType } from '@nestjs/mapped-types';
import { RegisterDTO } from './RegisterDto';

export class UpdateProfileDTO extends PartialType(RegisterDTO) { }
