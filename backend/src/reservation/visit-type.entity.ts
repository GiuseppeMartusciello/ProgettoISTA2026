import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class VisitType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  durationMinutes: number;
}
