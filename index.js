var YunTowerAccountSDK = /** @class */ (function () {
    function YunTowerAccountSDK(_a) {
        var type = _a.type, appid = _a.appid, redirect_url = _a.redirect_url, _b = _a.state, state = _b === void 0 ? null : _b, _c = _a.scope, scope = _c === void 0 ? 'user_profile' : _c;
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
            type: type,
            appid: appid,
            scope: scope,
            redirect_url: redirect_url,
            state: state,
        };
    }
    /**
     * 开启授权窗口
     * @param {*} callback
     */
    YunTowerAccountSDK.prototype.openAuthWindow = function (callback) {
        var _this = this;
        var child = window.open("".concat(this.config.auth, "/auth/app?type=").concat(this.config.type, "&appid=").concat(this.config.appid, "&redirect_url=").concat(this.config.redirect_url, "&scope=").concat(this.config.scope, "&state=").concat(this.config.state), "_blank", "width=500,height=600");
        // 监听来自子页面的消息
        window.addEventListener("message", function (event) {
            var _a, _b, _c, _d;
            var origin = event.origin.replace(/^https?:\/\//, "");
            if (!_this.config.origin_white_list.includes(origin))
                return;
            // 授权成功
            if (((_a = event.data) === null || _a === void 0 ? void 0 : _a.action) === "status") {
                if (((_b = event.data) === null || _b === void 0 ? void 0 : _b.status) === "success") {
                    _this.auth_status = true;
                    callback({
                        event: "auth",
                        status: (_c = event.data) === null || _c === void 0 ? void 0 : _c.status,
                        data: JSON.parse(event.data.data),
                    });
                }
                else {
                    callback({
                        event: "auth",
                        status: (_d = event.data) === null || _d === void 0 ? void 0 : _d.status,
                        msg: event.data.msg,
                    });
                }
                child === null || child === void 0 ? void 0 : child.close();
            }
        });
        if (child && !child.closed) {
            var timer_1 = setInterval(function () {
                if (child.closed) {
                    clearInterval(timer_1);
                    callback({
                        event: "closed",
                        status: 'success',
                    });
                }
                child.postMessage({ action: "status" }, "*");
            }, 3000);
        }
    };
    return YunTowerAccountSDK;
}());
