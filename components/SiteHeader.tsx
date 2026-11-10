import Link from "next/link";

import { MAIN_STORE_URL } from "@/lib/config";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="wordmark" aria-label="Made from Earth Bespoke, home">
          <span className="wordmark__brand">Made from Earth</span>
          <span className="wordmark__lab">Bespoke</span>
        </Link>
        <nav className="site-nav" aria-label="Main">
          <Link href="/ingredients">Ingredients</Link>
          <a href={MAIN_STORE_URL}>Main store</a>
          <Link href="/build" className="btn btn--small btn--primary">
            Build yours
          </Link>
        </nav>
      </div>
    </header>
  );
}
