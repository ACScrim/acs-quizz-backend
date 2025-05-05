import { IsString } from "class-validator";

export class JoinLobbyDto {
    @IsString()
    code: string;
}
