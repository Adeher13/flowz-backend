import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xovdrvzvudkzmvyliwxs.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvdmRydnp2dWRrem12eWxpd3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTEzNjIsImV4cCI6MjA3ODE4NzM2Mn0.m5yrIFfHcWazFqdhtui1p3NcuxXSfGjFymgYH7I2Ee8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
