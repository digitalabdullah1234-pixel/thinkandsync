import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { SERVICES, type Service } from "@/content/services";
import { PROJECTS, type Project } from "@/content/projects";
import { WHY, WHY_HEADING, type WhyHeading, type WhyPoint } from "@/content/why";

/**
 * The site's editable content, kept as JSON files on the server's disk (the
 * admin panel writes them, the pages read them). Until the admin first saves
 * a list, the list in src/content is used.
 *
 * DATA_DIR (default ./data) must be on a disk that survives restarts and
 * redeploys: a VPS or any Node host with a persistent volume.
 */
export const DATA_DIR = process.env.DATA_DIR ?? path.join(/*turbopackIgnore: true*/ process.cwd(), "data");
export const UPLOAD_DIR = path.join(/*turbopackIgnore: true*/ DATA_DIR, "uploads");

// The data folder is chosen at run time; keep the bundler from tracing the whole project because of it.
const file = (name: string) => path.join(/*turbopackIgnore: true*/ DATA_DIR, name);

async function readJson<T>(name: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file(name), "utf8")) as T;
  } catch (error) {
    // A copy: a save changes the list it reads in place, and must never change the seed in src/content.
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return structuredClone(fallback);
    throw error;
  }
}

/** Written to a temporary file first, then renamed over the old one, so a crash never leaves half a file. */
async function writeJson(name: string, value: unknown) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = file(`${name}.${randomUUID()}.tmp`);
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf8");
  await fs.rename(tmp, file(name));
}

/** Changes run one at a time, so two saves never read the same list and drop each other's edit. */
let queue: Promise<unknown> = Promise.resolve();
function serial<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task);
  queue = run.catch(() => undefined);
  return run;
}

/** Read a list, change it, write it back, in one turn of the queue. */
function update<T>(name: string, fallback: T[], change: (list: T[]) => T[] | void) {
  return serial(async () => {
    const list = await readJson<T[]>(name, fallback);
    const next = change(list) ?? list;
    await writeJson(name, next);
    return next;
  });
}

// Services

export const getServices = () => readJson<Service[]>("services.json", SERVICES);
export const updateServices = (change: (list: Service[]) => Service[] | void) => update("services.json", SERVICES, change);

// Projects ("Our work")

export const getProjects = () => readJson<Project[]>("projects.json", PROJECTS);
export const updateProjects = (change: (list: Project[]) => Project[] | void) => update("projects.json", PROJECTS, change);

// Why us

export const getWhy = () => readJson<WhyPoint[]>("why.json", WHY);
export const updateWhy = (change: (list: WhyPoint[]) => WhyPoint[] | void) => update("why.json", WHY, change);

export const getWhyHeading = () => readJson<WhyHeading>("why-heading.json", WHY_HEADING);
export const setWhyHeading = (heading: WhyHeading) => serial(() => writeJson("why-heading.json", heading));

// Contact requests

export interface Inquiry {
  id: string;
  /** ISO time it arrived. */
  at: string;
  name: string;
  company: string;
  phone: string;
  service: string;
  options: string[];
  notes: string;
  /** Set once the team has opened it in the admin. */
  seen?: boolean;
}

export const getInquiries = () => readJson<Inquiry[]>("inquiries.json", []);
export const updateInquiries = (change: (list: Inquiry[]) => Inquiry[] | void) => update<Inquiry>("inquiries.json", [], change);

// Uploads

const KINDS = {
  image: { types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/gif": "gif" }, max: 10 * 1024 * 1024 },
  video: { types: { "video/mp4": "mp4", "video/webm": "webm" }, max: 60 * 1024 * 1024 },
} as const;

export const MEDIA_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
};

/** An uploaded file's name: a random id and its type. Nothing else is ever served. */
export const MEDIA_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|avif|gif|mp4|webm)$/;

/** Saves an uploaded photo or film and returns the path the site shows it at (/media/<name>). */
export async function saveUpload(upload: File, kind: keyof typeof KINDS): Promise<string> {
  const rule = KINDS[kind];
  const ext = (rule.types as Record<string, string>)[upload.type];
  if (!ext) throw new Error(kind === "image" ? "The picture must be JPG, PNG, WebP, AVIF or GIF." : "The video must be MP4 or WebM.");
  if (upload.size > rule.max) throw new Error(`The file is too large (max ${rule.max / 1024 / 1024} MB).`);
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name), Buffer.from(await upload.arrayBuffer()));
  return `/media/${name}`;
}

/** Removes an uploaded file the site no longer uses. Files that came with the site (under /public) are left alone. */
export async function removeUpload(src: string | undefined) {
  const name = src?.startsWith("/media/") ? src.slice("/media/".length) : "";
  if (!MEDIA_NAME.test(name)) return;
  await fs.rm(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name), { force: true });
}
