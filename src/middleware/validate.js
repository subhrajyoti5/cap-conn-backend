const { ApiError } = require("../utils/ApiError");

const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const message = result.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      throw new ApiError(400, message, "VALIDATION_ERROR");
    }

    req.validated = result.data;
    next();
  };
};

module.exports = { validate };
