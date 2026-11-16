
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : '';

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: userData, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (profileError || profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data: logs, error: logsError } = await supabase
      .from('user_activity_logs')
     .select('id,user_id,event_type,page_path,country_code,device_type,browser,created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (logsError) {
      console.error('Activity query failed:', logsError.message);
      return res.status(500).json({ error: 'Could not load activity' });
    }

    return res.status(200).json({
  success: true,
  activities: (logs || []).map(item => ({
    ...item,
    country: item.country_code,
    device: item.device_type
  }))
});

  } catch (error) {
    console.error('Admin activity API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
