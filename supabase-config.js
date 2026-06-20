/* ================================================
   Krajood Craft — Supabase Configuration
   ================================================
   
   📌 วิธีตั้งค่า:
   1. ไปที่ https://supabase.com → สร้าง Project ใหม่
   2. ไปที่ Project Settings → API
   3. คัดลอก "Project URL" และ "anon public" key มาใส่ด้านล่าง
   4. ไปที่ Authentication → Providers → เปิด Google
      (ต้องใส่ Google Client ID + Secret จาก Google Cloud Console)
   5. ไปที่ SQL Editor → รัน SQL สร้างตารางจากไฟล์ schema.sql
   ================================================ */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// 🔧 แก้ไขค่าด้านล่างนี้ด้วย Supabase config ของคุณ
const SUPABASE_URL = 'https://mpqzcoyapcrljxsohfag.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wcXpjb3lhcGNybGp4c29oZmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3OTA1NTcsImV4cCI6MjA5NjM2NjU1N30.ICZ-0Aui9iD7Ovl9pS07QLS3BR4a0hkzb79i_7cCJpY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { supabase };
