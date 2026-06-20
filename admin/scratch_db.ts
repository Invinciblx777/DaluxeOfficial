import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// For testing outside Next.js, manually supply the Supabase keys
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jysymqntcwtjixcstqym.supabase.co'; 
// Wait, I don't know the user's supabase project ID!
// So I can't query the database directly from my container!
