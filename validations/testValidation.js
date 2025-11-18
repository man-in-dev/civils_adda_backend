import Joi from 'joi';

export const checkoutValidation = Joi.object({
  testIds: Joi.array()
    .items(Joi.string().trim().required())
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one test ID is required',
      'array.base': 'testIds must be an array',
    }),
});

export const createAttemptValidation = Joi.object({
  testId: Joi.string().trim().required().messages({
    'string.empty': 'Test ID is required',
  }),
});

export const submitAttemptValidation = Joi.object({
  answers: Joi.object().pattern(
    Joi.string(),
    Joi.number().integer().min(0).required()
  ).required().messages({
    'object.base': 'Answers must be an object',
  }),
});

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    next();
  };
};

