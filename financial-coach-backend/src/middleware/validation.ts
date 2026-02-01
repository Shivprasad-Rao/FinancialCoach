import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

// Generic validation middleware
export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: (error.issues || (error as any).errors || []).map((e: any) => ({
                    field: e.path.join('.'),
                    message: e.message
                }))
            });
        }
        next(error);
    }
};

// --- Schemas ---

// Goals
export const createGoalSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    target_amount: z.number().positive('Target amount must be positive'),
    deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Deadline must be YYYY-MM-DD').optional(),
});

export const updateGoalSchema = z.object({
    current_amount: z.number().nonnegative('Current amount must be non-negative'),
});

// Transactions
export const manualTransactionSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    description: z.string().min(1, 'Description is required'),
    amount: z.number().refine(val => val !== 0, 'Amount cannot be zero'),
    category: z.string().min(1, 'Category is required'),
    type: z.enum(['income', 'expense']),
});

export const csvUploadSchema = z.object({
    csvContent: z.string().min(1, 'CSV content is required'),
});
