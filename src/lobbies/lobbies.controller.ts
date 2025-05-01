import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { LobbiesService } from './lobbies.service';
import { CreateLobbyDto } from './dto/create-lobby.dto';
import { UpdateLobbyDto } from './dto/update-lobby.dto';
import { GetUser } from 'src/auth/auth.decorator';
import { User } from 'src/users/entities/user.entity';
import { JwtAuthGuard } from 'src/auth/auth.guard';

@Controller('lobbies')
export class LobbiesController {
  constructor(private readonly lobbiesService: LobbiesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createLobbyDto: CreateLobbyDto, @GetUser() user: User) {
    return this.lobbiesService.create(createLobbyDto, user);
  }

  @Get()
  findAll() {
    return this.lobbiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lobbiesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLobbyDto: UpdateLobbyDto) {
    return this.lobbiesService.update(+id, updateLobbyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lobbiesService.remove(+id);
  }
}
