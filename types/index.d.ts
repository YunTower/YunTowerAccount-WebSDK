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

/** window 模式可选配置 */
interface WindowOptions {
  /** 授权成功或失败时是否自动关闭授权窗口，默认 true */
  autoCloseOnFinish?: boolean
}

/** window 模式返回值，由接入方控制关闭 */
interface WindowController {
  /** 关闭授权窗口 */
  close(): void
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