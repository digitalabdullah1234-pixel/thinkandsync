import type { ComponentType } from "react";
import Image from "next/image";
import {
  Cctv,
  Cloud,
  CodeXml,
  Fingerprint,
  Network,
  PhoneCall,
  Server,
  Tv,
  Wifi,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Accent } from "@/content/types";
import type { ServiceIcon, ServiceMedia, ServiceScreenKey } from "@/content/services";
import { AccessScreen } from "./AccessScreen";
import { CctvScreen } from "./CctvScreen";
import { CloudScreen } from "./CloudScreen";
import { IptvScreen } from "./IptvScreen";
import { NetworkScreen } from "./NetworkScreen";
import { PbxScreen } from "./PbxScreen";
import { ServersScreen } from "./ServersScreen";
import { SoftwareScreen } from "./SoftwareScreen";
import { SupportScreen } from "./SupportScreen";
import { WifiScreen } from "./WifiScreen";
import styles from "./Screens.module.css";

/** Each accent, as the token's CSS variable. */
export const ACCENT: Record<Accent, string> = {
  software: "var(--color-acc-software)",
  cloud: "var(--color-acc-cloud)",
  network: "var(--color-acc-network)",
  wifi: "var(--color-acc-wifi)",
  servers: "var(--color-acc-servers)",
  cctv: "var(--color-acc-cctv)",
  access: "var(--color-acc-access)",
  iptv: "var(--color-acc-iptv)",
  pbx: "var(--color-acc-pbx)",
  support: "var(--color-acc-support)",
};

/** The built-in live screens, by key. */
const SCREENS: Record<ServiceScreenKey, ComponentType> = {
  software: SoftwareScreen,
  cctv: CctvScreen,
  access: AccessScreen,
  network: NetworkScreen,
  servers: ServersScreen,
  wifi: WifiScreen,
  iptv: IptvScreen,
  pbx: PbxScreen,
  cloud: CloudScreen,
  support: SupportScreen,
};

/** The Lucide icon for each icon name a service can carry. */
const ICONS: Record<ServiceIcon, LucideIcon> = {
  code: CodeXml,
  camera: Cctv,
  fingerprint: Fingerprint,
  network: Network,
  server: Server,
  wifi: Wifi,
  tv: Tv,
  phone: PhoneCall,
  cloud: Cloud,
  wrench: Wrench,
};

/** A service's icon (decorative: the title beside it names the service). */
export function ServiceIconMark({ icon, size = 20, stroke = 1.75 }: { icon: ServiceIcon; size?: number; stroke?: number }) {
  const Icon = ICONS[icon] ?? Wrench;
  return <Icon size={size} strokeWidth={stroke} aria-hidden />;
}

/** A quiet stand-in: the service's icon, centred, in its accent. */
export function FallbackScreen({ icon }: { icon: ServiceIcon }) {
  const Icon = ICONS[icon] ?? Wrench;
  return (
    <div data-screen="fallback" className={`${styles.root} ${styles.fallback}`}>
      <Icon size={48} strokeWidth={1.5} />
    </div>
  );
}

/** What a service card shows on its screen: a live screen, a picture, or its icon. */
export function ServiceScreen({ media, icon, alt }: { media?: ServiceMedia; icon: ServiceIcon; alt?: string }) {
  if (media?.kind === "screen") {
    const Screen = SCREENS[media.screen];
    return <Screen />;
  }
  if (media?.kind === "image") {
    return <Image src={media.src} alt={alt ?? ""} fill sizes="(width < 64rem) 82vw, 33vw" style={{ objectFit: "cover" }} />;
  }
  return <FallbackScreen icon={icon} />;
}
