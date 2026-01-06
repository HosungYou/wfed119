import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/auth/consent
 * Check if user has agreed to terms
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check consent status
    const { data: consent } = await supabase
      .from('user_consent_agreements')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const { data: userData } = await supabase
      .from('users')
      .select('consent_agreed, consent_agreed_at')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      hasConsent: !!consent?.privacy_policy_agreed,
      consent: consent || null,
      quickCheck: {
        agreed: userData?.consent_agreed || false,
        agreedAt: userData?.consent_agreed_at,
      },
    });
  } catch (error) {
    console.error('[API] GET /api/auth/consent error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/auth/consent
 * Record user consent agreement
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      privacyPolicyAgreed,
      researchConsentAgreed,
      consentDataCollection = true,
      consentAiAnalysis = true,
      consentResearchUse = false,
      consentAnonymizedSharing = false,
    } = body;

    // Validate required consent
    if (!privacyPolicyAgreed) {
      return NextResponse.json({
        error: '개인정보 처리방침에 동의해야 합니다. / You must agree to the Privacy Policy.',
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Get request metadata
    const userAgent = req.headers.get('user-agent') || '';
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || null;

    // Upsert consent record
    const { data: consent, error: consentError } = await supabase
      .from('user_consent_agreements')
      .upsert({
        user_id: user.id,
        privacy_policy_agreed: privacyPolicyAgreed,
        privacy_policy_version: '1.0',
        privacy_agreed_at: now,
        research_consent_agreed: researchConsentAgreed || false,
        research_consent_version: '1.0',
        research_agreed_at: researchConsentAgreed ? now : null,
        consent_data_collection: consentDataCollection,
        consent_ai_analysis: consentAiAnalysis,
        consent_research_use: consentResearchUse,
        consent_anonymized_sharing: consentAnonymizedSharing,
        ip_address: ipAddress,
        user_agent: userAgent,
        updated_at: now,
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (consentError) {
      console.error('[API] Consent upsert error:', consentError);
      return NextResponse.json({ error: 'Failed to save consent' }, { status: 500 });
    }

    // Update users table for quick check
    const { error: userError } = await supabase
      .from('users')
      .update({
        consent_agreed: true,
        consent_agreed_at: now,
        updated_at: now,
      })
      .eq('id', user.id);

    if (userError) {
      console.error('[API] User consent update error:', userError);
    }

    // Ensure user exists in public.users (for new OAuth signups)
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existingUser) {
      // Create user record
      await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
          role: 'USER',
          is_active: true,
          consent_agreed: true,
          consent_agreed_at: now,
          created_at: now,
          updated_at: now,
        });
    }

    return NextResponse.json({
      success: true,
      consent,
      message: '동의가 저장되었습니다. / Consent has been saved.',
    });
  } catch (error) {
    console.error('[API] POST /api/auth/consent error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
