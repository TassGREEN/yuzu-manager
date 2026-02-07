const path = require('path');
const fs = require('fs');
const child_process = require('child_process');
const express = require('express'); // 引入 express 模块

let AdmZip;
try {
    AdmZip = require('adm-zip');
} catch (e) {
    console.log("[Yuzu] 警告：缺少 adm-zip 库，备份功能可能受限。");
}

const extensionName = "yuzu-manager";

async function init(context) {
    const app = context.app; // 获取 Express 实例
    
    // ============================================================
    // 🔑 关键修复：开门！
    // 把当前插件的文件夹映射到浏览器能访问的路径下
    // 这样 index.js 才能被浏览器加载到
    // ============================================================
    app.use('/scripts/extensions/yuzu-manager', express.static(__dirname));

    // --- API 1: 批量下载 ---
    app.post('/api/yuzu/install-plugins', async (req, res) => {
        const urls = req.body.urls; 
        if (!urls || !Array.isArray(urls)) return res.send({ success: false, msg: "没有收到链接列表喵！" });

        const results = [];
        const pluginDir = path.join(process.cwd(), 'plugins');
        if (!fs.existsSync(pluginDir)) fs.mkdirSync(pluginDir);

        console.log(`[Yuzu] 开始批量进货...`);

        for (const url of urls) {
            if (!url.trim()) continue;
            const folderName = url.split('/').pop().replace('.git', '');
            const targetPath = path.join(pluginDir, folderName);

            if (fs.existsSync(targetPath)) {
                results.push(`⚠️ 跳过 (已存在): ${folderName}`);
                continue;
            }
            try {
                child_process.execSync(`git clone "${url}" "${targetPath}"`);
                results.push(`✅ 成功: ${folderName}`);
            } catch (err) {
                results.push(`❌ 失败: ${folderName} - ${err.message}`);
            }
        }
        res.send({ success: true, logs: results });
    });

    // --- API 2: 备份 ---
    app.get('/api/yuzu/backup', (req, res) => {
        if (!AdmZip) return res.status(500).send("缺少 adm-zip 库。");
        const zip = new AdmZip();
        const rootDir = process.cwd();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const zipName = `SillyTavern_Backup_${timestamp}.zip`;
        
        // 备份列表
        const targets = ['public/characters', 'public/chats', 'public/worlds', 'public/groups', 'public/backgrounds', 'config.yaml', 'config.json', 'plugins'];
        
        targets.forEach(target => {
            const fullPath = path.join(rootDir, target);
            if (fs.existsSync(fullPath)) {
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) zip.addLocalFolder(fullPath, target);
                else zip.addLocalFile(fullPath);
            }
        });

        const zipBuffer = zip.toBuffer();
        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', `attachment; filename=${zipName}`);
        res.set('Content-Length', zipBuffer.length);
        res.send(zipBuffer);
    });

    console.log("[Yuzu Manager] 柚子已就位，通道已打开！♡");
}

module.exports = { init };
