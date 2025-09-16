import { makeClassDecorator } from '#di';

describe('makeClassDecorator', () => {
  test('persistent debug name of decorator factory', () => {
    const classDecorator = makeClassDecorator(undefined, 'classDecorator');
    expect(classDecorator.name).toBe('classDecorator');
  });
});
