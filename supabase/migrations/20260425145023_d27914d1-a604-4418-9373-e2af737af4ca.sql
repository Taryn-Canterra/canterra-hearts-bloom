drop policy "Anyone can submit a saved search" on public.saved_searches;
drop policy "Anyone can submit an inquiry" on public.property_inquiries;

create policy "Anyone can submit a saved search"
  on public.saved_searches
  for insert
  to anon, authenticated
  with check (
    char_length(email) between 5 and 254
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    and char_length(source) <= 64
  );

create policy "Anyone can submit an inquiry"
  on public.property_inquiries
  for insert
  to anon, authenticated
  with check (
    char_length(name) between 1 and 120
    and char_length(email) between 5 and 254
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    and (phone is null or char_length(phone) <= 40)
    and (message is null or char_length(message) <= 4000)
  );
