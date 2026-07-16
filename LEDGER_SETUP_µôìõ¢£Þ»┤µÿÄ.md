# 当日营业对账账本 —— 设置说明

这套方案的作用:客人点击 "Alles klar / Got it" 确认订单时，网站会悄悄把这单的内容和金额发一份到你自己的 Google 表格里，作为一份**独立于跑堂的记录**。你晚上核对营业额时，拿表格里的总数跟跑堂报的、Kassa 里收银的数字对一下，就能发现差异。

表格完全私密，只有你自己能看到。每天会自动清空一次，不会一直堆积客人数据。

---

## 第一步：建立 Google 表格

1. 打开 https://sheets.google.com ，新建一个空白表格
2. 把表格重命名成比如 `The Sign 账本`
3. 把第一个工作表（sheet tab）重命名成 `Orders`
4. 在第一行手动输入这三个表头：`Timestamp` | `Items` | `Total`

⚠️ **重要：不要点右上角"共享"把它分享给任何人，也不要开启"知道链接的任何人可查看"。保持默认私密（只有你自己能打开）。**

---

## 第二步：加入自动接收数据的脚本

1. 在这个表格里，点顶部菜单 **扩展程序 (Extensions) → Apps Script**
2. 把打开的编辑器里原有的代码全部删掉，粘贴下面这段：

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([new Date(), data.items, data.total]);
  return ContentService.createTextOutput(JSON.stringify({status: 'ok'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function cleanupDaily() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
  sheet.clearContents();
  sheet.appendRow(['Timestamp', 'Items', 'Total']);
}
```

3. 点顶部的保存图标（或 Ctrl/Cmd+S），项目随便起个名字，比如 `sign-ledger`

---

## 第三步：部署成网页接口

1. 点右上角蓝色的 **部署 (Deploy) → 新建部署 (New deployment)**
2. 点齿轮图标，选择类型 **网页应用 (Web app)**
3. 设置：
   - **执行身份 (Execute as)：我 (Me)**
   - **谁可以访问 (Who has access)：任何人 (Anyone)** ← 这一步是必须的，网站才能在客人不用登录 Google 的情况下把数据传进来。这不会让别人看到你表格的内容，只是允许"往里写一条"这个动作。
4. 点 **部署 (Deploy)**，第一次会要求你**授权 (Authorize)**——按提示用你自己的 Google 账号授权就行（会有个"未验证应用"的警告，点"继续/高级"选项过去即可，这是正常的，因为是你自己写的脚本）
5. 部署完成后会给你一个网址，类似：
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
   **把这整个网址复制下来**

---

## 第四步：把网址填进网站代码

打开项目里的 `app.js`，找到这一行（大概在文件中段）：

```javascript
const LEDGER_URL='PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
```

把 `PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE` 换成你刚才复制的那个网址，注意保留两边的引号，例如：

```javascript
const LEDGER_URL='https://script.google.com/macros/s/AKfycb.../exec';
```

保存后，重新把整个网站文件夹上传/部署到 Cloudflare Pages（跟你之前的流程一样）。

---

## 第五步：设置每天自动清空

1. 回到 Apps Script 编辑器，左侧点 **触发器 (Triggers)**（时钟图标）
2. 点 **+ 添加触发器 (Add Trigger)**
3. 设置：
   - 选择要运行的函数：**cleanupDaily**
   - 事件来源：**时间驱动 (Time-driven)**
   - 类型：**每天定时器 (Day timer)**
   - 时间段：选一个你们打烊之后、第二天营业之前的时间，比如**凌晨 4 点到 5 点**
4. 保存

这样每天到点会自动清空前一天的记录，只留表头。**记得在清空之前，先把当天数据跟跑堂对完账。**

---

## 怎么用

1. 客人在网站上点单，点 "Alles klar / Got it" 确认
2. 表格里会自动多一行：时间、点的什么、总价
3. 打烊对账时，把表格里当天所有行的 Total 加起来，跟 Kassa 里的营业额、跑堂报的数字比一下
4. 如果差太多，就知道该找谁聊聊了

---

## 关于这个方案的局限（诚实说明）

- 这份记录反映的是"**客人在手机上确认了想点什么**"，不是"**吧台真的做了、收了钱**"。如果跑堂真做了单但压根没让客人点手机、直接口头下单收现金，这份记录就不会有——所以它能防的是"客人明明点了但被跑堂少报"这种情况，防不了"跑堂完全绕过手机点单"这种情况。
- 如果想完全杜绝后者，长期需要让"跑堂收款"这个动作也强制经过系统（比如客人下单后必须有个"已确认/已收款"的状态才能出杯），这是更大的第二阶段工程，现在这版只是一个轻量级的交叉核对工具，不是万无一失的收银系统。
