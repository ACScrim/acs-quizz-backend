import { IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateLobbyDto {
    @IsOptional()
    @IsString()
    name: string;

    @IsBoolean()
    isPublic: boolean;
}
