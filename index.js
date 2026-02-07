import { extension_settings } from "../../../extensions.js"; // 相对路径兼容性最好

// 简单的 UI 构建
function createYuzuUI() {
    const div = document.createElement("div");
    div.innerHTML = `
        <div style="padding:10px; background:rgba(0,0,0,0.3); border:1px solid #666; margin-top:10px;">
            <h3>🍊 柚子管家 (Yuzu Manager)</h3>
            <p>恢复正常啦！♡</p>
            <textarea id="yuzu_urls" class="text_pole" rows="3" style="width:100%" placeholder="GitHub Links..."></textarea>
            <button id="yuzu_btn" class="menu_button" style="width:100%; margin-top:5px">Install</button>
            <div id="yuzu_log" style="font-size:0.8em"></div>
            <button id="yuzu_bkp" class="menu_button" style="width:100%; margin-top:10px">Backup (.zip)</button>
        </div>
    `;
    
    div.querySelector("#yuzu_btn").addEventListener("click", async () => {
        const btn = div.querySelector("#yuzu_btn");
        const urls = div.querySelector("#yuzu_urls").value.split('\n').filter(x=>x.includes('http'));
        if(!urls.length) return;
        btn.innerText = "Working...";
        try {
            const res = await fetch('/api/yuzu/install-plugins', {
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({urls})
            });
            const d = await res.json();
            div.querySelector("#yuzu_log").innerHTML = d.logs.join('<br>');
        } catch(e) { div.querySelector("#yuzu_log").innerText = "Error: " + e; }
        btn.innerText = "Install";
    });

    div.querySelector("#yuzu_bkp").addEventListener("click", () => window.open("/api/yuzu/backup", "_blank"));
    
    return div;
}

jQuery(async () => {
    // 🔑 必须和 manifest 的 id 一致！
    extension_settings["yuzu-manager"] = {
        render: (container) => $(container).append(createYuzuUI())
    };
});
