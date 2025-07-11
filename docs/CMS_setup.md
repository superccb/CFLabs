---

## 🧩 Key Overview

### 🛠️ Git SSH & User Configuration

1. **SSH Configuration File**

   ```ssh
   Host github-superccb
     User your-username
     Hostname github.com
     PreferredAuthentications publickey
     IdentityFile /Users/your-username/.ssh/id_1314m1314
     IdentitiesOnly yes
   ```

2. **Modify Git Remote to Use SSH Alias**

   ```bash
   git remote set-url origin git@github-superccb:superccb/CFLabs.git
   ```

3. **Set Git Username and Email for This Project**

   ```bash
   git config user.name "Your Full Name"
   git config user.email "superccb@users.noreply.github.com"
   ```

4. **Test SSH Connection Before Push**

   ```bash
   ssh -T git@github-superccb
   ```

---

## 🗂️ GitHub Issue Template as CMS

### 📝 Placement Location

Place the following files in:

```
CFLabs/.github/ISSUE_TEMPLATE/
```

---

### 📔 `diary_entry.md`: Diary + 5R Reflection Template

```md
---
name: 📔 Daily Diary Entry
about: A structured template for journaling and reflection
title: "[Diary] YYYY-MM-DD - Title"
labels: [diary, daily-log]
assignees: ''
---

## 📚 Background

_Provide context or background of today's focus (project status, mindset, environment, etc.)_

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

### 📝 `quick_capture.md`: Quick Capture Note Template

```md
---
name: 📝 Quick Capture
about: A fast template for capturing spontaneous thoughts or notes
title: "[Quick] Write Something Immediately"
labels: [quick, note, raw]
assignees: ''
---

# Write Title

## Write Content

### ❗ Whatever comes to mind, write it down immediately (this line highlighted in red for emphasis)

Write notes on the back of A4 paper  
Write 10 pages of notes daily  
1 minute per page, write immediately when you think of something  
Reasons not to use notebooks, diaries, or Word  
Keep notes within 1 minute, can write anywhere  

💡 _Consider emotions carefully before writing them in notes_
```

---

### ☂ `umbrella_thinking.md`: "Empty Umbrella" Decision Analysis Template

```md
---
name: ☂️ Umbrella Thinking Log
about: Use the 空雨傘 (McKinsey) decision-making model to analyze and resolve issues
title: "[Umbrella] Problem Analysis - Title"
labels: [thinking, reflection, decision]
assignees: ''
---

## ☁ Empty (Current Situation)

Observe the current situation: describe what you see, data, or problems  
> Example: Weather is cloudy, ground is wet

---

## 🌧 Rain (Analysis)

Based on phenomena, derive and predict:  
> Example: It may have just rained, or it's about to rain

---

## ☂ Umbrella (Action)

Based on analysis, formulate corresponding action plans:  
> Example: Prepare to bring an umbrella to avoid getting wet
```

---

## 🚀 Test After Push

```bash
git add .github/ISSUE_TEMPLATE/
git commit -m "Add markdown-based issue templates for diary and note-taking"
git push
```

Go to GitHub page to test if templates display correctly:

🔗 `https://github.com/superccb/CFLabs/issues/new/choose`

---



