import { Injectable } from "@nestjs/common";
import { Patient } from "./patient.entity";
import { Repository } from "typeorm"



@Injectable()
export class PatientRepository extends Repository<Patient> {

    constructor (
        private readonly repository: Repository<Patient>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }

}