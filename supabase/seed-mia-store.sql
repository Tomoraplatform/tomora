-- =============================================================
-- MIA, a real storefront on Tomora.
--
-- Replaces the in-memory fixture the promo videos were recorded against with
-- an actual site row and ten actual products, owned by the Tomora admin
-- account and served at mia.tomora.com.ng.
--
-- Photographs are shipped with the app under public/mia/, so this inserts no
-- binary and depends on nothing but a deploy that includes them.
--
-- No payout account is attached, deliberately. MIA is a showcase store: its
-- checkout is real, and until a bank account is connected in the dashboard any
-- payment settles into Tomora's own Paystack balance rather than a MIA one.
--
-- Safe to run twice. The site is keyed on its subdomain and the products on
-- their name, so a second run updates rather than duplicates.
-- =============================================================

do $$
declare
  v_user uuid;
  v_site uuid;
begin
  select user_id into v_user from public.profiles
   where lower(email) = 'tomoraplatform@gmail.com' limit 1;
  if v_user is null then
    raise exception 'No profile for tomoraplatform@gmail.com. Check the address, or sign in once to create the profile.';
  end if;

  select id into v_site from public.sites where subdomain = 'mia';

  if v_site is null then
    insert into public.sites (user_id, template_id, category, subdomain, is_live, trial_ends_at, site_data)
    values (v_user, 'shop-01', 'ecommerce', 'mia', true, null, '{"businessName":"MIA","tagline":"Botanical skincare, made for real skin","logoUrl":"/mia/logo.jpg","brandColor":"#4E6247","blocks":[],"heroHeadline":"Skincare that loves you back","heroSubtext":"Clean, botanical formulas made for real skin. Gentle enough for every day, strong enough to see the difference.","heroImage":"/mia/hero.jpg","ctaText":"Shop the range","ctaHref":"","contactForm":false,"social":{"instagram":"","twitter":"","facebook":"","website":""},"testimonials":[{"id":"1","name":"Amaka O.","role":"Lagos","quote":"Six weeks in and my skin has never looked calmer. The night balm is the one thing I will not run out of."},{"id":"2","name":"Tolu A.","role":"Abuja","quote":"I have sensitive skin and most things sting. This range does not. The cleanser is so gentle I use it twice a day."},{"id":"3","name":"Zainab M.","role":"Port Harcourt","quote":"Delivered in two days and beautifully packaged. The face oil is worth every naira, a little goes a long way."}],"services":[],"navLinks":[{"id":"nav-0","label":"Categories","target":"#categories"},{"id":"nav-1","label":"Shop","target":"#allproducts"},{"id":"nav-2","label":"Deals","target":"#offer"}],"products":[{"id":"shop-01-p0","name":"Classic Backpack","price":18000,"comparePrice":22000,"image":"https://picsum.photos/seed/shop-01-prod-0/800/800","rating":4.8,"reviews":24,"category":"Electronics","bestSeller":true,"offer":true,"newArrival":false,"offerPercent":30},{"id":"shop-01-p1","name":"Wireless Headphones","price":32000,"image":"https://picsum.photos/seed/shop-01-prod-1/800/800","rating":4.5,"reviews":37,"category":"Fashion","bestSeller":true,"offer":false,"newArrival":true,"offerPercent":0},{"id":"shop-01-p2","name":"Ceramic Mug","price":6500,"comparePrice":8000,"image":"https://picsum.photos/seed/shop-01-prod-2/800/800","rating":4.8,"reviews":50,"category":"Home & Kitchen","bestSeller":true,"offer":false,"newArrival":false,"offerPercent":0},{"id":"shop-01-p3","name":"Linen Shirt","price":14000,"image":"https://picsum.photos/seed/shop-01-prod-3/800/800","rating":4.5,"reviews":63,"category":"Beauty","bestSeller":false,"offer":false,"newArrival":false,"offerPercent":0},{"id":"shop-01-p4","name":"Desk Lamp","price":9500,"comparePrice":12000,"image":"https://picsum.photos/seed/shop-01-prod-4/800/800","rating":4.8,"reviews":76,"category":"Sports","bestSeller":false,"offer":false,"newArrival":false,"offerPercent":0},{"id":"shop-01-p5","name":"Sneakers","price":27000,"image":"https://picsum.photos/seed/shop-01-prod-5/800/800","rating":4.5,"reviews":89,"category":"Accessories","bestSeller":false,"offer":false,"newArrival":false,"offerPercent":0}],"trustBadges":[{"id":"1","title":"Free delivery","subtitle":"On orders over ₦25,000"},{"id":"2","title":"Secure payment","subtitle":"Paystack protected"},{"id":"3","title":"Easy returns","subtitle":"14 day return policy"},{"id":"4","title":"Here to help","subtitle":"Mon to Sat, 9am to 6pm"}],"heroAvatars":[{"id":"shop-01-face0","name":"","image":"https://picsum.photos/seed/face0/64"},{"id":"shop-01-face1","name":"","image":"https://picsum.photos/seed/face1/64"},{"id":"shop-01-face2","name":"","image":"https://picsum.photos/seed/face2/64"},{"id":"shop-01-face3","name":"","image":"https://picsum.photos/seed/face3/64"}],"sectionText":{"heroBadge":"NEW SEASON","heroTrust":"Loved by 10,000+ customers","sale":"A few of our favourites, at a gentler price. While stocks last."},"sectionTitles":{"categories":"Shop by category","allproducts":"The full range","bestsellers":"Loved by everyone","sale":"Up to 17% off","testimonials":"What our customers say"}}'::jsonb)
    returning id into v_site;
    raise notice 'Created site %', v_site;
  else
    update public.sites
       set user_id = v_user, template_id = 'shop-01', category = 'ecommerce',
           is_live = true, trial_ends_at = null, site_data = '{"businessName":"MIA","tagline":"Botanical skincare, made for real skin","logoUrl":"/mia/logo.jpg","brandColor":"#4E6247","blocks":[],"heroHeadline":"Skincare that loves you back","heroSubtext":"Clean, botanical formulas made for real skin. Gentle enough for every day, strong enough to see the difference.","heroImage":"/mia/hero.jpg","ctaText":"Shop the range","ctaHref":"","contactForm":false,"social":{"instagram":"","twitter":"","facebook":"","website":""},"testimonials":[{"id":"1","name":"Amaka O.","role":"Lagos","quote":"Six weeks in and my skin has never looked calmer. The night balm is the one thing I will not run out of."},{"id":"2","name":"Tolu A.","role":"Abuja","quote":"I have sensitive skin and most things sting. This range does not. The cleanser is so gentle I use it twice a day."},{"id":"3","name":"Zainab M.","role":"Port Harcourt","quote":"Delivered in two days and beautifully packaged. The face oil is worth every naira, a little goes a long way."}],"services":[],"navLinks":[{"id":"nav-0","label":"Categories","target":"#categories"},{"id":"nav-1","label":"Shop","target":"#allproducts"},{"id":"nav-2","label":"Deals","target":"#offer"}],"products":[{"id":"shop-01-p0","name":"Classic Backpack","price":18000,"comparePrice":22000,"image":"https://picsum.photos/seed/shop-01-prod-0/800/800","rating":4.8,"reviews":24,"category":"Electronics","bestSeller":true,"offer":true,"newArrival":false,"offerPercent":30},{"id":"shop-01-p1","name":"Wireless Headphones","price":32000,"image":"https://picsum.photos/seed/shop-01-prod-1/800/800","rating":4.5,"reviews":37,"category":"Fashion","bestSeller":true,"offer":false,"newArrival":true,"offerPercent":0},{"id":"shop-01-p2","name":"Ceramic Mug","price":6500,"comparePrice":8000,"image":"https://picsum.photos/seed/shop-01-prod-2/800/800","rating":4.8,"reviews":50,"category":"Home & Kitchen","bestSeller":true,"offer":false,"newArrival":false,"offerPercent":0},{"id":"shop-01-p3","name":"Linen Shirt","price":14000,"image":"https://picsum.photos/seed/shop-01-prod-3/800/800","rating":4.5,"reviews":63,"category":"Beauty","bestSeller":false,"offer":false,"newArrival":false,"offerPercent":0},{"id":"shop-01-p4","name":"Desk Lamp","price":9500,"comparePrice":12000,"image":"https://picsum.photos/seed/shop-01-prod-4/800/800","rating":4.8,"reviews":76,"category":"Sports","bestSeller":false,"offer":false,"newArrival":false,"offerPercent":0},{"id":"shop-01-p5","name":"Sneakers","price":27000,"image":"https://picsum.photos/seed/shop-01-prod-5/800/800","rating":4.5,"reviews":89,"category":"Accessories","bestSeller":false,"offer":false,"newArrival":false,"offerPercent":0}],"trustBadges":[{"id":"1","title":"Free delivery","subtitle":"On orders over ₦25,000"},{"id":"2","title":"Secure payment","subtitle":"Paystack protected"},{"id":"3","title":"Easy returns","subtitle":"14 day return policy"},{"id":"4","title":"Here to help","subtitle":"Mon to Sat, 9am to 6pm"}],"heroAvatars":[{"id":"shop-01-face0","name":"","image":"https://picsum.photos/seed/face0/64"},{"id":"shop-01-face1","name":"","image":"https://picsum.photos/seed/face1/64"},{"id":"shop-01-face2","name":"","image":"https://picsum.photos/seed/face2/64"},{"id":"shop-01-face3","name":"","image":"https://picsum.photos/seed/face3/64"}],"sectionText":{"heroBadge":"NEW SEASON","heroTrust":"Loved by 10,000+ customers","sale":"A few of our favourites, at a gentler price. While stocks last."},"sectionTitles":{"categories":"Shop by category","allproducts":"The full range","bestsellers":"Loved by everyone","sale":"Up to 17% off","testimonials":"What our customers say"}}'::jsonb
     where id = v_site;
    raise notice 'Updated existing site %', v_site;
  end if;

  -- Ten products. Ordered oldest first so "new arrivals" reads sensibly.
  insert into public.products (
    user_id, site_id, name, description, price, compare_price, category, images,
    stock, is_active, is_best_seller, is_new_arrival, is_offer, offer_percent, created_at
  )
  select v_user, v_site, t.name, t.description, t.price, t.compare_price, t.category, t.images,
         25, true, t.best, t.fresh, t.offer, t.offer_percent,
         now() - ((9 - t.ord) * interval '1 day')
    from (values
  (
    'Renewal Day Crème', 'A weightless day cream that drinks straight in. Squalane and cactus water hold moisture in the skin all day, leaving it soft, calm and quietly luminous.', 32000, null,
    'Moisturisers', '["/mia/p1.jpg"]'::jsonb,
    true, false,
    false, 0, 0
  ),
  (
    'Radiance Face Oil', 'Nine cold-pressed botanicals in a golden, fast-absorbing oil. Two drops at night and skin wakes up looking rested, plump and evenly toned.', 27500, null,
    'Serums & Oils', '["/mia/p2.jpg"]'::jsonb,
    true, true,
    false, 0, 1
  ),
  (
    'Eye Firming Essence', 'A featherlight essence for the delicate skin around the eyes. Peptides and caffeine soften fine lines and take the tiredness out of early mornings.', 24000, null,
    'Serums & Oils', '["/mia/p3.jpg"]'::jsonb,
    false, true,
    false, 0, 2
  ),
  (
    'Night Recovery Balm', 'A rich overnight balm that melts on contact. Ceramides rebuild the skin barrier while you sleep, so mornings start smooth, supple and comfortable.', 35000, 42000,
    'Moisturisers', '["/mia/p4.jpg"]'::jsonb,
    true, false,
    true, 17, 3
  ),
  (
    'Hair Ritual Trio', 'Shampoo, mask and leave-in treatment, made to work together. Rice protein and argan oil bring back shine and strength, strand by strand.', 37000, null,
    'Body & Hair', '["/mia/p5.jpg"]'::jsonb,
    true, false,
    false, 0, 4
  ),
  (
    'Cleanse & Care Duo', 'A gentle cleansing pair for hair and scalp. Free of sulphates and heavy silicones, so colour stays true and roots stay light for longer.', 29000, null,
    'Body & Hair', '["/mia/p6.jpg"]'::jsonb,
    false, false,
    false, 0, 5
  ),
  (
    'Green Rice Mochi Cleanser', 'A soft, whipped cleanser with fermented rice and green tea. Lifts sunscreen and city grime without that tight, stripped feeling afterwards.', 18000, null,
    'Cleansers', '["/mia/p7.jpg"]'::jsonb,
    false, true,
    false, 0, 6
  ),
  (
    'Hydrating Cream', 'Everyday hydration for every skin type. Light enough for humid afternoons, cushioned enough for air-conditioned rooms and long flights.', 21500, 26000,
    'Moisturisers', '["/mia/p8.jpg"]'::jsonb,
    false, false,
    true, 17, 7
  ),
  (
    'Botanical Body Collection', 'Cleanser, scrub and body cream in a matching set. Warm vetiver and cedar, with shea butter that stays soft on the skin, never greasy.', 33000, null,
    'Body & Hair', '["/mia/p9.jpg"]'::jsonb,
    false, false,
    false, 0, 8
  ),
  (
    'Clarifying Toner Set', 'A three-step toning set with kojic acid and hyaluronic acid. Refines texture, evens out tone, and preps skin so everything after it works harder.', 19500, null,
    'Cleansers', '["/mia/p10.jpg"]'::jsonb,
    false, true,
    false, 0, 9
  )
    ) as t(name, description, price, compare_price, category, images, best, fresh, offer, offer_percent, ord)
   where not exists (
     select 1 from public.products p where p.site_id = v_site and p.name = t.name
   );

  raise notice 'MIA now has % products', (select count(*) from public.products where site_id = v_site);
end $$;

-- What you should see: one row, is_live true, 10 products.
select s.subdomain, s.is_live, s.template_id,
       (select count(*) from public.products p where p.site_id = s.id) as products
  from public.sites s where s.subdomain = 'mia';
