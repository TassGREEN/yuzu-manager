import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../script.js";
import { popup_call } from "../../../popup.js";

const extensionName = "yuzu-manager";

// 简单的 UI 构建
function createYuzuUI() {
    const container = document.createElement("div");
    container.innerHTML = `
        <div class="yuzu-box" style="padding: 10px; border: 1px solid #ccc; border-radius: 10px; background: rgba(0,0,0,0.2);">
            <h3 style="color: pink;">🍊 柚子·全能管家</h3>
            <p>主人，这里可以管理您的后宫数据哦！♡</p>
            
            <hr style="opacity: 0.3;">
            
            <h4>📥 批量插件进货</h4>
            <textarea id="yuzu_plugin_urls" rows="5" class="text_pole" placeholder="一行粘贴一个GitHub链接，例如：\nhttps://github.com/Cohee1207/SillyTavern-Simple-Proxy"></textarea>
            <br>
            <button id="yuzu_btn_install" class="menu_button">✨ 开始批量安装</button>
            <div id="yuzu_install_log" style="margin-top:5px; font-size:0.8em; color: #aaa;"></div>

            <hr style="opacity: 0.3;">

            <h4>📦 记忆备份 (一键导出)</h4>
            <p style="font-size:0.8em">包含角色、聊天、世界书、配置等。</p>
            <button id="yuzu_btn_backup" class="menu_button">💾 下载完整备份包 (.zip)</button>
            
            <hr style="opacity: 0.3;">
            
            <h4>📤 记忆恢复 (一键导入)</h4>
            <p style="font-size:0.8em; color: red;">⚠️ 警告：目前SillyTavern建议手动解压覆盖，或者直接上传Zip到对应的文件夹。自动覆盖风险较高，柚子建议主人手动解压备份包到酒馆根目录哦！</p>
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
            }
        } catch (e) {
            toastr.error("网络请求失败喵...");
            console.error(e);
        }
        btnInstall.disabled = false;
        btnInstall.innerText = "✨ 开始批量安装";
    });

    // --- 绑定事件：备份 ---
    const btnBackup = container.querySelector("#yuzu_btn_backup");
    btnBackup.addEventListener("click", () => {
        toastr.info("正在打包，可能需要几秒钟，请稍候...");
        window.location.href = "/api/yuzu/backup"; // 直接触发下载
    });

    return container;
}

// 注册到酒馆的扩展设置页面
jQuery(async () => {
    // 稍微延迟一下确保加载
    const settingsContainer = $("#extensions_settings");
    if (settingsContainer.length) {
        // 这里只是为了演示，实际上ST的扩展加载机制会自动读取 index.js
        // 我们通常需要在UI里加一个入口，但 ST 现在的 Extension 面板会自动显示
        // 只要 manifest 配置正确，您可以在 "Extensions" (积木图标) -> "Yuzu Manager" 看到它
    }
    
    // 注入设置面板的渲染函数
    extension_settings.yuzu_manager = {
        render: (container) => {
            $(container).append(createYuzuUI());
        }
    };
});
