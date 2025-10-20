import { restModule } from '@ditsmod/rest';
import { CommentsController } from './comments.controller.js';

@restModule({ controllers: [CommentsController] })
export class CommentsModule {}
