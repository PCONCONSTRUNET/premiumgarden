import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://yzvesbpnbewpmnpkomic.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6dmVzYnBuYmV3cG1ucGtvbWljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxODA1OTYsImV4cCI6MjEwMzc1NjU5Nn0.ogrdQJoEjOD82OOXH8PD47L86SLTCz7nglzZkgH2otQ');

async function debug() {
  const { data } = await supabase.from('vendas').select('*').in('id', ['e10639ef-c277-44a5-9f5a-dbd1ce8ff626', 'a31e05fa-14d2-43ce-939e-d306540c11bb']).limit(10);
  console.log(data);
  const { data: data2 } = await supabase.from('vendas').select('id, numero').limit(5).order('created_at', { ascending: true });
  console.log(data2);
}
debug();
