// API response example
const res = {
    "status": 200,
    "success": true,
    "message": "Products fetched successfully",
    "data": [],
    "meta": {
        // pagination
        "page": 1,
        "limit": 10,
        "total": 100
    }
}
import { Response } from "express";
import crypto from "crypto";

export function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Generates a weak ETag from a resource's id + last-updated timestamp, used
// for conditional GET requests (If-None-Match -> 304 Not Modified).
export function generateETag(id: string, updatedAt?: Date | string): string {
    const stamp = updatedAt ? new Date(updatedAt).getTime() : Date.now();
    const hash = crypto.createHash("md5").update(`${id}:${stamp}`).digest("hex");
    return `W/"${hash}"`;
}

export interface PaginationMeta{
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
}

export interface ApiResponse<T>{
    status: number;
    success: boolean;
    message: string;
    data: T;
    meta?: PaginationMeta; // optional
}

export class ApiResponseHelper {
    static success<T>(
        res: Response,
        data: T,
        message: string = "Success",
        status: number = 200,
        meta?: PaginationMeta
    ): Response {
        const response: ApiResponse<T> = {
            status,
            success: true,
            message,
            data,
            meta
        }
        return res.status(status).json(response);
    }
    static error(
        res: Response,
        message: string = "Error",
        status: number = 500,
    ): Response {
        const response: ApiResponse<null> = {
            status,
            success: false,
            message,
            data: null
        }
        return res.status(status).json(response);
    }
}