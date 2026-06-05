import { NextFunction, Request, Response } from "express";

export const auth = (_request: Request, _response: Response, next: NextFunction) => {
  next();
};
