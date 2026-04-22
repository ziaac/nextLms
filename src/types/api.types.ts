/** Response list dengan pagination */
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

/** Response error standar dari API */
export interface ApiError {
  statusCode: number
  message: string | string[]
  error: string
  timestamp: string
  path: string
}

/** Query params pagination */
export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
}

/** Response upload file public */
export interface UploadPublicResponse {
  url: string
  key: string
}

/** Response upload file private */
export interface UploadPrivateResponse {
  key: string
  bucket: string
}

/** Response presigned URL */
export interface PresignedResponse {
  url: string
  expiresAt: string
}
