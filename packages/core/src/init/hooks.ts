/**
 * Interface for modules that require initialization when the application starts.
 * Applies only to module classes.
 */
export interface OnModuleInit {
  onModuleInit(): void | Promise<void>;
}
