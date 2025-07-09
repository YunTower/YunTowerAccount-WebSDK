class YunTowerAccountSDK {
    auth_status: boolean;
    config: {
        auth: string,
        origin_white_list: string[];
        type: 'window' | 'redirect' | 'iframe';
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
        type: 'window' | 'redirect' | 'iframe';
        appid: string;
        scope: string | 'user_profile';
        redirect_url?: null | string;
        state?: null | string;
    }) {
        if (!appid || !scope) {
            console.error('[YunTowerAccountSDK] 参数缺失');
        }

        if (!['window', 'redirect', 'iframe'].includes(type)) {
            console.error('[YunTowerAccountSDK] [type]参数错误');
        }

        if (!['user_profile'].includes(scope)) {
            console.error('[YunTowerAccountSDK] [scope]参数错误，目前只支持[user_profile]');
        }

        this.auth_status = false;
        this.config = {
            auth: 'https://account.yuntower.com',
            origin_white_list: ['account.yuntower.cn', 'account.yuntower.com'],
            type,
            appid,
            scope,
            redirect_url,
            state
        };
    }

    /**
     * 加载授权窗口
     *
     * @param {string} id 目标元素的ID
     * @param {string} style 样式
     * @param callback
     */
    loadAuthWindow(id: string, style: string = '', callback: (arg0: {
        event: string;
        status: 'success' | 'failed' | 'error' | 'noLogin' | 'denied';
        data?: any;
        msg?: string;
    }) => void) {
        const auth_path = `${this.config.auth}/auth/app?type=${this.config.type}&appid=${this.config.appid}&redirect_url=${this.config.redirect_url}&scope=${this.config.scope}&state=${this.config.state}`;
        const iframe = document.getElementById(id);
        if (!iframe) {
            console.error('[YunTowerAccountSDK] 未找到id元素');
            return;
        }

        if (this.config.type !== 'iframe') {
            console.error('[YunTowerAccountSDK] type 参数错误，仅支持[iframe]类型');
            return;
        }

        if (style === '') {
            style = "height: 366px; width: 400px; border: unset; border-radius: 5px"
        }


        iframe.setAttribute('src', auth_path);
        iframe.setAttribute('style', style);

        // 监听来自子页面的消息
        const messageListener = (event: MessageEvent) => {
            const origin = event.origin.replace(/^https?:\/\//, '');

            if (!this.config.origin_white_list.includes(origin)) return;

            // 授权成功
            if (event.data?.action === 'status') {
                window.removeEventListener('message', messageListener);
                if (event.data?.status === 'success') {
                    this.auth_status = true;
                    callback({
                        event: 'auth',
                        status: event.data?.status,
                        data: event.data.data
                    });
                } else {
                    callback({
                        event: 'auth',
                        status: event.data?.status,
                        msg: event.data.msg
                    });
                }
            }
        };

        window.addEventListener('message', messageListener);
    }

    /**
     * 开启授权窗口
     * @param {*} callback
     */
    openAuthWindow(callback: (arg0: {
        event: string;
        status: 'success' | 'failed' | 'error' | 'noLogin' | 'denied';
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
        const messageListener = (event: MessageEvent) => {
            const origin = event.origin.replace(/^https?:\/\//, '');

            if (!this.config.origin_white_list.includes(origin)) return;

            // 授权成功
            if (event.data?.action === 'status') {
                window.removeEventListener('message', messageListener);
                if (event.data?.status === 'success') {
                    this.auth_status = true;
                    callback({
                        event: 'auth',
                        status: event.data?.status,
                        data: event.data.data
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
        };

        window.addEventListener('message', messageListener);


        if (child && !child.closed) {
            const timer = setInterval(() => {
                if (child.closed) {
                    clearInterval(timer);
                    callback({
                        event: 'closed',
                        status: 'success'
                    });
                }
                child.postMessage({action: 'status'}, '*');
            }, 3000);
        }
    }
}

export default YunTowerAccountSDK;