'use strict';

const { supabase } = require('./supabase');

async function resolveUserRole(userId) {
  const { data: admin, error: adminErr } = await supabase
    .from('admin_profiles')
    .select('display_name')
    .eq('user_id', userId)
    .maybeSingle();
  if (adminErr) throw adminErr;
  if (admin) {
    return {
      role: 'admin',
      displayName: admin.display_name || '',
    };
  }

  const { data: link, error: linkErr } = await supabase
    .from('client_profiles')
    .select('client_id, clients ( name, company )')
    .eq('user_id', userId)
    .maybeSingle();
  if (linkErr) throw linkErr;
  if (link) {
    const client = link.clients || {};
    return {
      role: 'client',
      clientId: link.client_id,
      displayName: client.name || client.company || '',
    };
  }

  return null;
}

module.exports = { resolveUserRole };
