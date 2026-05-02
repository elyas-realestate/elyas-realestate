// Redirect قديم — يحوّل /new إلى /add (المعيار الصناعي)
import { redirect } from "next/navigation";

export default function PropertyNewRedirect() {
  redirect("/dashboard/properties/add");
}
