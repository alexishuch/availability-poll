import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AvailabilitiesService } from './availabilities.service';
import { CreateAvailabilityDto } from './models/create-availability.dto';
import { UpdateAvailabilityDto } from './models/update-availability.dto';

@Controller('availabilities')
export class AvailabilitiesController {
  constructor(private readonly availabilitiesService: AvailabilitiesService) { }

  @Post()
  create(@Body() createAvailabilityDto: CreateAvailabilityDto) {
    return this.availabilitiesService.create(createAvailabilityDto);
  }

  @Get()
  findAll() {
    return this.availabilitiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.availabilitiesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAvailabilityDto: UpdateAvailabilityDto) {
    return this.availabilitiesService.update(+id, updateAvailabilityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.availabilitiesService.remove(+id);
  }
}
