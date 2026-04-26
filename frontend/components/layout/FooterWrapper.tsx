'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';

const HIDE_FOOTER_ON = ['/auth/login', '/auth/register'];

export default function FooterWrapper() {
  const pathname = usePathname();
  if (HIDE_FOOTER_ON.includes(pathname)) return null;
  return <Footer />;
}
