class YunTowerAccountSDK {
  auth_status: boolean;
  config: {
    auth: string,
    origin_white_list: string[];
    type: 'window' | 'redirect';
    appid: string;
    scope: string | '';
    redirect_url: null | string;
    state: null | string;
  };

  constructor({
    type,
    appid,
    redirect_url = null,
    state = null,
    scope = 'user_profile'
  }: {
    type: 'window' | 'redirect';
    appid: string;
    scope: string | 'user_profile';
    redirect_url?: null | string;
    state?: null | string;
  }) {
    if (!appid || !scope) {
      console.error('[YunTowerAccountSDK] 参数缺失');
    }

    if (!['window', 'redirect'].includes(type)) {
      console.error('[YunTowerAccountSDK] [type]参数错误');
    }

    if (!['user_profile'].includes(scope)) {
      console.error('[YunTowerAccountSDK] [scope]参数错误，目前只支持[user_profile]');
    }

    this.auth_status = false;
    this.config = {
      auth: 'https://account.yuntower.cn',
      origin_white_list: ['account.yuntower.cn', 'localhost:3000'],
      type,
      appid,
      scope,
      redirect_url,
      state
    };
  }

  /**
   * 开启授权窗口
   * @param {*} callback
   */
  openAuthWindow(callback: (arg0: {
    event: string;
    status: 'success' | 'failed' | 'error' | 'noLogin';
    data?: any;
    msg?: string;
  }) => void) {
    const auth_path = `${this.config.auth}/auth/app?type=${this.config.type}&appid=${this.config.appid}&redirect_url=${this.config.redirect_url}&scope=${this.config.scope}&state=${this.config.state}`;

    if (this.config.type == 'redirect') {
      window.location.href = auth_path;
      return false;
    }

    let child = window.open(
      auth_path,
      '_blank',
      'width=500,height=600'
    );


    // 监听来自子页面的消息
    window.addEventListener('message', (event) => {
      if (this.config.type != 'window') callback({
        event: 'error',
        status: 'error',
        msg: '仅[type]为[window]时支持回调方法'
      });

      const origin = event.origin.replace(/^https?:\/\//, '');

      if (!this.config.origin_white_list.includes(origin)) return;

      // 授权成功
      if (event.data?.action === 'status') {
        if (event.data?.status === 'success') {
          this.auth_status = true;
          callback({
            event: 'auth',
            status: event.data?.status,
            data: JSON.parse(event.data.data)
          });
        } else {
          callback({
            event: 'auth',
            status: event.data?.status,
            msg: event.data.msg
          });
        }
        child?.close();
      }
    });


    if (child && !child.closed) {
      const timer = setInterval(() => {
        if (child.closed) {
          clearInterval(timer);
          callback({
            event: 'closed',
            status: 'success'
          });
        }
        child.postMessage({ action: 'status' }, '*');
      }, 3000);
    }
  }
}

export default YunTowerAccountSDK;