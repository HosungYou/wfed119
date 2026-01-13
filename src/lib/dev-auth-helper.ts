/**
 * Development Mode Authentication Helper
 *
 * 로컬 테스트를 위한 인증 우회 유틸리티
 */

export interface AuthResult {
  userId: string;
  isAuthenticated: boolean;
  isDevelopmentMode: boolean;
}

// Accept user object directly instead of session to avoid Supabase warnings
export function checkDevAuth(user: any): AuthResult {
  const isDevelopmentMode = process.env.DEV_MODE_SKIP_AUTH === 'true';

  if (isDevelopmentMode && !user) {
    return {
      userId: 'dev-test-user-id',
      isAuthenticated: true,
      isDevelopmentMode: true
    };
  }

  return {
    userId: user?.id || '',
    isAuthenticated: !!user,
    isDevelopmentMode: false
  };
}

export function requireAuth(authResult: AuthResult): boolean {
  // Development mode always passes
  if (authResult.isDevelopmentMode) {
    return true;
  }

  // Production requires actual authentication
  return authResult.isAuthenticated && !!authResult.userId;
}
