// src/components/SectionHeading.tsx
// Red-accent section label used above the main article grid — the
// bar-plus-bold-caps heading pattern common to Dinamani/Vikatan sections.

export default function SectionHeading({ title }: { title: string }) {
  return (
    <div className="mb-5 flex items-center gap-2.5">
      <span className="h-6 w-1.5 rounded-full bg-brand-red" />
      <h2 className="font-tamil text-xl font-extrabold text-black">{title}</h2>
    </div>
  );
}
