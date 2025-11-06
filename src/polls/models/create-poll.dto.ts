import { IsNotEmpty, IsString, IsOptional, IsDate } from "class-validator";
import { ICreatePoll } from "./polls.interface";
import { Type } from "class-transformer";

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
