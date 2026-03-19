import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gthmzwdwrkilhbmwgzso.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0aG16d2R3cmtpbGhibXdnenNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MzM5NjMsImV4cCI6MjA4OTIwOTk2M30.Sys-lKib6U8azaakkdCbW_PTYmOlsA11i5rk_1agvH8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
