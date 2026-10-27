import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getProjects } from "@/lib/store";
import { ProjectForm } from "../../forms";
import { Bar } from "../../ui";

export default async function EditProject({ params }: PageProps<"/admin/work/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const project = id === "new" ? undefined : (await getProjects()).find((p) => p.id === id);
  if (id !== "new" && !project) notFound();
  return (
    <>
      <Bar />
      <main className="a-main">
        <Link href="/admin?tab=work" className="a-back">
          ← Our work
        </Link>
        <h1>{project ? `Edit: ${project.title.en}` : "New project"}</h1>
        <ProjectForm project={project} />
      </main>
    </>
  );
}
