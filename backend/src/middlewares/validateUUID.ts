import { NextFunction, Request, Response } from "express";
import { validate as uuidValidate } from "uuid";
import { AppError } from "../utils/AppError";

export const validateUUID = (paramNames: string | string[]) => {
  const params = Array.isArray(paramNames) ? paramNames : [paramNames];
  return (req: Request, _res: Response, next: NextFunction) => {
    for (const param of params) {
      const value = req.params[param];
      if (value && !uuidValidate(value)) {
        return next(new AppError(`Invalid UUID format for parameter: ${param}`, 400));
      }
    }
    next();
  };
};
