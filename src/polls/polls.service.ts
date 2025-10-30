import { Injectable } from '@nestjs/common';
import { CreatePollDto } from './dto/create-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';
import { Repository } from 'typeorm';
import { Poll } from './entities/poll.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PollsService {
  constructor(
    @InjectRepository(Poll)
    private pollRepository: Repository<Poll>,
  ) { }

  create(createPollDto: CreatePollDto) {
    return 'This action adds a new poll';
  }

  async findAll() {
    return this.pollRepository.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} poll`;
  }

  update(id: number, updatePollDto: UpdatePollDto) {
    return `This action updates a #${id} poll`;
  }

  remove(id: number) {
    return `This action removes a #${id} poll`;
  }
}
