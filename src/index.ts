/**
 * 云塔账号通行证 WEB SDK
 * @author YunTower
 * @see https://github.com/YunTower/YunTowerAccount-WebSDK
 */
class YunTowerAccountSDK {
  private authStatus: boolean
  private readonly config: SDKConfig
  private static readonly ALLOWED_SCOPES: ScopeType[] = [
    'user:profile',
    'user:email',
    'connect:codemao_uid',
    'connect:pgaot_uid',
    'connect:dao3_uid',
  ]
  private static readonly DEFAULT_AUTH_URL = 'http://localhost:5173'
  private static readonly ALLOWED_ORIGINS = [
    'account.yuntower.cn',
    'account.yuntower.com',
    'localhost:5173',
  ]

  constructor({ appid, scope = ['user:profile'] }: ConstructorParams) {
    this.validateParams({ appid, scope })

    this.authStatus = false
    this.config = {
      authUrl: YunTowerAccountSDK.DEFAULT_AUTH_URL,
      allowedOrigins: [...YunTowerAccountSDK.ALLOWED_ORIGINS],
      appid,
      scope,
    }
  }

  /**
   * 验证构造函数参数
   */
  private validateParams({
    appid,
    scope,
  }: {
    appid: string
    scope: ScopeType[]
  }) {
    if (!appid || !scope?.length) {
      throw new Error('[YunTowerAccountSDK] 参数缺失: appid 和 scope 为必填项')
    }

    for (const item of scope) {
      if (!YunTowerAccountSDK.ALLOWED_SCOPES.includes(item)) {
        throw new Error(
          `[YunTowerAccountSDK] scope参数错误，目前只支持: ${YunTowerAccountSDK.ALLOWED_SCOPES.join(', ')}`,
        )
      }
    }
  }

  /**
   * 生成授权URL
   */
  private buildAuthUrl(type: string, redirectUrl?: string, state?: string): string {
    const params = new URLSearchParams({
      type,
      appid: this.config.appid,
      scope: this.config.scope.join(','),
    })

    if (redirectUrl) {
      params.append('redirect_url', redirectUrl)
    }

    if (state) {
      params.append('state', state)
    }

    return `${this.config.authUrl}/auth/app?${params.toString()}`
  }

  /**
   * 验证消息来源
   */
  private isValidOrigin(origin: string): boolean {
    const normalizedOrigin = origin.replace(/^https?:\/\//, '')
    return this.config.allowedOrigins.includes(normalizedOrigin)
  }

  /**
   * 处理授权消息
   */
  private handleAuthMessage(
    event: MessageEvent,
    callback: (response: CallbackResponse) => void,
  ): boolean {
    if (!this.isValidOrigin(event.origin)) {
      return false
    }

    if (event.data?.action === 'status') {
      const { status, data, msg } = event.data

      if (status === 'success') {
        this.authStatus = true
      }

      callback({
        event: 'auth',
        status,
        data,
        msg,
      })
      return true
    }

    return false
  }

  /**
   * 设置消息监听器
   */
  private setupMessageListener(callback: (response: CallbackResponse) => void): () => void {
    const messageListener = (event: MessageEvent) => {
      if (this.handleAuthMessage(event, callback)) {
        cleanup()
      }
    }

    const cleanup = () => {
      window.removeEventListener('message', messageListener)
    }

    window.addEventListener('message', messageListener)
    return cleanup
  }

  /**
   * 弹窗授权模式
   * @param callback 授权回调函数
   */
  window(callback: (response: CallbackResponse) => void = () => {}): void {
    const authUrl = this.buildAuthUrl('window')
    const authWindow = window.open(authUrl, '_blank', 'width=500,height=600')

    if (!authWindow) {
      throw new Error('[YunTowerAccountSDK] 无法打开授权窗口，可能被浏览器拦截')
    }

    const cleanup = this.setupMessageListener(callback)

    // 监听窗口关闭状态
    const checkInterval = setInterval(() => {
      if (authWindow.closed) {
        clearInterval(checkInterval)
        cleanup()
        callback({
          event: 'closed',
          status: 'success',
        })
      } else {
        // 发送状态检查消息
        try {
          authWindow.postMessage({ action: 'status' }, '*')
        } catch {
          // 窗口可能已经关闭，忽略错误
        }
      }
    }, 3000)
  }

  /**
   * 重定向授权模式
   * @param redirectUrl 授权完成后的重定向URL
   * @param state 状态参数，用于验证安全性
   */
  redirect(redirectUrl: string, state: string): void {
    if (!redirectUrl) {
      throw new Error('[YunTowerAccountSDK] redirect模式需要提供redirectUrl参数')
    }
    if (!state) {
      throw new Error('[YunTowerAccountSDK] redirect模式需要提供state参数')
    }

    const authUrl = this.buildAuthUrl('redirect', redirectUrl, state)
    window.location.href = authUrl
  }

  /**
   * iframe嵌入授权模式
   * @param elementId 目标元素的ID
   * @param callback 授权回调函数
   */
  iframe(
    elementId: string,
    callback: (response: CallbackResponse) => void,
  ): void {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error('[YunTowerAccountSDK] 未找到目标元素')
    }

    // 如果元素不是iframe，创建一个iframe
    let iframe: HTMLIFrameElement
    if (element.tagName.toLowerCase() === 'iframe') {
      iframe = element as HTMLIFrameElement
    } else {
      iframe = document.createElement('iframe')
      element.appendChild(iframe)
    }

    iframe.src = this.buildAuthUrl('iframe')

    this.setupMessageListener(callback)
  }

  /**
   * 获取当前授权状态
   */
  getAuthStatus(): boolean {
    return this.authStatus
  }

  /**
   * 重置授权状态
   */
  resetAuthStatus(): void {
    this.authStatus = false
  }

  /**
   * 获取当前配置
   */
  getConfig(): Readonly<SDKConfig> {
    return Object.freeze({ ...this.config })
  }
}

export default YunTowerAccountSDK
