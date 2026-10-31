import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { SiteSettings } from "@/lib/site-settings";

export function AnnouncementBar({ announcement }: { announcement: SiteSettings["announcement"] }) {
  if (!announcement.enabled || !announcement.text.trim()) return null;

  const content = (
    <>
      <Sparkles className="size-3.5 shrink-0 text-brand-orange" aria-hidden="true" />
      <span className="truncate">{announcement.text}</span>
    </>
  );

  return (
    <div className="bg-brand-night text-white">
      <div className="container-page flex h-9 items-center justify-center text-xs font-medium sm:text-[13px]">
        {announcement.href ? (
          <Link href={announcement.href} className="flex min-w-0 items-center gap-2 hover:underline underline-offset-4">
            {content}
          </Link>
        ) : (
          <p className="flex min-w-0 items-center gap-2">{content}</p>
        )}
      </div>
    </div>
  );
}
