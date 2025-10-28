import { type Request, type Response, type NextFunction } from "express";

type AsyncHandler<U = Request, T = void> = (
  req: U,
  res: Response,
  next: NextFunction
) => Promise<T>;

const catchAsync =
  <U = Request, T = void>(fn: AsyncHandler<U, T>) =>
  (req: U, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };

export default catchAsync;
