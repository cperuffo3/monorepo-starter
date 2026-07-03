/**
 * User contract for /api/v1/users.
 * Dates are ISO-8601 strings — these types describe the JSON wire format,
 * not database entities (those live in the API's database layer).
 */
export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  name?: string;
}
