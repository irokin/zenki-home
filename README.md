# ZENKI 家庭服务台

ZENKI Edge 家庭服务界面原型：AI 管家、家庭日历、家庭任务、3D 数字孪生、家庭数据与家庭记忆。所有数据都是演示用的示例家庭。

在线地址：https://irokin.github.io/zenki-home/ （演示账号 zenki_admin / zenki_admin）

> 登录只是前端演示拦截，不是真正的访问控制。不要在这个仓库或页面里放真实家庭数据。

## AI 管家用哪个大模型

高频问题由页面本地回答（标注「端侧」）。开放式问题交给云端模型（标注「云边协同」），页面按以下顺序选择：

1. **在 claude.ai 里打开**：使用访客自己的 Claude。
2. **ZENKI 代理**（推荐给公开演示）：Cloudflare Worker 持有 Anthropic 密钥，访客无需配置。地址写在 `config.json`。
3. **Anthropic API 密钥**：在页面「AI 引擎设置」里填写，只保存在当前浏览器。
4. **OpenAI 兼容接口**：DeepSeek、通义千问、OpenRouter 等。部分服务商不允许网页直接调用，遇到跨域错误请改用代理。

## 部署 ZENKI 代理（一次性，约 5 分钟）

1. 在仓库 **Settings › Secrets and variables › Actions** 添加：
   - `ANTHROPIC_API_KEY`：Anthropic Console 里创建的 API 密钥
   - `CLOUDFLARE_API_TOKEN`：Cloudflare 里用「Edit Cloudflare Workers」模板创建的令牌
   - `CLOUDFLARE_ACCOUNT_ID`：Cloudflare 控制台右侧的 Account ID
   - `ZENKI_ACCESS_CODE`（可选）：设置后访客需在「AI 引擎设置」里输入访问码，防止额度被滥用
2. 第一次使用 Cloudflare Workers 时，先在 Cloudflare 控制台 **Workers & Pages** 里设置一个 workers.dev 子域。
3. 打开 **Actions › Deploy AI butler LLM proxy › Run workflow**。
4. 工作流会部署 Worker，把地址写入 `config.json` 并重新发布页面。之后打开页面，右上角显示「云端：Claude（ZENKI 代理）」即为成功，可以在「AI 引擎设置 › 测试连接」验证。

代理只接受来自 `https://irokin.github.io` 的请求，模型和单次输出上限在 `worker/wrangler.toml` 里配置。
