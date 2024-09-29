import { makeClassDecorator } from '#di';

export const guard = makeClassDecorator((data?: never) => data);
