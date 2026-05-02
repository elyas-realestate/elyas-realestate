// Alias — كلود/المستخدمون قد يحاولون /finance بدل /financial
import { redirect } from "next/navigation";

export default function FinanceRedirect() {
  redirect("/dashboard/financial");
}
