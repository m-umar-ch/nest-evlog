import Joi from 'joi';
import { createError } from 'evlog';

export function validateWithJoi<T>(
  schema: Joi.ObjectSchema<T>,
  value: unknown,
): T {
  const { error, value: validated } = schema.validate(value, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const why = error.details.map((d) => d.message).join('; ');
    throw createError({
      message: 'Validation failed',
      status: 400,
      why,
      fix: 'Correct the invalid fields and retry the request',
    });
  }

  return validated;
}
