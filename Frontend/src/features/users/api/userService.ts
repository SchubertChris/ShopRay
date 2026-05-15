import { supabase } from '@/lib/supabase';
import type { User, UserProfile, Address, UserRole } from '@/types/user';

/** Aktuelles Profil + Adresse aus Supabase laden */
export async function getProfile(): Promise<UserProfile> {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw authErr ?? new Error('Nicht eingeloggt');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('name, role, phone, address_street, address_zip, address_city, address_country')
    .eq('id', user.id)
    .single();
  if (error) throw error;

  const parts = (profile?.name ?? '').trim().split(/\s+/);

  return {
    id:         user.id,
    email:      user.email!,
    firstName:  parts[0] ?? '',
    lastName:   parts.slice(1).join(' '),
    role:       (profile?.role as UserRole) ?? 'customer',
    createdAt:  user.created_at,
    phone:      profile?.phone ?? null,
    avatarUrl:  null,
    orderCount: 0,
    totalSpent: 0,
    address: profile?.address_street ? {
      firstName: parts[0] ?? '',
      lastName:  parts.slice(1).join(' '),
      street:    profile.address_street,
      zip:       profile.address_zip ?? '',
      city:      profile.address_city ?? '',
      country:   profile.address_country ?? 'Deutschland',
    } : null,
  };
}

/** Name in profiles-Tabelle aktualisieren */
export async function updateUser(
  payload: Partial<Pick<User, 'firstName' | 'lastName'>>,
): Promise<User> {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw authErr ?? new Error('Nicht eingeloggt');

  const name = `${payload.firstName ?? ''} ${payload.lastName ?? ''}`.trim();

  const { error } = await supabase
    .from('profiles')
    .update({ name })
    .eq('id', user.id);
  if (error) throw error;

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single();

  const parts = (profile?.name ?? '').trim().split(/\s+/);

  return {
    id:        user.id,
    email:     user.email!,
    firstName: parts[0] ?? '',
    lastName:  parts.slice(1).join(' '),
    role:      (profile?.role as UserRole) ?? 'customer',
    createdAt: user.created_at,
  };
}

/** Lieferadresse in profiles-Tabelle aktualisieren */
export async function updateAddress(address: Address): Promise<Address> {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw authErr ?? new Error('Nicht eingeloggt');

  const { error } = await supabase
    .from('profiles')
    .update({
      address_street:  address.street,
      address_zip:     address.zip,
      address_city:    address.city,
      address_country: address.country,
    })
    .eq('id', user.id);
  if (error) throw error;

  return address;
}
