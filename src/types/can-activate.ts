export interface CanActivate {
  canActivate(params?: any[]): boolean | number | Promise<boolean | number>;
}
