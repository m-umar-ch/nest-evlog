import { Catch, type ArgumentsHost } from '@nestjs/common';
import { GqlExceptionFilter, GqlArgumentsHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { parseError } from 'evlog';
import { useLogger } from 'evlog/nestjs';

@Catch()
export class EvlogGraphqlExceptionFilter implements GqlExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    const info = gqlHost.getInfo<{ fieldName?: string }>();
    const error =
      exception instanceof Error ? exception : new Error(String(exception));

    try {
      const log = useLogger();
      log.error(error);
      log.set({
        graphql: {
          operation: info?.fieldName,
          failed: true,
        },
      });
    } catch {
      // Outside evlog request scope
    }

    const parsed = parseError(error);
    return new GraphQLError(parsed.message, {
      extensions: {
        status: parsed.status,
        why: parsed.why,
        fix: parsed.fix,
        link: parsed.link,
      },
    });
  }
}
