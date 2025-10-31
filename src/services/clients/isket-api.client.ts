import axios from "axios";
import { endpoints } from "../helpers/endpoint.constant";

export const isketApiClient = axios.create({
  baseURL: endpoints.api,
});
