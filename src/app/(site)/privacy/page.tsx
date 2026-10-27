import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PrivacyPolicy } from "@/components/privacy/PrivacyPolicy";
import { connection } from "next/server";
import { getServices } from "@/lib/store";

export const metadata: Metadata = {
  title: "Privacy Policy · ThinkSync",
  description: "What ThinkSync collects through this site, why, and how to reach us about it.",
};

/** The privacy policy, between the site's header and footer. */
export default async function Privacy() {
  // Per request, like the home page: the footer lists the admin's services.
  await connection();
  const services = await getServices();
  return (
    <>
      <Header />
      <main className="flex-1">
        <PrivacyPolicy />
      </main>
      <Footer services={services} />
    </>
  );
}
