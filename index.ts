class YunTowerAccountSDK {
  auth_status: boolean;
  config: {
    auth: string,
    origin_white_list: string[];
    type: 'window' | 'redirect';
    appid: string;
    scope: string | '';
    redirect_url: string;
    state: null | string;
  };
  constructor({
    type,
    appid,
    redirect_url,
    state = null,
    scope = 'user_profile',
  }: {
    type: 'window' | 'redirect';
    appid: string;
    scope: string | 'user_profile';
    redirect_url: string;
    state?: null | string;
  }) {
    if (!appid || !scope) {
      console.error('[YunTowerAccountSDK] 参数缺失');
    }

    if (!['window','redirect'].includes(type)) {
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
      state,
    };
  }

  /**
   * 开启授权窗口
   * @param {*} callback
   */
  openAuthWindow(callback: (arg0: { event: string; status: 'success' | 'failed' | 'noLogin'; data?: any; msg?: string; }) => void) {
    let child = window.open(
      `${this.config.auth}/auth/app?type=${this.config.type}&appid=${this.config.appid}&redirect_url=${this.config.redirect_url}&scope=${this.config.scope}&state=${this.config.state}`,
      "_blank",
      "width=500,height=600"
    );

    // 监听来自子页面的消息
    window.addEventListener("message", (event) => {
      const origin = event.origin.replace(/^https?:\/\//, "");

      if (!this.config.origin_white_list.includes(origin)) return;

      // 授权成功
      if (event.data?.action === "status") {
        if (event.data?.status === "success") {
          this.auth_status = true;
          callback({
            event: "auth",
            status: event.data?.status,
            data: JSON.parse(event.data.data),
          });
        } else {
          callback({
            event: "auth",
            status: event.data?.status,
            msg: event.data.msg,
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
            event: "closed",
            status: 'success',
          });
        }
        child.postMessage({ action: "status" }, "*");
      }, 3000);
    }
  }
}

export default YunTowerAccountSDK;