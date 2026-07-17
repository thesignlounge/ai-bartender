# THE SIGN CLUB V1.2 — Google Sheets 同步安装

## 这一版会同步什么

- Members：会员编号、姓名、电话号码、邮箱、生日、同意状态、注册时间、Welcome 状态、Loyalty 次数
- Rewards：Welcome / Loyalty 优惠的生成、有效期、核销时间
- Visits：每一次员工确认的消费次数
- Sessions：客人登录状态
- Settings：员工 PIN、Welcome 有效天数

电话号码会先统一成奥地利国际格式。例如：

- `0664 1234567`
- `+43 664 1234567`
- `0043 664 1234567`

都会保存为同一个号码，因此不能重复注册。

---

## 第一步：创建专用 Google 表格

1. 用店铺 Google 账号打开 Google Sheets。
2. 新建空白表格。
3. 命名：`THE SIGN CLUB DATABASE`。
4. 不要把表格设置为“知道链接的人可查看”。只允许店铺负责人账号访问。

## 第二步：打开 Apps Script

在表格上方点击：

`扩展程序 / Erweiterungen` → `Apps Script`

删除编辑器里的示例代码。

打开压缩包中的：

`GOOGLE_APPS_SCRIPT_CLUB.gs`

复制全部内容并粘贴到 Apps Script 编辑器，保存。

## 第三步：初始化数据表

1. 在 Apps Script 顶部函数选择框中选择 `setupClubSheets`。
2. 点击“运行 / Ausführen”。
3. 第一次会要求 Google 授权，选择店铺 Google 账号并允许访问该表格。
4. 返回 Google Sheets 后，应看到：

- Members
- Rewards
- Visits
- Sessions
- Settings

在 Settings 中默认员工 PIN 是 `2580`。正式使用前请改成新的 4–8 位 PIN。

## 第四步：部署为网页应用

1. Apps Script 右上角点击 `部署 / Bereitstellen`。
2. 选择 `新部署 / Neue Bereitstellung`。
3. 类型选择 `网页应用 / Web-App`。
4. 执行身份选择：`我 / Ich`。
5. 谁有访问权限选择：允许网站访客调用的公开选项（通常显示为 `任何人 / Jeder`）。
6. 点击部署并再次授权。
7. 复制最后生成的网页应用 URL。

URL 必须大致是：

`https://script.google.com/macros/s/......../exec`

不要复制以 `/dev` 结尾的测试地址。

## 第五步：把地址放进网站

打开：

`club-api.js`

找到：

```js
API_URL: 'PASTE_GOOGLE_APPS_SCRIPT_EXEC_URL_HERE'
```

替换为刚才复制的 `/exec` 地址，例如：

```js
API_URL: 'https://script.google.com/macros/s/你的部署编号/exec'
```

保存后，把本压缩包所有网站文件重新上传 GitHub，覆盖原文件。

## 第六步：完整测试

### 注册测试

1. 打开 `member.html`。
2. 使用测试号码注册。
3. 检查 Google Sheets 的 Members 和 Rewards 是否出现记录。
4. 退出登录。
5. 使用相同号码再次注册，系统必须拒绝。
6. 使用该号码和密码登录，系统应打开原会员账户。

### 跨设备同步测试

1. 电脑登录会员，显示 Welcome Drink 二维码。
2. 员工手机扫描二维码。
3. 输入员工 PIN。
4. 点击 `Einlösung bestätigen`。
5. 回到客人电脑，切换一次页面或重新聚焦浏览器。
6. Welcome Drink 应自动变成 `Eingelöst`。
7. Rewards 表应出现核销时间。

### Loyalty 测试

1. 员工扫描会员二维码，而不是优惠二维码。
2. 点击 `+ 1 Drink bestätigen`。
3. Visits 表增加一条记录。
4. Members 中 Visits 数字增加。
5. 客人页面重新聚焦后进度自动更新。

## 重要提醒

- 不要公开分享 Google 表格。
- 不要把 Apps Script 源代码里的内部设置放到社交媒体。
- Apps Script 网页地址本身会公开接收请求，但所有注册、核销和登录判断都在服务器端执行。
- 当前员工 PIN 是第一阶段保护，不应长期使用默认 `2580`。
- 当前适合试营业和有限会员量。正式大规模运营前，应迁移到专业数据库并增加短信验证、密码找回、访问日志和更完善的账户删除流程。
- Datenschutz 页面上线前，应补充 Google 作为数据处理服务提供方，以及真实负责人、地址、联系邮箱和保存期限。
