alter table public.showcase_projects
  alter column tag type jsonb
  using (
    case
      when tag is null then null
      when tag ~ '^\s*\{' then tag::jsonb
      else jsonb_build_object('en', tag, 'sq', tag)
    end
  );

update public.showcase_projects
set title = jsonb_build_object('en', title #>> '{}', 'sq', title #>> '{}')
where jsonb_typeof(title) = 'string';
