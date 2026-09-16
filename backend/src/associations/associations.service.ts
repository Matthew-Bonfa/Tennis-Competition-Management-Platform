import {Injectable} from '@nestjs/common'
import {PrismaService} from '../prisma/prisma.service.js'

@Injectable()
class AssociationsService {

    constructor(private prisma: PrismaService){}

    async getAll(){
        console.log("getting all");

        const response = await this.prisma.client.orm.public.Association
            .select('id', 'name')
            .orderBy((u) => u.name.desc())
            .all();
        console.log(response);
        return response;
    }

    async getAssociation(id: string){
        console.log("getting " + id);
        
        const response = await this.prisma.client.orm.public.Association
            .where({id: id})
            .first();
        console.log(response);
        return response;

    }


}


export default AssociationsService;

