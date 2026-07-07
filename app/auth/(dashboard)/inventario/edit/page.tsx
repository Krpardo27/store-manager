import { redirect } from "next/navigation";

export default function LegacyInventarioEditPage() {
  redirect("/auth/inventario");
}