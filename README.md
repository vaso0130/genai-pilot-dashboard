# 生成式 AI 公務應用試辦｜連動儀表板

把原本兩份靜態 HTML（推動儀表板、WBS）整合為同一份資料來源驅動的互動網站，並加入 Supabase 共用資料、管理者登入、草稿與正式發布流程。

## 使用方式

- 一般同仁：打開 GitHub Pages，即可讀取最新「已發布」資料。
- 管理者：使用 Magic Link 登入後，可切換編輯模式、修改文字與專案設定。
- 編輯中的內容只存於該管理者瀏覽器的 localStorage，不會立即影響其他人。
- 按「發布變更」後才寫入 Supabase；所有已開啟頁面的使用者會透過 Realtime 收到新版本。
- 發布時有 optimistic locking（版本檢查），可避免兩位管理者同時編輯造成靜默覆蓋。

## 架構

```text
GitHub Pages（前端）
       │
       ├── 匿名讀取 ─────────────┐
       │                         │
       └── 管理者登入 / 發布 ──> Supabase
                                 ├─ Auth (Magic Link)
                                 ├─ project_state
                                 ├─ app_admins
                                 └─ Realtime
```

## 1. 建立 Supabase 資料表與 RLS

在 Supabase SQL Editor 執行：

`supabase/schema.sql`

這會建立：

- `project_state`：目前正式發布版本，只有一列。
- `app_admins`：允許發布的使用者清單。
- `is_app_admin()`：前端查詢目前登入者是否為管理者。
- `publish_project_state()`：唯一的正式發布入口，含版本衝突檢查。
- Realtime publication。

## 2. 前端連線設定

到 Supabase 專案的 API 設定取得：

- Project URL
- anon / publishable key

填入根目錄 `config.js`：

```js
window.APP_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_ANON_OR_PUBLISHABLE_KEY'
};
```

**不要**把 `service_role` key 放進前端。`anon / publishable key` 可公開，真正的寫入權限由 RLS 與 RPC 控制。

## 3. Supabase Auth Redirect URL

在 Supabase Authentication 的 URL / Redirect 設定加入：

`https://vaso0130.github.io/genai-pilot-dashboard/`

## 4. 設定第一位管理者

1. 網站按「管理者登入」，用自己的信箱完成 Magic Link 登入一次。
2. 回 Supabase SQL Editor 執行：

```sql
insert into public.app_admins (user_id)
select id from auth.users where email = 'YOUR_ADMIN_EMAIL'
on conflict (user_id) do nothing;
```

3. 重新整理網站。工具列就會出現「編輯模式 / 發布變更 / 專案設定」。

若要增加其他管理者，重複同一個 SQL 即可。

## 5. GitHub Pages

Repository 內已附 `.github/workflows/pages.yml`。每次 push `main` 都會自動部署 GitHub Pages。

GitHub Pages 若尚未啟用，請到 repository：

`Settings → Pages → Build and deployment → Source → GitHub Actions`

完成一次後，日後只要 push 就會自動更新網站程式；業務資料則不需要 push，直接從頁面「發布變更」即可。

## 資安說明

- 未登入者只有 `SELECT project_state` 權限。
- 已登入但不在 `app_admins` 的帳號仍無法發布。
- 資料表不開放前端直接 `UPDATE`；發布必須走 `publish_project_state()`。
- RPC 會再次檢查 `auth.uid()`、管理者資格與 `expected_version`。
- 前端僅放 Supabase anon / publishable key，不放 service role 或其他伺服器秘密。
