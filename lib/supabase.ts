
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cztysoswlzakkdamrjbd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6dHlzb3N3bHpha2tkYW1yamJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0Mjc2NDQsImV4cCI6MjA4NzAwMzY0NH0.gQU0NAPCobkFO-4uk90nhH514vyzfbB9txT2VUift0Y';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
