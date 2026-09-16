export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-tamil text-3xl font-extrabold text-black">தொடர்பு கொள்ள</h1>
      <p className="mt-4 text-[17px] leading-8 text-black/80">
        For editorial inquiries or feedback, reach us at{' '}
        <a href="mailto:contact@agnisiragu.com" className="text-brand-red underline">
          contact@agnisiragu.com
        </a>
        .
      </p>
    </div>
  );
}
