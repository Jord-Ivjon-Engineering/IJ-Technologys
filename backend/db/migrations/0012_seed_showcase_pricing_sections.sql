insert into public.showcase_projects (sort_order, tag, title, description, image_url, published)
select v.sort_order, v.tag, v.title, v.description, v.image_url, v.published from (values
  (0, '{"en":"online shop","sq":"dyqan online"}', '{"en":"Buna Market","sq":"Buna Market"}',
   '{"en":"E-commerce with cart, card payments and delivery tracking for a local grocer.","sq":"E-commerce me shportë, pagesa me kartë dhe gjurmim dërgesash për një dyqan lokal."}',
   'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=580&h=360&q=80', true),
  (1, '{"en":"booking system","sq":"sistem rezervimesh"}', '{"en":"Alpet Stay","sq":"Alpet Stay"}',
   '{"en":"Guesthouse booking with live calendar and instant confirmation, mobile-first.","sq":"Rezervime bujtine me kalendar live dhe konfirmim të çastit, së pari për celular."}',
   'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=580&h=360&q=80', true),
  (2, '{"en":"restaurant","sq":"restorant"}', '{"en":"Tavolina 12","sq":"Tavolina 12"}',
   '{"en":"Digital menu, table reservations and a gallery that shows the atmosphere.","sq":"Menu dixhitale, rezervime tavoline dhe galeri që tregon atmosferën."}',
   'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=580&h=360&q=80', true),
  (3, '{"en":"business portal","sq":"portal biznesi"}', '{"en":"Nord Logistics","sq":"Nord Logistics"}',
   '{"en":"Fleet dashboard and client area, bilingual and ready on phones.","sq":"Panel flote dhe zonë klientësh, dygjuhëshe dhe gati në telefon."}',
   'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=580&h=360&q=80', true),
  (4, '{"en":"portfolio","sq":"portofol"}', '{"en":"Studio Drin","sq":"Studio Drin"}',
   '{"en":"Scroll-led portfolio that puts the photographer''s work front and center.","sq":"Portofol me scroll që e vendos punën e fotografit në qendër."}',
   'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=580&h=360&q=80', true),
  (5, '{"en":"web app","sq":"aplikacion web"}', '{"en":"Faturo","sq":"Faturo"}',
   '{"en":"Invoicing for small businesses: create, send and track in seconds.","sq":"Faturim për biznese të vogla: krijo, dërgo dhe gjurmo në sekonda."}',
   'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=580&h=360&q=80', true)
) as v(sort_order, tag, title, description, image_url, published)
where not exists (select 1 from public.showcase_projects limit 1);

insert into public.pricing_plans (slug, name, price_label, per_label, features, highlighted, sort_order, published)
values
  ('basic', '{"en":"Basic","sq":"Basic"}',
   '€290',
   '{"en":"one-time · ~2 weeks","sq":"pagesë e vetme · ~2 javë"}',
   '[
     {"en":"One-page website","sq":"Faqe interneti një-faqëshe"},
     {"en":"Mobile-first and fast loading","sq":"Së pari për celular dhe e shpejtë"},
     {"en":"Contact form, map and socials","sq":"Formular kontakti, hartë dhe rrjete sociale"},
     {"en":"1 language","sq":"1 gjuhë"}
   ]'::jsonb,
   false, 0, true),
  ('pro', '{"en":"Pro","sq":"Pro"}',
   '€690',
   '{"en":"one-time · ~4 weeks","sq":"pagesë e vetme · ~4 javë"}',
   '[
     {"en":"Multi-page site","sq":"Faqe me shumë seksione"},
     {"en":"Two languages (ALB / ENG)","sq":"Dy gjuhë (SHQ / ENG)"},
     {"en":"Booking or product catalogue","sq":"Rezervime ose katalog produktesh"},
     {"en":"Basic SEO and Google setup","sq":"SEO bazë dhe konfigurim Google"},
     {"en":"1 year hosting included","sq":"1 vit hostim i përfshirë"}
   ]'::jsonb,
   true, 1, true),
  ('premium', '{"en":"Premium","sq":"Premium"}',
   'From €1,490',
   '{"en":"scope and timeline tailored","sq":"përmbajtje dhe afate sipas nevojës"}',
   '[
     {"en":"Online shop or custom web app","sq":"Dyqan online ose aplikacion i personalizuar"},
     {"en":"Payments, accounts and dashboards","sq":"Pagesa, llogari dhe panele"},
     {"en":"Unlimited languages","sq":"Gjuhë pa kufi"},
     {"en":"Priority support and maintenance","sq":"Suport me përparësi dhe mirëmbajtje"}
   ]'::jsonb,
   false, 2, true)
on conflict (slug) do update
set name = excluded.name,
    price_label = excluded.price_label,
    per_label = excluded.per_label,
    features = excluded.features,
    highlighted = excluded.highlighted,
    sort_order = excluded.sort_order,
    published = excluded.published,
    updated_at = now();

insert into public.site_sections (slug, enabled, sort_order, content)
values
  ('work', true, 0, '{
    "title": {"en": "One team from sketch to launch.", "sq": "Një ekip nga skica deri te nisja."},
    "body": {"en": "Every project moves through design, build, testing on real devices and a launch we handle together. You see progress every week, not a surprise at the end.", "sq": "Çdo projekt kalon nëpër dizajn, ndërtim, testim në pajisje reale dhe një nisje që e bëjmë bashkë. E sheh progresin çdo javë, jo një surprizë në fund."},
    "features": [
      {"en": "Design, code, hosting and maintenance in one place.", "sq": "Dizajn, kod, hostim dhe mirëmbajtje në një vend."},
      {"en": "Albanian and English by default. More languages when you need them.", "sq": "Shqip dhe anglisht si standard. Më shumë gjuhë kur të nevojiten."},
      {"en": "Weekly check-ins so you always know where things stand.", "sq": "Takime javore që të dish gjithmonë ku ndodhemi."}
    ]
  }'::jsonb),
  ('suit', true, 1, '{
    "title": {"en": "Tailored to your business, not a template.", "sq": "E përshtatur për biznesin tënd, jo një shabllon."},
    "body": {"en": "We take your colours, voice and goals, then build something that fits how you actually work. No two sites leave our studio looking the same.", "sq": "Marrim ngjyrat, zërin dhe qëllimet e tua, pastaj ndërtojmë diçka që i përshtatet mënyrës si punon realisht. Asnjë faqe nuk del nga studioja jonë e njëjtë."},
    "imageUrl": "https://images.unsplash.com/photo-1558171813-4c088754af8f?auto=format&fit=crop&w=900&h=900&q=80",
    "cta": {"en": "Book a free call", "sq": "Rezervo një telefonatë falas"}
  }'::jsonb),
  ('review', true, 2, '{
    "title": {"en": "Leave a review", "sq": "Lër një vlerësim"},
    "subtitle": {"en": "Worked with us? Share a few words — your review joins the clients above.", "sq": "Ke punuar me ne? Ndaj disa fjalë — vlerësimi yt bashkohet me klientët më lart."}
  }'::jsonb)
on conflict (slug) do update
set enabled = excluded.enabled,
    sort_order = excluded.sort_order,
    content = excluded.content,
    updated_at = now();
