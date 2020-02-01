import { Format } from '../../src/services/format';

describe(`Format`, () => {
  const defaultFormatters = new Format().getFormatters();

  describe(`Types of default formatters`, () => {
    for (const [type, fn] of defaultFormatters) {
      it(`should have type "string"`, () => {
        expect(typeof type).toBe('string');
      });

      it(`should have type "function"`, () => {
        expect(typeof fn).toBe('function');
      });
    }
  });

  describe(`formatJson`, () => {
    it('should return a JSON text', () => {
      const jsonFormatter = defaultFormatters.get('application/json');
      expect(jsonFormatter({ message: 'this is a message' })).toBe(`{"message":"this is a message"}`);
    });
    it('should return a JSON text', () => {
      const jsonFormatter = defaultFormatters.get('application/json');
      expect(jsonFormatter('15')).toBe(`"15"`);
    });
  });

  describe(`formatText`, () => {
    it('should return a text', () => {
      const textFormatter = defaultFormatters.get('text/plain');
      expect(textFormatter(15)).toBe(`15`);
    });
  });

  describe(`formatBinary`, () => {
    it('should return a binary', () => {
      const body = 15;
      const binaryFormatter = defaultFormatters.get('application/octet-stream');
      expect(binaryFormatter(body)).toEqual(Buffer.from(body.toString()));
    });
  });
});
