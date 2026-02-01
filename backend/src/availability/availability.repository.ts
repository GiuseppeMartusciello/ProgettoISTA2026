import { Repository } from 'typeorm';
import { Availability } from './availability.entity';

export class AvailabilityRepository extends Repository<Availability> {
  constructor(private readonly repository: Repository<Availability>) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
}
