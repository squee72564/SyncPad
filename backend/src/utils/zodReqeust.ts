import { Request } from "express";
import { z } from "zod";
import { ParsedQs } from "qs";

// Helper type that specializes the template parameters for an express Request
// type based on the zod request schema validations
export type ZodRequest<S extends z.ZodTypeAny> = Request<
  S extends { shape: { params: infer P } } ? z.infer<P> : Record<string, string>, // default if no params
  unknown, // res body
  S extends { shape: { body: infer B } } ? z.infer<B> : unknown,
  S extends { shape: { query: infer Q } } ? z.infer<Q> : ParsedQs
>;
