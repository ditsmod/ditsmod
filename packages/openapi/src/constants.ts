import { HttpMethod } from '@ditsmod/core';
import { openapi } from '@ts-stack/openapi-spec';

export const DEFAULT_OAS_OBJECT = {
  openapi,
  info: { title: 'Testing @ditsmod/openapi with default value', version: '0.0.0' },
};

export const DEFAULT_OAS_HTTP_METHODS = [
  'GET',
  'PUT',
  'POST',
  'DELETE',
  'OPTIONS',
  'HEAD',
  'PATCH',
  'TRACE',
] as HttpMethod[];
