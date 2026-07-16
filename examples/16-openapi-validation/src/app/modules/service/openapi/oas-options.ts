import type { OasOptions } from '@ditsmod/openapi';

export const oasOptions: OasOptions = {
  yamlSchemaOptions: {
    customTags: (tags) => {
      tags.push({
        identify: (token: any) => token?.prototype?.getLng,
        tag: 'tag:yaml.org,2002:str',
        default: true,
        resolve: () => 'fake resolve dictionary',
        stringify: (node) => (node.value as any).name,
      });
      return tags;
    },
  },
};
