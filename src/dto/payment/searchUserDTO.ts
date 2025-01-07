import { IsOptional, IsString } from "class-validator";

export class SearchUserPaymentDTO {

    @IsOptional()
    @IsString()
    payerEmail?: string
}