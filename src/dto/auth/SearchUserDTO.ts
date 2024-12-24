import { IsOptional, IsString } from "class-validator";

export class SearchUserDTO {

    @IsOptional()
    @IsString()
    email?: string
}