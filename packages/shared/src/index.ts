/**
 * Shared types and utilities for the monorepo
 * These exports demonstrate the @vercel/node composite tsconfig issue
 */

// Complex generic type that will resolve as 'unknown' when composite is stripped
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: number;
  requestId: string;
}

// Branded type for type-safe IDs
export type UserId = string & { readonly __brand: 'UserId' };
export type PostId = string & { readonly __brand: 'PostId' };

// User entity with strict typing
export interface User {
  id: UserId;
  email: string;
  name: string;
  createdAt: Date;
  metadata: Record<string, unknown>;
}

// Post entity referencing User
export interface Post {
  id: PostId;
  authorId: UserId;
  title: string;
  content: string;
  tags: string[];
  publishedAt: Date | null;
}

// Generic paginated response
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Utility type for creating responses
export type CreateResponse<T> = ApiResponse<T>;

// Helper function with generic return type
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: Date.now(),
    requestId: crypto.randomUUID(),
  };
}

// Helper function for error responses
export function createErrorResponse<T = never>(message: string): ApiResponse<T> & { error: string } {
  return {
    success: false,
    data: undefined as unknown as T,
    timestamp: Date.now(),
    requestId: crypto.randomUUID(),
    error: message,
  };
}

// Validation utilities
export function isUserId(value: string): value is UserId {
  return typeof value === 'string' && value.length > 0;
}

export function isPostId(value: string): value is PostId {
  return typeof value === 'string' && value.length > 0;
}

// Type guard for User
export function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj &&
    'name' in obj
  );
}

// Mock data factory for testing
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'user-123' as UserId,
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    metadata: {},
    ...overrides,
  };
}

export function createMockPost(overrides?: Partial<Post>): Post {
  return {
    id: 'post-456' as PostId,
    authorId: 'user-123' as UserId,
    title: 'Test Post',
    content: 'Test content',
    tags: ['test'],
    publishedAt: null,
    ...overrides,
  };
}

// Constants that will be used across the monorepo
export const API_VERSION = 'v1';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
