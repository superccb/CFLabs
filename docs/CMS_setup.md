---

## 🧩 重點總覽

### 🛠️ Git SSH & 使用者設定

1. **SSH 設定檔**

   ```ssh
   Host github-superccb
     User 你的用戶
     Hostname github.com
     PreferredAuthentications publickey
     IdentityFile /Users/你的用戶/.ssh/id_1314m1314
     IdentitiesOnly yes
   ```

2. **修改 Git 遠端為使用 SSH Alias**

   ```bash
   git remote set-url origin git@github-superccb:superccb/CFLabs.git
   ```

3. **設定該專案的 Git 使用者名稱與 Email**

   ```bash
   git config user.name "Your Full Name"
   git config user.email "superccb@users.noreply.github.com"
   ```

4. **推送前測試 SSH 連線**

   ```bash
   ssh -T git@github-superccb
   ```

---

## 🗂️ GitHub Issue Template 作為 CMS

### 📝 放置位置

將以下檔案放入：

```
CFLabs/.github/ISSUE_TEMPLATE/
```

---

### 📔 `diary_entry.md`：日記＋5R 反思模板

```md
---
name: 📔 Daily Diary Entry
about: A structured template for journaling and reflection
title: "[Diary] YYYY-MM-DD - Title"
labels: [diary, daily-log]
assignees: ''
---

## 📚 Background

_Provide context or background of today’s focus (project status, mindset, environment, etc.)_

---

## 📖 Diary

_Write your raw thoughts, descriptions, or stream-of-consciousness journal entry here._

---

## 📌 Summary

_What's the main takeaway or reflection from today?_

---

## ✅ Task List

- [ ] Example Task 1
- [ ] Example Task 2

---

## 🔁 5R Reflection

- **Review**: What went well or poorly?
- **Regret**: Anything you wish you had done differently?
- **Remedy**: How will you fix or improve it?
- **Record**: Key lessons or insights to remember
- **Result**: Outcome or measurable effect
```

---

### 📝 `quick_capture.md`：快寫快記筆記模板

```md
---
name: 📝 Quick Capture
about: A fast template for capturing spontaneous thoughts or notes
title: "[Quick] Write Something Immediately"
labels: [quick, note, raw]
assignees: ''
---

# 写标题

## 写正文

### ❗ 想到的事，不论是什么，先写下来（这一条用红色标注强调）

笔记写在A4纸的背面  
每天做10页笔记  
每页1分钟，一想到就立刻写下来  
不能用笔记本、日记本、Word 的原因  
笔记控制在 1 分钟内，在任何地方都可以写  

💡 _情绪要再三思考后再写入笔记_
```

---

### ☂ `umbrella_thinking.md`：「空雨傘」決策分析模板

```md
---
name: ☂️ Umbrella Thinking Log
about: Use the 空雨傘 (McKinsey) decision-making model to analyze and resolve issues
title: "[Umbrella] Problem Analysis - Title"
labels: [thinking, reflection, decision]
assignees: ''
---

## ☁ 空（現狀）

觀察現狀：描述你看到的情況、數據或問題  
> 例：天氣陰沉，地面潮濕

---

## 🌧 雨（分析）

根據現象進行推導與預測：  
> 例：可能剛下過雨，也可能即將下雨

---

## ☂ 傘（行動）

根據分析制定對應行動計畫：  
> 例：準備帶傘，避免被淋濕
```

---

## 🚀 推送後測試

```bash
git add .github/ISSUE_TEMPLATE/
git commit -m "Add markdown-based issue templates for diary and note-taking"
git push
```

前往 GitHub 頁面測試模板是否正常顯示：

🔗 `https://github.com/superccb/CFLabs/issues/new/choose`

---



