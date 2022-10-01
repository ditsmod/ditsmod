import { OasOptions } from '@ditsmod/openapi';
import { Scalar } from 'yaml';

export const oasOptions: OasOptions = {
  yamlSchemaOptions: {
    customTags: (tags) => {
      tags.push({
        identify: (token: any) => token?.prototype?.getLng,
        tag: 'tag:yaml.org,2002:str',
        default: true,
        resolve: () => 'fake resolve for @ditsmod/i18n dictionary',
        stringify: (node: Scalar<any>) => node.value?.name,
      });
      return tags;
    },
  },
};
