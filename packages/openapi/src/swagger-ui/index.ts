import SwaggerUI from 'swagger-ui';
import 'swagger-ui/dist/swagger-ui.css';

import { swaggerOptions } from './swagger.config.js';

(SwaggerUI as any)(swaggerOptions.initUi).initOAuth(swaggerOptions.oauthOptions);
