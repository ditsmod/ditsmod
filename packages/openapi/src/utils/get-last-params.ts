import { ParameterObject, ReferenceObject } from '@ts-stack/openapi-spec';

export function getLastParameterObjects(params: ParameterObject[]) {
  const lastParams: ParameterObject[] = [];
  params.forEach((curParam, index) => {
    if (params.map((p) => `${p.name}#${p.in}`).lastIndexOf(`${curParam.name}#${curParam.in}`) == index) {
      lastParams.push(params[index]);
    }
  });

  return lastParams;
}

export function getLastReferenceObjects(params: ReferenceObject[]) {
  const lastParams: ReferenceObject[] = [];
  params.forEach((param, index) => {
    if (params.map((p) => p.$ref).lastIndexOf(param.$ref) == index) {
      lastParams.push(params[index]);
    }
  });

  return lastParams;
}
