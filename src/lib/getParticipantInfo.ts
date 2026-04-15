import { supabase } from '@/integrations/supabase/client';

interface ParticipantInfo {
  participantId: string | null;
  groupType: string | null;
}

/**
 * Resolves participant_id and group_type from beta_whitelist (primary)
 * or profiles (fallback). Logs mapping for research auditability.
 */
export async function getParticipantInfo(userId: string): Promise<ParticipantInfo> {
  try {
    // Get user email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, participant_id, group_type')
      .eq('id', userId)
      .maybeSingle();

    const email = profile?.email?.toLowerCase() || '';

    // Primary source: beta_whitelist
    if (email) {
      const { data: whitelist } = await supabase
        .from('beta_whitelist')
        .select('participant_id, group_type')
        .ilike('email', email)
        .eq('is_active', true)
        .maybeSingle();

      if (whitelist?.participant_id) {
        console.log(`[PARTICIPANT_MAP] ${email} → ${whitelist.participant_id} → ${whitelist.group_type}`);
        return {
          participantId: whitelist.participant_id,
          groupType: whitelist.group_type,
        };
      }
    }

    // Fallback: profiles table
    if (profile?.participant_id) {
      console.log(`[PARTICIPANT_MAP] ${email} → ${profile.participant_id} → ${profile.group_type} (from profiles)`);
      return {
        participantId: profile.participant_id,
        groupType: profile.group_type,
      };
    }

    console.warn(`[PARTICIPANT_MAP] MISSING_PARTICIPANT_ID_MAPPING for user ${userId} (${email})`);
    return { participantId: null, groupType: null };
  } catch (err) {
    console.error('[PARTICIPANT_MAP] Error resolving participant info:', err);
    return { participantId: null, groupType: null };
  }
}
