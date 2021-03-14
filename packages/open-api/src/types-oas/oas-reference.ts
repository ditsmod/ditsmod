/**
 * A simple object to allow referencing other components in the specification, internally and externally.
 * The Reference Object is defined by JSON Reference and follows the same structure, behavior and rules.
 * For this specification, reference resolution is accomplished as defined
 * by the JSON Reference specification and not by the JSON Schema specification.
 * 
 * This object cannot be extended with additional properties and any properties added SHALL be ignored.
 * 
 * **Example**:
```json
{
	"$ref": "#/components/schemas/pet"
}
```
 * 
 * **Relative Schema Document Example**:
```json
{
  "$ref": "pet.json"
}
```
 */
export class OasReference {
  /**
   * The reference string.
   */
  $ref: string;
}
