import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getServices } from "@/lib/store";
import { ServiceForm } from "../../forms";
import { Bar } from "../../ui";

export default async function EditService({ params }: PageProps<"/admin/services/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const service = id === "new" ? undefined : (await getServices()).find((s) => s.id === id);
  if (id !== "new" && !service) notFound();
  return (
    <>
      <Bar />
      <main className="a-main">
        <Link href="/admin?tab=services" className="a-back">
          ← Services
        </Link>
        <h1>{service ? `Edit: ${service.title.en}` : "New service"}</h1>
        <ServiceForm service={service} />
      </main>
    </>
  );
}
