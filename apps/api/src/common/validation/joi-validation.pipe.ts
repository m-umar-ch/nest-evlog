import { type ArgumentMetadata, type PipeTransform } from '@nestjs/common';
import type Joi from 'joi';
import { validateWithJoi } from './joi.helper';

/**
 * Validates a single handler argument (e.g. GraphQL `@Args('input')`) with Joi.
 * Attach inline: `@Args('input', new JoiValidationPipe(mySchema))`.
 */
export class JoiValidationPipe<T = unknown> implements PipeTransform {
  constructor(private readonly schema: Joi.ObjectSchema<T>) {}

  transform(value: unknown, _metadata: ArgumentMetadata): T {
    return validateWithJoi(this.schema, value);
  }
}
