import { Repository } from 'typeorm';
import { Reservation } from './reservation.entity';

export class ReservationRepository extends Repository<Reservation> {
  constructor(private readonly repository: Repository<Reservation>) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
}
