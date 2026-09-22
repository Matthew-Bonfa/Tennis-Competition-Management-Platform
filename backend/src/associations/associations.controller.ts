import {Controller, Get, Param} from '@nestjs/common'

import AssociationsService from './associations.service.js'

@Controller('associations')
class AssociationsController {
    
    constructor(private associationsService: AssociationsService){}

    @Get()
    getAllAssociations() {
        return this.associationsService.getAll();
    }

    @Get('/:id')
    getAssociation(@Param('id') id: string) {
        return this.associationsService.getAssociation(id);
    }
}

export default AssociationsController;
