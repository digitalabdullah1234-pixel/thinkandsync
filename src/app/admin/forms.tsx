"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, type FormEvent, type ReactNode } from "react";
import type { Service } from "@/content/services";
import type { Project } from "@/content/projects";
import { WHY_ICONS, type WhyHeading, type WhyPoint } from "@/content/why";
import { login, saveProject, saveService, saveWhy, saveWhyHeading, type FormState } from "./actions";

function Problem({ state }: { state: FormState }) {
  return state?.error ? (
    <p className="a-error" role="alert">
      {state.error}
    </p>
  ) : null;
}

/** An English field and its Arabic twin, side by side. */
function Pair({ label, name, en, ar, area, hint, required }: { label: string; name: string; en?: string; ar?: string; area?: boolean; hint?: string; required?: boolean }) {
  const Tag = area ? "textarea" : "input";
  return (
    <fieldset className="a-pair">
      <legend>
        {label}
        {hint && <small> · {hint}</small>}
      </legend>
      <label>
        <span>English</span>
        <Tag name={`${name}_en`} defaultValue={en} required={required} rows={area ? 4 : undefined} />
      </label>
      <label>
        <span>العربية</span>
        <Tag name={`${name}_ar`} defaultValue={ar} dir="rtl" rows={area ? 4 : undefined} />
      </label>
    </fieldset>
  );
}

/** A file picker that shows the current picture (or the one just picked). */
function Picture({ label, name, current, accept, video, children }: { label: string; name: string; current?: string; accept: string; video?: boolean; children?: ReactNode }) {
  const [preview, setPreview] = useState<string | undefined>(current);
  return (
    <fieldset className="a-file">
      <legend>{label}</legend>
      {preview ? (
        video ? (
          <video src={preview} muted controls className="a-preview" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="a-preview" />
        )
      ) : (
        <div className="a-preview a-empty">{video ? "No video" : "No picture yet"}</div>
      )}
      <input
        type="file"
        name={name}
        accept={accept}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setPreview(URL.createObjectURL(f));
        }}
      />
      {children}
    </fieldset>
  );
}

/**
 * Submits through the action without React's automatic form reset, so a
 * refused save (a missing title, a wrong file type) keeps what was typed.
 */
function keep(action: (data: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };
}

function Save({ pending }: { pending: boolean }) {
  return (
    <div className="a-actions">
      <button type="submit" className="a-btn a-primary" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </button>
      <Link href="/admin" className="a-btn">
        Cancel
      </Link>
    </div>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="a-card a-login">
      <h1>ThinkSync admin</h1>
      <label>
        <span>Password</span>
        <input type="password" name="password" required autoFocus autoComplete="current-password" />
      </label>
      <Problem state={state} />
      <button type="submit" className="a-btn a-primary" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export function ServiceForm({ service }: { service?: Service }) {
  const [state, action, pending] = useActionState(saveService, undefined);
  const s = service;
  const photo = s?.media?.kind === "image" ? s.media.src : undefined;
  return (
    <form onSubmit={keep(action)} className="a-form">
      <input type="hidden" name="id" value={s?.id ?? ""} />
      <Picture label="Picture (shown on the service card)" name="image" current={photo} accept="image/jpeg,image/png,image/webp,image/avif,image/gif">
        {photo && (
          <label className="a-check">
            <input type="checkbox" name="remove_image" /> Remove the picture
          </label>
        )}
      </Picture>
      <Pair label="Title" name="title" en={s?.title.en} ar={s?.title.ar} required />
      <Pair label="Description" name="description" en={s?.description.en} ar={s?.description.ar} area />
      <Pair label="Tags" name="points" en={s?.points.en.join(", ")} ar={s?.points.ar.join(", ")} hint="comma separated, e.g. Next.js, Remix, Edge" />
      <Pair label="Contact form options" name="options" en={s?.options?.en.join("\n")} ar={s?.options?.ar.join("\n")} area hint="one per line: what a visitor can tick after picking this service" />
      <Problem state={state} />
      <Save pending={pending} />
    </form>
  );
}

export function ProjectForm({ project }: { project?: Project }) {
  const [state, action, pending] = useActionState(saveProject, undefined);
  const p = project;
  const video = p?.media.find((m) => m.kind === "video");
  const image = p?.media.find((m) => m.kind === "image")?.src ?? (video?.kind === "video" ? video.poster : undefined);
  return (
    <form onSubmit={keep(action)} className="a-form">
      <input type="hidden" name="id" value={p?.id ?? ""} />
      <div className="a-two">
        <Picture label="Picture (the cover)" name="image" current={image} accept="image/jpeg,image/png,image/webp,image/avif,image/gif" />
        <Picture label="Video (optional, MP4, plays on the card)" name="video" current={video?.src} accept="video/mp4,video/webm" video>
          {video && (
            <label className="a-check">
              <input type="checkbox" name="remove_video" /> Remove the video
            </label>
          )}
        </Picture>
      </div>
      <Pair label="Title" name="title" en={p?.title.en} ar={p?.title.ar} required />
      <Pair label="Description" name="description" en={p?.description.en} ar={p?.description.ar} area />
      <Pair label="Tags" name="tags" en={p?.tags.en.join(", ")} ar={p?.tags.ar.join(", ")} hint="comma separated" />
      <fieldset className="a-pair">
        <legend>
          Link <small> · optional: the live site or a case study</small>
        </legend>
        <label>
          <span>URL</span>
          <input type="url" name="link" defaultValue={p?.link} placeholder="https://" />
        </label>
      </fieldset>
      <label className="a-check">
        <input type="checkbox" name="featured" defaultChecked={!!p?.featured} /> Featured: play it in the big scroll story (up to 4; the rest go in the &ldquo;More work&rdquo; row under it)
      </label>
      <Problem state={state} />
      <Save pending={pending} />
    </form>
  );
}

export function WhyHeadingForm({ heading }: { heading: WhyHeading }) {
  const [state, action, pending] = useActionState(saveWhyHeading, undefined);
  return (
    <form onSubmit={keep(action)} className="a-form">
      <Pair label="Headline" name="title" en={heading.title.en} ar={heading.title.ar} required />
      <Pair label="Green words" name="accent" en={heading.accent.en} ar={heading.accent.ar} hint="copied exactly from the headline, e.g. partners" />
      <Problem state={state} />
      <Save pending={pending} />
    </form>
  );
}

export function WhyForm({ point }: { point?: WhyPoint }) {
  const [state, action, pending] = useActionState(saveWhy, undefined);
  const p = point;
  return (
    <form onSubmit={keep(action)} className="a-form">
      <input type="hidden" name="id" value={p?.id ?? ""} />
      <fieldset className="a-pair">
        <legend>Icon</legend>
        <label>
          <span>Shown above the title</span>
          <select name="icon" defaultValue={p?.icon ?? "team"}>
            {WHY_ICONS.map((i) => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </select>
        </label>
      </fieldset>
      <Pair label="Title" name="title" en={p?.title.en} ar={p?.title.ar} required />
      <Pair label="Text" name="text" en={p?.text.en} ar={p?.text.ar} area hint="one or two sentences" />
      <Problem state={state} />
      <Save pending={pending} />
    </form>
  );
}

/** A submit button that asks first. */
export function ConfirmButton({ children, message, className = "a-btn a-danger" }: { children: ReactNode; message: string; className?: string }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
