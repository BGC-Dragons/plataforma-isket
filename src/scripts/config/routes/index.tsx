import { createBrowserRouter, RouterProvider } from "react-router";
import { Login } from "../../pages/public/Login";
import { ForgotPassword } from "../../pages/public/ForgotPassword";
import { SignUp } from "../../pages/public/SignUp";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/esqueceu-senha",
    element: <ForgotPassword />,
  },
  {
    path: "/cadastro",
    element: <SignUp />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
