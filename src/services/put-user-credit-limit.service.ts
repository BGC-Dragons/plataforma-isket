import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

export interface IPutUserCreditLimitRequest {
  userId: string;
  unitType: "PROPERTY_VALUATION" | "RESIDENT_SEARCH" | "RADARS";
  limitAmount: number | null;
}

export const putUserCreditLimitPATH = "/payments/purchases/user-credit-limits";

export const putUserCreditLimit = (
  token: string,
  data: IPutUserCreditLimitRequest
): Promise<AxiosResponse<any>> => {
  return isketApiClient.put(putUserCreditLimitPATH, data, {
    headers: getHeader({ token }),
  });
};
