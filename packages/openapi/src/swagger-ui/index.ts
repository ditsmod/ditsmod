import SwaggerUI from 'swagger-ui';
import 'swagger-ui/dist/swagger-ui.css';
import { urlConfig } from './swagger.config';

const ui = SwaggerUI({
  url: urlConfig.url,
  dom_id: '#swagger',
});

ui.initOAuth({
  appName: 'Swagger UI Webpack Demo',
  // See https://demo.identityserver.io/ for configuration details.
  clientId: 'implicit'
});
