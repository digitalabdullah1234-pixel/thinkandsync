import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getWhy } from "@/lib/store";
import { WhyForm } from "../../forms";
import { Bar } from "../../ui";

export default async function EditWhy({ params }: PageProps<"/admin/why/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const point = id === "new" ? undefined : (await getWhy()).find((p) => p.id === id);
  if (id !== "new" && !point) notFound();
  return (
    <>
      <Bar />
      <main className="a-main">
        <Link href="/admin?tab=why" className="a-back">
          ← Why us
        </Link>
        <h1>{point ? `Edit: ${point.title.en}` : "New point"}</h1>
        <WhyForm point={point} />
      </main>
    </>
  );
}
