export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 bg-ink-950 px-6 py-14">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-10 md:flex-row">
          <div>
            <p className="font-display text-3xl text-chalk">
              VYBE<span className="text-vybe">.</span>
            </p>
            <p className="mt-3 max-w-xs text-sm text-chalk/50">
              Pakistani streetwear with a western tarka. Made for the culture.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-16 gap-y-8 sm:grid-cols-3">
            <FooterCol
              title="Shop"
              links={['Hoodies', 'Sweatshirts', 'T-Shirts', 'New Drop']}
            />
            <FooterCol title="Brand" links={['Story', 'Fabric', 'Sustainability']} />
            <FooterCol
              title="Follow"
              links={['Instagram', 'TikTok', 'WhatsApp']}
            />
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-chalk/40 md:flex-row">
          <p>© {year} VYBE. All vibes reserved.</p>
          <p>Karachi · Lahore · Worldwide shipping</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <p className="mb-4 font-display text-xs uppercase tracking-[0.2em] text-vybe">
        {title}
      </p>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l}>
            <a href="#" className="text-sm text-chalk/60 transition-colors hover:text-chalk">
              {l}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
