import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateGroupMessageDto {
    @IsNotEmpty()
    @IsNumber()
    groupId: number

    @IsNotEmpty()
    @IsString()
    message: string
}