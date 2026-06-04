import Joi from 'joi';
import type { CheckoutDto } from './checkout.types';

export const checkoutDtoSchema = Joi.object<CheckoutDto>({
  userId: Joi.string().trim().required(),
  items: Joi.array()
    .min(1)
    .items(
      Joi.object({
        sku: Joi.string().trim().required(),
        quantity: Joi.number().integer().positive().required(),
      }),
    )
    .required(),
  card: Joi.object({
    last4: Joi.string().trim().length(4).pattern(/^\d{4}$/).required(),
    brand: Joi.string().trim().required(),
    expiryMonth: Joi.number().integer().min(1).max(12).required(),
    expiryYear: Joi.number().integer().min(2000).required(),
  }).required(),
});
