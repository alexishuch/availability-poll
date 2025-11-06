import { Injectable } from '@nestjs/common';
import { CreateAvailabilityDto } from './models/create-availability.dto';
import { UpdateAvailabilityDto } from './models/update-availability.dto';

@Injectable()
export class AvailabilitiesService {
  create(createAvailabilityDto: CreateAvailabilityDto) {
    return 'This action adds a new availability';
  }

  findAll() {
    return `This action returns all availabilities`;
  }

  findOne(id: number) {
    return `This action returns a #${id} availability`;
  }

  update(id: number, updateAvailabilityDto: UpdateAvailabilityDto) {
    return `This action updates a #${id} availability`;
  }

  remove(id: number) {
    return `This action removes a #${id} availability`;
  }
}
