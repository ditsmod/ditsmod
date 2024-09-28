import swaggerUi from 'swagger-ui';
import 'swagger-ui/dist/swagger-ui.css';

import { swaggerOptions } from './swagger.config.js';

swaggerUi(swaggerOptions.initUi).initOAuth(swaggerOptions.oauthOptions);
