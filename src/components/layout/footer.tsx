import Link from "next/link";
import { BUSINESS_NAME, CONTACT } from "@/lib/constants";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background px-5 py-12 md:px-8">
      <div className="container-narrow flex flex-col items-center justify-between gap-6 md:flex-row">
        <div className="text-center md:text-left">
          <p className="text-lg font-semibold">{BUSINESS_NAME}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Coventry, UK
          </p>
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <a
            href={CONTACT.phoneHref}
            className="transition-colors hover:text-primary"
          >
            {CONTACT.phone}
          </a>
          <a
            href={CONTACT.instagramHref}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-primary"
          >
            Instagram
          </a>
          <Link
            href="/admin"
            className="transition-colors hover:text-primary"
          >
            Admin
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          &copy; {year} {BUSINESS_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
