import { Request } from "express";
import { type ParsedQs } from "qs";
import { z, type ZodRawShape, ZodObject } from "zod";

type ShapeOf<S extends z.ZodType> =
  S extends ZodObject<infer Shape extends ZodRawShape> ? Shape : never;

type ParamSchema<S extends z.ZodType> =
  ShapeOf<S> extends { params: infer Params } ? Params : undefined;

type BodySchema<S extends z.ZodType> = ShapeOf<S> extends { body: infer Body } ? Body : undefined;

type QuerySchema<S extends z.ZodType> =
  ShapeOf<S> extends { query: infer Query } ? Query : undefined;

type InferOrDefault<Schema, Default> = Schema extends z.ZodType ? z.infer<Schema> : Default;

type RequestParams<S extends z.ZodType> = InferOrDefault<ParamSchema<S>, Record<string, string>>;
type RequestBody<S extends z.ZodType> = InferOrDefault<BodySchema<S>, unknown>;
type RequestQuery<S extends z.ZodType> = InferOrDefault<QuerySchema<S>, ParsedQs>;

// Helper type that specializes the template parameters for an express Request
// type based on the zod request schema validations
export type ZodRequest<S extends z.ZodType> = Request<
  RequestParams<S>,
  unknown,
  RequestBody<S>,
  RequestQuery<S>
>;
