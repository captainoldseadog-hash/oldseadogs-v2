import { oldSeaDogsNewsletter } from "./newsletter";

export const oldSeaDogsSocialLinks = {
  tiktok: "https://www.tiktok.com/@oldseadogs8",
  instagram: "https://www.instagram.com/oldseadogs_website/",
  facebook: "https://www.facebook.com/Oldseadogs.FB/",
  x: "https://x.com/oldseadogs",
  youtube: "https://www.youtube.com/@oldseadogsnews/shorts",
  threads: "https://www.threads.com/@oldseadogs_website",
  linkedin: "https://www.linkedin.com/company/old-sea-dogs/?viewAsMember=true",
  substack: oldSeaDogsNewsletter.publicationUrl,
};

export type OldSeaDogsSocialPlatform = {
  key: keyof typeof oldSeaDogsSocialLinks;
  label: string;
  icon: string;
  handle: string;
  description: string;
  href: string;
};

export const oldSeaDogsSocialPlatforms: OldSeaDogsSocialPlatform[] = [
  {
    key: "tiktok",
    label: "TikTok",
    icon: "♪",
    handle: "@oldseadogs8",
    description: "Shorts from the waterfront, shows, ports and the odd salty aside.",
    href: oldSeaDogsSocialLinks.tiktok,
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: "◎",
    handle: "@oldseadogs_website",
    description: "Photos, reels and quick notes from the Old Sea Dogs beat.",
    href: oldSeaDogsSocialLinks.instagram,
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: "f",
    handle: "Oldseadogs.FB",
    description: "Follow stories, updates and discussion from the Old Sea Dogs community.",
    href: oldSeaDogsSocialLinks.facebook,
  },
  {
    key: "x",
    label: "X",
    icon: "X",
    handle: "@oldseadogs",
    description: "Fast headlines, links and race notes.",
    href: oldSeaDogsSocialLinks.x,
  },
  {
    key: "youtube",
    label: "YouTube",
    icon: "▶",
    handle: "@oldseadogsnews",
    description: "Old Sea Dogs Shorts and video updates.",
    href: oldSeaDogsSocialLinks.youtube,
  },
  {
    key: "threads",
    label: "Threads",
    icon: "@",
    handle: "@oldseadogs_website",
    description: "Short social notes and conversation around new stories.",
    href: oldSeaDogsSocialLinks.threads,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: "in",
    handle: "Old Sea Dogs",
    description: "Marine industry updates, publishing notes and business contact.",
    href: oldSeaDogsSocialLinks.linkedin,
  },
  {
    key: "substack",
    label: oldSeaDogsNewsletter.socialLabel,
    icon: "S",
    handle: oldSeaDogsNewsletter.socialHandle,
    description: oldSeaDogsNewsletter.socialDescription,
    href: oldSeaDogsSocialLinks.substack,
  },
];

export const oldSeaDogsSameAsLinks = [
  oldSeaDogsSocialLinks.tiktok,
  oldSeaDogsSocialLinks.instagram,
  oldSeaDogsSocialLinks.facebook,
  oldSeaDogsSocialLinks.x,
  oldSeaDogsSocialLinks.youtube,
  oldSeaDogsSocialLinks.threads,
  oldSeaDogsSocialLinks.linkedin,
  oldSeaDogsSocialLinks.substack,
];

export type OldSeaDogsVideoItem = {
  id: string;
  platform: "TikTok" | "YouTube";
  title: string;
  description: string;
  watchUrl: string;
  embedUrl: string;
};

export const oldSeaDogsLatestVideos: OldSeaDogsVideoItem[] = [
  {
    id: "oldseadogs-tiktok-channel",
    platform: "TikTok",
    title: "Old Sea Dogs on TikTok",
    description: "Latest short videos from the Old Sea Dogs TikTok channel.",
    watchUrl: oldSeaDogsSocialLinks.tiktok,
    embedUrl: "",
  },
  {
    id: "oldseadogs-youtube-shorts",
    platform: "YouTube",
    title: "Old Sea Dogs YouTube Shorts",
    description: "Short video updates from the Old Sea Dogs YouTube channel.",
    watchUrl: oldSeaDogsSocialLinks.youtube,
    embedUrl: "",
  },
];
