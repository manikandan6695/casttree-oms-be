import * as Joi from "joi";

export function getValidator(type, field) {
  let schema;
  switch (type) {
    case "boolean":
      schema = Joi.bool().messages({
        "boolean.base": `${field} must be true or false`,
      });
      break;
    case "boolean_required":
      schema = Joi.bool()
        .required()
        .messages({
          "boolean.base": `${field} must be true or false`,
          "any.required": `${field} is required.`,
        });
      break;
    case "number_string":
      schema = Joi.number()
        .cast("string")
        .messages({
          "number.base": `${field} must be a numberic value`,
          "string.empty": `${field} cannot be an empty field`,
        });
      break;
    case "number_string_required":
      schema = Joi.number()
        .cast("string")
        .required()
        .messages({
          "number.base": `${field} must be a numberic value`,
          "string.empty": `${field} cannot be an empty field`,
        });
      break;
    case "string":
      schema = Joi.string().messages({
        "string.base": `${field} must be a text`,
        "string.empty": `${field} cannot be an empty field`,
      });
      break;
    case "string_required":
      schema = Joi.string()
        .required()
        .messages({
          "string.base": `${field} must be a text`,
          "string.empty": `${field} cannot be an empty field`,
          "any.required": `${field} is required.`,
        });
      break;
    case "string_email":
      console.log("email called");
      schema = Joi.string()
        .email({ tlds: { allow: false } })
        .messages({
          "string.email": `${field} must be a valid email`,
          "string.base": `${field} must be a text`,
          "string.empty": `${field} cannot be an empty field`,
        });
      break;
    case "string_email_required":
      console.log("email called");
      schema = Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .messages({
          "string.email": `${field} must be a valid email`,
          "string.base": `${field} must be a text`,
          "string.empty": `${field} cannot be an empty field`,
          "any.required": `${field} is required.`,
        });
      break;
    default:
      break;
  }
  return schema;
}
