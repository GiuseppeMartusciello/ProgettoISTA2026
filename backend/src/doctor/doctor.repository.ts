import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Doctor } from './doctor.entity';

@Injectable()
export class DoctorRepository extends Repository<Doctor> {
  constructor(private readonly repository: Repository<Doctor>) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
}
