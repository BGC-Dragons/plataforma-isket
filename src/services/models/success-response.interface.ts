export interface SuccessResponse<D> {
  statusCode: number;
  message: string;
  data: D;
}
