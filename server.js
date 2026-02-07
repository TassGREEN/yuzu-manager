const path = require('path');
const fs = require('fs');
const child_process = require('child_process');

// 尝试加载 adm-zip，如果酒馆没装这个库，可能需要手动 npm install adm-zip
// 但通常 ST 环境里是有这类的工具的，或者我们可以用系统命令
let AdmZip;
try {
    AdmZip = require('adm-zip');
} catch (e) {
    console.log("[Yuzu] 警告：缺少 adm-zip 库，备份功能可能受限。建议在酒馆目录下运行 npm install adm-zip");
}

const extensionName = "yuzu-manager";
const extensionPath = path.join(__dirname);

// 需要备份的目录（从酒馆根目录开始算）
const BACKUP_TARGETS = [
    'public/characters',
    'public/chats',
    'public/worlds',
    'public/groups',
    'public/backgrounds',
    'config.yaml',
    'config.json'
];

async function init(context) {
    const app = context.app; // 获取 Express 实例
    
    // --- 功能1：批量下载插件 API ---
    app.post('/api/yuzu/install-plugins', async (req, res) => {
        const urls = req.body.urls; // 这是一个数组
        if (!urls || !Array.isArray(urls)) return res.send({ success: false, msg: "没有收到链接列表喵！" });

        const results = [];
        const pluginDir = path.join(process.cwd(), 'plugins');
        
        // 确保插件目录存在
        if (!fs.existsSync(pluginDir)) fs.mkdirSync(pluginDir);

        console.log(`[Yuzu] 开始批量进货，共 ${urls.length} 个...`);

        for (const url of urls) {
            if (!url.trim()) continue;
            const folderName = url.split('/').pop().replace('.git', '');
            const targetPath = path.join(pluginDir, folderName);

            if (fs.existsSync(targetPath)) {
                results.push(`⚠️ 跳过 (已存在): ${folderName}`);
                continue;
            }

            try {
                // 使用 git clone
                child_process.execSync(`git clone "${url}" "${targetPath}"`);
                results.push(`✅ 成功: ${folderName}`);
            } catch (err) {
                results.push(`❌ 失败: ${folderName} - ${err.message}`);
            }
        }
        res.send({ success: true, logs: results });
    });

    // --- 功能2：一键备份 API ---
    app.get('/api/yuzu/backup', (req, res) => {
        if (!AdmZip) return res.status(500).send("缺少 adm-zip 库，无法压缩。");

        const zip = new AdmZip();
        const rootDir = process.cwd();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const zipName = `SillyTavern_Backup_${timestamp}.zip`;

        console.log("[Yuzu] 正在为主人打包记忆...");

        BACKUP_TARGETS.forEach(target => {
            const fullPath = path.join(rootDir, target);
            if (fs.existsSync(fullPath)) {
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    zip.addLocalFolder(fullPath, target); // 保持目录结构
                } else {
                    zip.addLocalFile(fullPath);
                }
            }
        });

        // 生成 Buffer 并发送
        const zipBuffer = zip.toBuffer();
        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', `attachment; filename=${zipName}`);
        res.set('Content-Length', zipBuffer.length);
        res.send(zipBuffer);
    });

    console.log("[Yuzu Manager] 柚子已就位，随时听候差遣！♡");
}

module.exports = { init };
