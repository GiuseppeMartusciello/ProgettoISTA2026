import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { User } from "./user.entity";

@Injectable()
export class UserRepository extends Repository<User> {

    constructor (
        private readonly repository: Repository<User>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }


}