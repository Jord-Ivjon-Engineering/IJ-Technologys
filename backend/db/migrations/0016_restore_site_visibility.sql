update public.site_settings
set
  visibility = visibility || '{}'::jsonb || '{
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
  }'::jsonb,
  footer = footer || '{}'::jsonb || '{
    "tagline": {"en": "A web studio building websites, shops and digital tools for businesses across the region.", "sq": "Një studio web që ndërton faqe, dyqane dhe mjete dixhitale për biznese në rajon."},
    "copyright": {"en": "© 2026 IJ Technology. All rights reserved.", "sq": "© 2026 IJ Technology. Të gjitha të drejtat e rezervuara."},
    "credit": {"en": "Designed and built by us.", "sq": "Dizenjuar dhe ndërtuar nga ne."},
    "requestCall": {"en": "Request a call", "sq": "Kërko një telefonatë"}
  }'::jsonb,
  updated_at = now()
where id = true
  and (
    coalesce(visibility->'projects'->'title', 'null'::jsonb) = 'null'::jsonb
    or coalesce(visibility->'pricing'->'title', 'null'::jsonb) = 'null'::jsonb
    or coalesce(footer->'tagline', 'null'::jsonb) = 'null'::jsonb
  );
