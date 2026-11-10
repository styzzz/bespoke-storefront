import Link from "next/link";

import { MAIN_STORE_URL } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p className="site-footer__brand">Made from Earth Bespoke</p>
        <nav className="site-footer__nav" aria-label="Footer">
          <Link href="/build">Build your formula</Link>
          <Link href="/ingredients">Ingredient library</Link>
          <a href={MAIN_STORE_URL}>madefromearth.com</a>
        </nav>
        <p className="site-footer__note">
          Cosmetic products. Not intended to diagnose, treat, cure or prevent any disease. Checkout
          and orders are handled by the Made from Earth store.
        </p>
      </div>
    </footer>
  );
}
