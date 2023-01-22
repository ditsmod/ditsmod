export type Override<T extends object, K extends { [P in keyof T]?: any }> = Omit<T, keyof K> & K;
