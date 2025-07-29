import { createBrowserRouter, RouterProvider } from "react-router";
import { App } from "../App";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
]);

export function Routes() {
  return <RouterProvider router={router} />;
}
