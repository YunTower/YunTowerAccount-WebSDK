type ScopeType =
  | 'user:profile'
  | 'user:email'
  | 'connect:codemao_uid'
  | 'connect:pgaot_uid'
  | 'connect:dao3_uid'
type AuthType = 'window' | 'redirect' | 'iframe'
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
  type: AuthType
  appid: string
  scope: ScopeType[]
  redirectUrl?: string
  state?: string
}

interface ConstructorParams {
  type: AuthType
  appid: string
  scope?: ScopeType[]
  redirectUrl?: string
  state?: string
}
