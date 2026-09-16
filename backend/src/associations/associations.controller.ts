import {Controller, Get} from '@nestjs/common'

import AssociationsService from './associations.service.js'

@Controller('associations')
class AssociationsController {
    
    constructor(private associationService: AssociationsService){}

    @Get()
    getAllAssociations() {
        return this.associationService.getAll();
    }

    @Get('/:id')
    getAssociation(@Param('id') id: string) {
        return this.associaitonService.getAssociation(id);
    }
}

export default AssociationsController;
