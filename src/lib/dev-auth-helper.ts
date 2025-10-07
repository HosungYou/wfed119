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

export function checkDevAuth(session: any): AuthResult {
  const isDevelopmentMode = process.env.DEV_MODE_SKIP_AUTH === 'true';

  if (isDevelopmentMode && !session) {
    return {
      userId: 'dev-test-user-id',
      isAuthenticated: true,
      isDevelopmentMode: true
    };
  }

  return {
    userId: session?.user?.id || '',
    isAuthenticated: !!session,
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
