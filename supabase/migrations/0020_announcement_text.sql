alter table store_settings
  add column announcement_text text not null default 'Free shipping on orders above ₹1,500';
