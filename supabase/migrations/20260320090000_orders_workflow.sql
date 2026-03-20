create or replace function public.place_marketplace_order(
  p_product_id uuid,
  p_quantity numeric,
  p_unit text default null,
  p_delivery_fee numeric default 50,
  p_notes text default null
)
returns setof public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer_id uuid := auth.uid();
  v_product public.products%rowtype;
  v_order public.orders%rowtype;
  v_unit text;
begin
  if v_buyer_id is null then
    raise exception 'You must be signed in to place an order';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be greater than 0';
  end if;

  if p_delivery_fee is null or p_delivery_fee < 0 then
    raise exception 'Delivery fee must be 0 or more';
  end if;

  select *
  into v_product
  from public.products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'Product not found';
  end if;

  if v_product.farmer_id = v_buyer_id then
    raise exception 'You cannot place an order for your own product';
  end if;

  if coalesce(v_product.is_available, false) = false then
    raise exception 'This product is not currently available';
  end if;

  if v_product.stock < p_quantity then
    raise exception 'Only % % available for this product', v_product.stock, v_product.unit;
  end if;

  v_unit := coalesce(nullif(trim(p_unit), ''), v_product.unit);

  insert into public.orders (
    product_id,
    buyer_id,
    farmer_id,
    quantity,
    unit,
    total_price,
    delivery_fee,
    status,
    payment_method,
    notes
  )
  values (
    v_product.id,
    v_buyer_id,
    v_product.farmer_id,
    p_quantity,
    v_unit,
    v_product.price_per_unit * p_quantity,
    p_delivery_fee,
    'pending',
    'mpesa',
    nullif(trim(coalesce(p_notes, '')), '')
  )
  returning *
  into v_order;

  update public.products
  set
    stock = stock - p_quantity,
    is_available = (stock - p_quantity) > 0,
    updated_at = now()
  where id = v_product.id;

  return next v_order;
end;
$$;

grant execute on function public.place_marketplace_order(uuid, numeric, text, numeric, text) to authenticated;
