import swaggerUi from 'swagger-ui';
import 'swagger-ui/dist/swagger-ui.css';

import type { SwaggerOAuthOptions } from './o-auth-options.js';

const swaggerOptions = { url: 'openapi.yaml', dom_id: '#swagger', queryConfigEnabled: true };

const oauthOptions: SwaggerOAuthOptions = {
  appName: 'Swagger UI Webpack',
  // See https://demo.identityserver.io/ for configuration details.
  clientId: 'implicit',
};

swaggerUi(swaggerOptions).initOAuth(oauthOptions!);
