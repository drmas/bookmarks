import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { logout } from "~/utils/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  return logout(request);
}

export async function loader() {
  return redirect("/");
}