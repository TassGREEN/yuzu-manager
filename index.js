import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../script.js";
import { popup_call } from "../../../popup.js";

const extensionName = "yuzu-manager";

function createYuzuUI() {
    const container = document.createElement("div");
    // 增加一个明显的标题颜色，确保能看见
    container.innerHTML = `
        <div class="yuzu-box" style="padding: 10px; border: 1px solid #666; border-radius: 10px; background: rgba(0, 0, 0, 0.3); margin-top: 10px;">
            <h3 style="color: #ff99cc; border-bottom: 1px solid #555; padding-bottom: 5px;">🍊 柚子·全能管家</h3>
            <p style="font-size: 0.9em; opacity: 0.8;">主人，所有数据管理都在这里哦！♡</p>
            
            <div style="margin: 10px 0;">
                <h4 style="margin-bottom: 5px;">📥 批量插件进货</h4>
                <textarea id="yuzu_plugin_urls" rows="4" class="text_pole" style="width: 100%; font-family: monospace; font-size: 0.8em;" placeholder="一行一个GitHub链接，例如：\nhttps://github.com/Cohee1207/SillyTavern-Simple-Proxy"></textarea>
                <button id="yuzu_btn_install" class="menu_button" style="margin-top: 5px; width: 100%;">✨ 开始批量安装</button>
                <div id="yuzu_install_log" style="margin-top:5px; font-size:0.8em; color: #aaa; max-height: 100px; overflow-y: auto;"></div>
            </div>

            <div style="margin: 15px 0; border-top: 1px dashed #555; padding-top: 10px;">
                <h4 style="margin-bottom: 5px;">📦 记忆备份 (导出)</h4>
                <button id="yuzu_btn_backup" class="menu_button" style="width: 100%;">💾 下载完整备份包 (.zip)</button>
            </div>
            
            <div style="margin-top: 10px; font-size: 0.8em; color: #ff6666;">
                ⚠️ 恢复提示：请手动解压 Zip 包覆盖到酒馆根目录。
            </div>
        </div>
    `;

    // --- 绑定事件：批量安装 ---
    const btnInstall = container.querySelector("#yuzu_btn_install");
    const logArea = container.querySelector("#yuzu_install_log");
    const inputArea = container.querySelector("#yuzu_plugin_urls");

    btnInstall.addEventListener("click", async () => {
        const text = inputArea.value;
        const urls = text.split('\n').filter(line => line.trim().startsWith("http"));
        
        if (urls.length === 0) {
            toastr.warning("主人，清单是空的或者格式不对哦！");
            return;
        }

        btnInstall.disabled = true;
        btnInstall.innerText = "⏳ 柚子正在努力搬运中...";
        logArea.innerText = "正在请求服务端...";

        try {
            const response = await fetch('/api/yuzu/install-plugins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ urls })
            });
            const data = await response.json();
            
            if (data.success) {
                logArea.innerHTML = data.logs.join('<br>');
                toastr.success("安装完成！请重启酒馆生效哦！♡");
            } else {
                toastr.error("出错了：" + data.msg);
                logArea.innerText = "错误: " + data.msg;
            }
        } catch (e) {
            toastr.error("网络请求失败喵...");
            console.error(e);
            logArea.innerText = "网络请求失败，请检查控制台(F12)";
        }
        btnInstall.disabled = false;
        btnInstall.innerText = "✨ 开始批量安装";
    });

    // --- 绑定事件：备份 ---
    const btnBackup = container.querySelector("#yuzu_btn_backup");
    btnBackup.addEventListener("click", () => {
        toastr.info("正在打包，可能需要几秒钟，请稍候...");
        // 使用 window.open 触发下载，更稳妥
        window.open("/api/yuzu/backup", "_blank");
    });

    return container;
}

// 注册到酒馆的扩展设置页面
jQuery(async () => {
    // 【关键修改点】：这里必须用 ["yuzu-manager"]，不能用 .yuzu_manager
    // 必须和 manifest.json 里的 id 完全一致！
    extension_settings["yuzu-manager"] = {
        render: (container) => {
            $(container).append(createYuzuUI());
        }
    };
    
    // 强制刷新一下UI以防万一
    console.log("[Yuzu Manager] 前端 UI 已加载！");
});
