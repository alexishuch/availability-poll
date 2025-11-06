import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PollsService } from './polls.service';
import { CreatePollDto } from './models/create-poll.dto';
import { UpdatePollDto } from './models/update-poll.dto';

@Controller('polls')
export class PollsController {
  constructor(private readonly pollsService: PollsService) { }

  @Post()
  create(@Body() createPollDto: CreatePollDto) {
    return this.pollsService.create(createPollDto);
  }

  @Get()
  findAll() {
    return this.pollsService.findAll();
  }

  @Get(':id')
  findOneEnriched(@Param('id') id: string) {
    return this.pollsService.findOneEnriched(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePollDto: UpdatePollDto) {
    return this.pollsService.update(+id, updatePollDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pollsService.remove(+id);
  }
}
