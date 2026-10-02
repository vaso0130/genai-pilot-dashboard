/*
 * Supabase 公開前端設定。
 * anon / publishable key 本來就設計給瀏覽器使用；真正的寫入權限由 RLS 控制。
 * 請勿在這裡放 service_role key。
 */
window.APP_CONFIG = {
  supabaseUrl: 'https://pegqigjpphxykcsjnefw.supabase.co',
  supabaseAnonKey: 'sb_publishable_Vaoaoyn94jJ0qdY1ghuAqQ_CbHw470_'
};
