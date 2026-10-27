import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { Projects } from "@/components/Projects";
import { WhyUs } from "@/components/WhyUs";
import { Process } from "@/components/Process";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { connection } from "next/server";
import { getProjects, getServices, getWhy, getWhyHeading } from "@/lib/store";

/**
 * The home page. Services, projects and the why-us points come from the admin's lists; the page
 * is rebuilt whenever the admin saves (see app/admin/actions.ts).
 */
export default async function Home() {
  // Rendered per request from the data folder, never baked in at build time:
  // a build doesn't see the server's data volume, so a baked page would show
  // the starting content after every deploy.
  await connection();
  const [services, projects, why, whyHeading] = await Promise.all([getServices(), getProjects(), getWhy(), getWhyHeading()]);
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Services list={services} />
        <Projects list={projects} />
        <WhyUs heading={whyHeading} points={why} />
        <Process />
        <Contact services={services} />
      </main>
      <Footer services={services} />
    </>
  );
}
