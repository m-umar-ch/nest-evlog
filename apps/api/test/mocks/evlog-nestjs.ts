import { DynamicModule, Module } from '@nestjs/common';

const noopLogger = {
  set: () => noopLogger,
  error: () => noopLogger,
  getContext: () => ({}),
  fork: () => noopLogger,
};

export function useLogger() {
  return noopLogger;
}

@Module({})
export class EvlogModule {
  static forRoot(): DynamicModule {
    return { module: EvlogModule };
  }
}
