import { createBrowserRouter, RouterProvider } from "react-router";
import { Login } from "../../pages/public/Login";
import { ForgotPassword } from "../../pages/public/ForgotPassword";
import { SignUp } from "../../pages/public/SignUp";
import { CompleteProfile } from "../../pages/public/CompleteProfile";
import { EmailVerification } from "../../pages/public/EmailVerification";
import { CompleteSignUp } from "../../pages/public/CompleteSignUp";

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
  {
    path: "/complete-profile",
    element: <CompleteProfile />,
  },
  {
    path: "/email-verification",
    element: <EmailVerification />,
  },
  {
    path: "/complete-signup",
    element: <CompleteSignUp />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
