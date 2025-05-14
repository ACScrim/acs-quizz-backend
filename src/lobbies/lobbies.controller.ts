import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { GetUser } from 'src/auth/auth.decorator';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { User } from 'src/users/entities/user.entity';
import { CreateLobbyDto } from './dto/create-lobby.dto';
import { UpdateLobbyDto } from './dto/update-lobby.dto';
import { LobbiesService } from './lobbies.service';
import { JoinLobbyDto } from './dto/join-lobby.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lobbies')
export class LobbiesController {
  constructor(private readonly lobbiesService: LobbiesService) {}

  // @Post()
  // create(@Body() createLobbyDto: CreateLobbyDto, @GetUser() user: User) {
  //   return this.lobbiesService.create(createLobbyDto, user);
  // }

  @Post('join')
  join(@GetUser() user: User, @Body() joinLobbyDto: JoinLobbyDto) {
    return this.lobbiesService.join(user, joinLobbyDto);
  }

  // @Post('leave/:id')
  // leave(@GetUser() user: User, @Param('id') id: string) {
  //   return this.lobbiesService.leave(user, id);
  // }

  @Get()
  findAll() {
    return this.lobbiesService.findAllPublic();
  }

  @Get('mine')
  findMine(@GetUser() user: User) {
    return this.lobbiesService.findMine(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lobbiesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLobbyDto: UpdateLobbyDto) {
    return this.lobbiesService.update(id, updateLobbyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lobbiesService.remove(id);
  }
}
