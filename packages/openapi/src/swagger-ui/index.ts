import SwaggerUI from 'swagger-ui';
import 'swagger-ui/dist/swagger-ui.css';

import { swaggerOptions } from './swagger.config';

SwaggerUI(swaggerOptions.initUi).initOAuth(swaggerOptions.initOAuth);
