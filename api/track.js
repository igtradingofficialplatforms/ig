
import { createClient } from '@supabase/supabase-js';
console.log(
  'Track API environment:',
  Boolean(process.env.SUPABASE_URL),
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    const allowedEvents = ['login', 'page_view', 'logout'];
    const { eventType, pagePath } = req.body || {};

    if (!allowedEvents.includes(eventType)) {
      return res.status(400).json({ error: 'Invalid event type' });
    }

    const country = req.headers['x-vercel-ip-country'] || null;
    const userAgent = req.headers['user-agent'] || '';

    let device = 'Desktop';

    if (/tablet|ipad/i.test(userAgent)) {
      device = 'Tablet';
    } else if (/mobile|android|iphone/i.test(userAgent)) {
      device = 'Mobile';
    }

    let browser = 'Other';

    if (/edg/i.test(userAgent)) browser = 'Edge';
    else if (/chrome/i.test(userAgent)) browser = 'Chrome';
    else if (/firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/safari/i.test(userAgent)) browser = 'Safari';

    const { error: insertError } = await supabase
      .from('user_activity_logs')
      .insert({
        user_id: userData.user.id,
        event_type: eventType,
        page_path: typeof pagePath === 'string'
          ? pagePath.slice(0, 150)
          : null,
        country_code: country,
device_type: device,
browser
      });

    if (insertError) {
      console.error('Activity insert failed:', insertError.message);
      return res.status(500).json({ error: 'Could not save activity' });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Activity API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
