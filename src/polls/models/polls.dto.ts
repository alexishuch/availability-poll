import { PartialType } from "@nestjs/mapped-types";
import { Type } from "class-transformer";
import { IsDate, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ICreatePoll } from "./polls.interface";

export class CreatePollDto implements ICreatePoll {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  start_date?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  end_date?: Date;
}

export class UpdatePollDto extends PartialType(CreatePollDto) { }