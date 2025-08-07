import axios from "axios";
import MockAdapter from "axios-mock-adapter";

export const mockAdapter = new MockAdapter(axios, {
  delayResponse: 3000,
  onNoMatch: "passthrough",
});

export default mockAdapter;
