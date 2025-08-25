// lib/validation.ts
import { z } from "zod";

export const StoreEnum = z.enum(["KABUM", "TERABYTE", "PICHAU"]);

export const createProductSchema = z.object({
  name: z.string().min(2),
  store: StoreEnum,
  url: z.string().url().min(10),
  sku: z.string().min(1).max(64).optional(),
  isActive: z.boolean().optional().default(true),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

// Ajuda a validar query do histórico
export const priceHistoryQuerySchema = z.object({
  productId: z.string().min(1),
  days: z
    .string()
    .transform((s) => parseInt(s, 10))
    .pipe(z.number().int().min(1).max(365))
    .optional(),
});
