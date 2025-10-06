/**
 * 云塔账号通行证 WEB SDK
 * @author YunTower
 * @version 0.0.9
 * @license MIT
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
  private static readonly ALLOWED_TYPES: AuthType[] = ['window', 'redirect', 'iframe']
  private static readonly DEFAULT_AUTH_URL = 'http://localhost:5173'
  private static readonly ALLOWED_ORIGINS = [
    'account.yuntower.cn',
    'account.yuntower.com',
    'localhost:5173',
  ]

  constructor({ type, appid, redirectUrl, state, scope = ['user:profile'] }: ConstructorParams) {
    this.validateParams({ type, appid, scope })

    this.authStatus = false
    this.config = {
      authUrl: YunTowerAccountSDK.DEFAULT_AUTH_URL,
      allowedOrigins: [...YunTowerAccountSDK.ALLOWED_ORIGINS],
      type,
      appid,
      scope,
      redirectUrl,
      state,
    }
  }

  /**
   * 验证构造函数参数
   */
  private validateParams({
    type,
    appid,
    scope,
  }: {
    type: AuthType
    appid: string
    scope: ScopeType[]
  }) {
    if (!type || !appid || !scope?.length) {
      throw new Error('[YunTowerAccountSDK] 参数缺失: type、appid 和 scope 为必填项')
    }

    if (!YunTowerAccountSDK.ALLOWED_TYPES.includes(type)) {
      throw new Error(
        `[YunTowerAccountSDK] type参数错误，支持的类型: ${YunTowerAccountSDK.ALLOWED_TYPES.join(', ')}`,
      )
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
  private buildAuthUrl(): string {
    const params = new URLSearchParams({
      type: this.config.type,
      appid: this.config.appid,
      scope: this.config.scope.join(','),
    })

    if (this.config.redirectUrl) {
      params.append('redirect_url', this.config.redirectUrl)
    }

    if (this.config.state) {
      params.append('state', this.config.state)
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
   * 加载授权窗口 (iframe模式)
   * @param elementId 目标元素的ID
   * @param style 自定义样式
   * @param callback 回调函数
   */
  loadAuthWindow(
    elementId: string,
    style: string = '',
    callback: (response: CallbackResponse) => void,
  ): void {
    if (this.config.type !== 'iframe') {
      throw new Error('[YunTowerAccountSDK] 此方法仅支持iframe类型')
    }

    const iframe = document.getElementById(elementId) as HTMLIFrameElement
    if (!iframe) {
      throw new Error('[YunTowerAccountSDK] 未找到目标元素')
    }

    const defaultStyle = 'height: 640px; width: 400px; border: unset; border-radius: 5px'
    iframe.src = this.buildAuthUrl()
    iframe.style.cssText = style || defaultStyle

    this.setupMessageListener(callback)
  }

  /**
   * 开启授权窗口
   * @param callback 回调函数
   */
  openAuthWindow(callback: (response: CallbackResponse) => void = () => {}): void {
    const authUrl = this.buildAuthUrl()

    if (this.config.type === 'redirect') {
      window.location.href = authUrl
      return
    }

    if (this.config.type === 'window') {
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

      return
    }

    throw new Error('[YunTowerAccountSDK] 不支持的授权类型')
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
