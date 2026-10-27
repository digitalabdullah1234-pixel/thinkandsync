import Link from "next/link";
import { logout } from "./actions";

/** The admin's top bar: the name, a link to the site, and sign out. */
export function Bar() {
  return (
    <header className="a-bar">
      <Link href="/admin" className="a-brand">
        ThinkSync <span>admin</span>
      </Link>
      <nav>
        <a href="/" target="_blank" rel="noreferrer">
          View site ↗
        </a>
        <form action={logout}>
          <button type="submit" className="a-link">
            Sign out
          </button>
        </form>
      </nav>
    </header>
  );
}
