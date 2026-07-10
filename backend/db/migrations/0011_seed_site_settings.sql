insert into public.site_settings (id, hero, stats, strip, footer, contact, visibility)
values (
  true,
  '{
    "label": {"en": "Web studio for local businesses", "sq": "Studio web për biznese lokale"},
    "title": {"en": "Websites and shops you can trust to launch on time.", "sq": "Faqe dhe dyqane që mund t''i besosh për nisje në kohë."},
    "lead": {"en": "We design and build websites, online shops and custom tools for shops, guesthouses and restaurants in the region. One team from first sketch to launch, with clear pricing and weekly progress.", "sq": "Ne projektojmë dhe ndërtojmë faqe interneti, dyqane online dhe mjete të personalizuara për dyqane, bujtina dhe restorante në rajon. Një ekip nga skica e parë deri te nisja, me çmime të qarta dhe progres çdo javë."},
    "ctaPrimary": {"en": "Start with Pro →", "sq": "Nis me Pro →"},
    "ctaSecondary": {"en": "See pricing", "sq": "Shiko çmimet"},
    "ctaPrimaryPlan": "Pro",
    "cardTitle": {"en": "Built to work on every screen.", "sq": "Ndërtuar për çdo ekran."},
    "cardMeta": {"en": "Design, code and launch in one place.", "sq": "Dizajn, kod dhe nisje në një vend."},
    "hintDesktop": {"en": "Move your mouse to explore", "sq": "Lëviz mausin për të eksploruar"},
    "hintMobile": {"en": "Built for phones and desktops alike.", "sq": "Ndërtuar për telefon dhe desktop njësoj."}
  }'::jsonb,
  '{
    "projectsLaunched": 48,
    "happyClients": 31,
    "countriesReached": 6,
    "projectsLaunchedLabel": {"en": "projects launched", "sq": "projekte të nisura"},
    "happyClientsLabel": {"en": "happy clients", "sq": "klientë të kënaqur"},
    "countriesReachedLabel": {"en": "countries reached", "sq": "vende të arritura"}
  }'::jsonb,
  '{
    "text": {"en": "Websites ◆ Online shops ◆ Web apps ◆ Booking systems ◆ Branding ◆ Hosting & care ◆ SEO ◆ Animations ◆", "sq": "Faqe interneti ◆ Dyqane online ◆ Aplikacione web ◆ Sisteme rezervimi ◆ Branding ◆ Hostim & mirëmbajtje ◆ SEO ◆ Animacione ◆"}
  }'::jsonb,
  '{
    "tagline": {"en": "A web studio building websites, shops and digital tools for businesses across the region.", "sq": "Një studio web që ndërton faqe, dyqane dhe mjete dixhitale për biznese në rajon."},
    "instagram": "https://instagram.com/ijtechnologys",
    "email": "hello@ijtechnologys.com",
    "copyright": {"en": "© 2026 IJ Technologys. All rights reserved.", "sq": "© 2026 IJ Technologys. Të gjitha të drejtat e rezervuara."},
    "credit": {"en": "Designed and built by us.", "sq": "Dizenjuar dhe ndërtuar nga ne."},
    "requestCall": {"en": "Request a call", "sq": "Kërko një telefonatë"}
  }'::jsonb,
  '{
    "title": {"en": "Tell us about your project", "sq": "Na trego për projektin tënd"},
    "subtitle": {"en": "We reply within one business day. Your message goes straight to our inbox.", "sq": "Të kthehemi brenda një dite pune. Mesazhi yt shkon drejt te ne."},
    "steps": [
      {"en": "1. Send details", "sq": "1. Dërgo detajet"},
      {"en": "2. We reply with next steps", "sq": "2. Përgjigjemi me hapat"},
      {"en": "3. Start when you''re ready", "sq": "3. Nis kur të jesh gati"}
    ]
  }'::jsonb,
  '{
    "projects": {
      "title": {"en": "Recent work from the region", "sq": "Punë e fundit nga rajoni"},
      "subtitleDesktop": {"en": "Scroll to rotate the globe and browse projects we built for shops, stays and local services.", "sq": "Lëviz poshtë për të rrotulluar globin dhe shfletuar projektet që kemi ndërtuar për dyqane, bujtina dhe shërbime lokale."},
      "subtitleMobile": {"en": "Projects we built for shops, guesthouses and local services in the region.", "sq": "Projekte që kemi ndërtuar për dyqane, bujtina dhe shërbime lokale në rajon."}
    },
    "pricing": {
      "title": {"en": "Clear packages, clear prices", "sq": "Paketa të qarta, çmime të qarta"},
      "subtitle": {"en": "Every plan includes responsive design and support after launch. Pick a starting point and we tailor the rest.", "sq": "Çdo plan përfshin dizajn responsiv dhe suport pas nisjes. Zgjidh një pikënisje dhe pjesën tjetër e përshtatim ne."},
      "note": {"en": "Prices are one-time project fees. Hosting renewal after the first year is quoted separately. VAT applied where required.", "sq": "Çmimet janë tarifa projekti një herë. Rinovimi i hostimit pas vitit të parë kuotohet veçmas. TVSH aplikohet ku kërkohet."}
    }
  }'::jsonb
)
on conflict (id) do update
set hero = excluded.hero,
    stats = excluded.stats,
    strip = excluded.strip,
    footer = excluded.footer,
    contact = excluded.contact,
    visibility = excluded.visibility,
    updated_at = now();
