declare class YunTowerAccountSDK {
    auth_status: boolean;
    config: {
        auth: string;
        origin_white_list: string[];
        type: 'window' | 'redirect' | 'iframe';
        appid: string;
        scope: string | '';
        redirect_url: null | string;
        state: null | string;
    };
    constructor({ type, appid, redirect_url, state, scope }: {
        type: 'window' | 'redirect' | 'iframe';
        appid: string;
        scope: string | 'user_profile';
        redirect_url?: null | string;
        state?: null | string;
    });
    /**
     * 加载授权窗口
     *
     * @param {string} id 目标元素的ID
     * @param {string} style 样式
     * @param callback
     */
    loadAuthWindow(id: string, style: string | undefined, callback: (arg0: {
        event: string;
        status: 'success' | 'failed' | 'error' | 'noLogin' | 'denied';
        data?: any;
        msg?: string;
    }) => void): void;
    /**
     * 开启授权窗口
     * @param {*} callback
     */
    openAuthWindow(callback: (arg0: {
        event: string;
        status: 'success' | 'failed' | 'error' | 'noLogin' | 'denied';
        data?: any;
        msg?: string;
    }) => void): false | undefined;
}
export default YunTowerAccountSDK;
