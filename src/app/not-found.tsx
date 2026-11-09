import Link from 'next/link';
export default function NotFound() {
  return (
    <section className="prose">
      <h1>Page not found</h1>
      <p>That page doesn&apos;t exist (or the slot has moved). Try the <Link href="/slots">slot database</Link>, browse <Link href="/providers">providers</Link> or see our <Link href="/best">best slots lists</Link>.</p>
    </section>
  );
}
