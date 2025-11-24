import z from "zod";

export const paginationSchema = z.object({
  cursor: z.cuid("cursor must be a valid CUID").optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
