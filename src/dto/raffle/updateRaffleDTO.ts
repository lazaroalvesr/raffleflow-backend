import { PartialType } from "@nestjs/mapped-types";
import { CreateRaffleDTO } from "./CreateDTO";

export class UpdateRaffleDTO extends PartialType(CreateRaffleDTO) {}
