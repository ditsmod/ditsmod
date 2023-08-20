import SwaggerUI = require('swagger-ui');
import 'swagger-ui/dist/swagger-ui.css';

import { swaggerOptions } from './swagger.config';

(SwaggerUI as any)(swaggerOptions.initUi).initOAuth(swaggerOptions.oauthOptions);
