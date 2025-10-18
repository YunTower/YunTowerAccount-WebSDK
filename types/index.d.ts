type ScopeType =
  | 'user:profile'
  | 'user:email'
  | 'connect:codemao_uid'
  | 'connect:pgaot_uid'
  | 'connect:dao3_uid'
type AuthStatus = 'success' | 'failed' | 'error' | 'noLogin' | 'denied'
type AuthEvent = 'auth' | 'closed'

interface CallbackResponse {
  event: AuthEvent
  status: AuthStatus
  data?: Record<string, unknown>
  msg?: string
}

interface SDKConfig {
  authUrl: string
  allowedOrigins: string[]
  appid: string
  scope: ScopeType[]
}

interface ConstructorParams {
  appid: string
  scope?: ScopeType[]
}