import { Repository } from "typeorm"
import { Invite } from "./invite.entity";


export class InviteRepository extends Repository<Invite> {
    
    constructor (
        private readonly repository: Repository<Invite>,
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }
}