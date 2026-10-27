import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getInquiries, getProjects, getServices, getWhy, getWhyHeading } from "@/lib/store";
import { FEATURED_MAX, splitWork } from "@/content/projects";
import { deleteInquiry, deleteProject, deleteService, deleteWhy, markInquiriesSeen, moveProject, moveService, moveWhy } from "./actions";
import { ConfirmButton, WhyHeadingForm } from "./forms";
import { Bar } from "./ui";

type Tab = "services" | "work" | "why" | "requests";

/** One row of a list: picture, names in both languages, a line, and its buttons. */
function Item({ thumb, tags = [], title, ar, line, edit, up, down, remove, name }: { thumb?: string; tags?: string[]; title: string; ar: string; line: string; edit: string; up: () => Promise<void>; down: () => Promise<void>; remove: () => Promise<void>; name: string }) {
  return (
    <li className="a-item">
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" className="a-thumb" />
      ) : (
        <div className="a-thumb a-empty">—</div>
      )}
      <div className="a-text">
        <strong>
          {title}
          {tags.map((tag) => (
            <em key={tag} className="a-tag">
              {tag}
            </em>
          ))}
        </strong>
        <span dir="rtl">{ar}</span>
        <p>{line}</p>
      </div>
      <div className="a-buttons">
        <Link href={edit} className="a-btn">
          Edit
        </Link>
        <form action={up}>
          <button type="submit" className="a-btn a-icon" aria-label="Move up">
            ↑
          </button>
        </form>
        <form action={down}>
          <button type="submit" className="a-btn a-icon" aria-label="Move down">
            ↓
          </button>
        </form>
        <form action={remove}>
          <ConfirmButton message={`Delete “${name}”? This cannot be undone.`}>Delete</ConfirmButton>
        </form>
      </div>
    </li>
  );
}

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const q = await searchParams;
  const tab: Tab = q.tab === "work" || q.tab === "why" || q.tab === "requests" ? q.tab : "services";
  const [services, projects, why, whyHeading, inquiries] = await Promise.all([getServices(), getProjects(), getWhy(), getWhyHeading(), getInquiries()]);
  const story = new Set(splitWork(projects).story.map((p) => p.id));
  const fresh = inquiries.filter((i) => !i.seen).length;
  const tabs: [Tab, string][] = [
    ["services", `Services (${services.length})`],
    ["work", `Our work (${projects.length})`],
    ["why", `Why us (${why.length})`],
    ["requests", `Requests${fresh ? ` · ${fresh} new` : ` (${inquiries.length})`}`],
  ];

  return (
    <>
      <Bar />
      <main className="a-main">
        <nav className="a-tabs">
          {tabs.map(([id, label]) => (
            <Link key={id} href={`/admin?tab=${id}`} aria-current={tab === id ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        {q.saved && <p className="a-ok">Saved. The website now shows the change.</p>}

        {tab === "services" && (
          <section>
            <div className="a-head">
              <h1>Services</h1>
              <Link href="/admin/services/new" className="a-btn a-primary">
                + Add service
              </Link>
            </div>
            <p className="a-note">Shown in this order on the site: the services section, the contact form and the footer.</p>
            <ul className="a-list">
              {services.map((s) => (
                <Item
                  key={s.id}
                  thumb={s.media?.kind === "image" ? s.media.src : undefined}
                  title={s.title.en}
                  ar={s.title.ar}
                  line={s.description.en}
                  name={s.title.en}
                  edit={`/admin/services/${s.id}`}
                  up={moveService.bind(null, s.id, -1)}
                  down={moveService.bind(null, s.id, 1)}
                  remove={deleteService.bind(null, s.id)}
                />
              ))}
            </ul>
            {!services.length && <p className="a-note">No services. The section is hidden until you add one.</p>}
          </section>
        )}

        {tab === "work" && (
          <section>
            <div className="a-head">
              <h1>Our work</h1>
              <Link href="/admin/work/new" className="a-btn a-primary">
                + Add project
              </Link>
            </div>
            <p className="a-note">
              Shown in this order. The featured ones (up to {FEATURED_MAX}; with none ticked, the first {FEATURED_MAX}) play in the big scroll story; the rest sit in the &ldquo;More work&rdquo; row under it.
            </p>
            <ul className="a-list">
              {projects.map((p) => {
                const video = p.media.find((m) => m.kind === "video");
                const image = p.media.find((m) => m.kind === "image")?.src ?? (video?.kind === "video" ? video.poster : undefined);
                return (
                  <Item
                    key={p.id}
                    thumb={image}
                    tags={[story.has(p.id) ? "scroll story" : "more work", ...(video ? ["video"] : [])]}
                    title={p.title.en}
                    ar={p.title.ar}
                    line={p.description.en}
                    name={p.title.en}
                    edit={`/admin/work/${p.id}`}
                    up={moveProject.bind(null, p.id, -1)}
                    down={moveProject.bind(null, p.id, 1)}
                    remove={deleteProject.bind(null, p.id)}
                  />
                );
              })}
            </ul>
            {!projects.length && <p className="a-note">No projects yet. The section shows its empty state until you add one.</p>}
          </section>
        )}

        {tab === "why" && (
          <section>
            <div className="a-head">
              <h1>Why us</h1>
              <Link href="/admin/why/new" className="a-btn a-primary">
                + Add point
              </Link>
            </div>
            <WhyHeadingForm heading={whyHeading} />
            <h2>Points</h2>
            <p className="a-note">Shown under the headline, in this order. Four fill the grid best.</p>
            <ul className="a-list">
              {why.map((p) => (
                <Item
                  key={p.id}
                  title={p.title.en}
                  ar={p.title.ar}
                  line={p.text.en}
                  name={p.title.en}
                  edit={`/admin/why/${p.id}`}
                  up={moveWhy.bind(null, p.id, -1)}
                  down={moveWhy.bind(null, p.id, 1)}
                  remove={deleteWhy.bind(null, p.id)}
                />
              ))}
            </ul>
            {!why.length && <p className="a-note">No points. The section is hidden until you add one.</p>}
          </section>
        )}

        {tab === "requests" && (
          <section>
            <div className="a-head">
              <h1>Requests</h1>
              {fresh > 0 && (
                <form action={markInquiriesSeen}>
                  <button type="submit" className="a-btn">
                    Mark all as read
                  </button>
                </form>
              )}
            </div>
            <p className="a-note">Everything sent through the &ldquo;Start a project&rdquo; form, newest first.</p>
            <ul className="a-list">
              {inquiries.map((r) => (
                <li key={r.id} className={`a-item a-request${r.seen ? "" : " a-new"}`}>
                  <div className="a-text">
                    <strong>
                      {r.name}
                      {r.company && <span className="a-muted"> · {r.company}</span>}
                      {!r.seen && <em className="a-tag">new</em>}
                    </strong>
                    <span>
                      <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`} dir="ltr">
                        {r.phone}
                      </a>
                      <span className="a-muted"> · {new Date(r.at).toLocaleString("en-GB", { timeZone: "Asia/Riyadh", dateStyle: "medium", timeStyle: "short" })}</span>
                    </span>
                    <p>
                      <b>{r.service || "No service picked"}</b>
                      {r.options.length > 0 && <> · {r.options.join(", ")}</>}
                    </p>
                    {r.notes && <p className="a-notes">{r.notes}</p>}
                  </div>
                  <div className="a-buttons">
                    <form action={deleteInquiry.bind(null, r.id)}>
                      <ConfirmButton message={`Delete the request from ${r.name}?`}>Delete</ConfirmButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
            {!inquiries.length && <p className="a-note">No requests yet.</p>}
          </section>
        )}
      </main>
    </>
  );
}
