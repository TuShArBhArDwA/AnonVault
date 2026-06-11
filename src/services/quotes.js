import { getSupabaseClient } from './supabase';

const LOCAL_STORAGE_KEY = 'anonvault_quotes';

let useLocalStorageFallback = false;

const getLocalQuotes = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Failed to read local quotes:', e);
    return [];
  }
};

const saveLocalQuotes = (quotes) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(quotes));
  } catch (e) {
    console.error('Failed to save local quotes:', e);
  }
};

export const fetchQuotes = async () => {
  const client = getSupabaseClient();
  if (!client) {
    useLocalStorageFallback = true;
    return getLocalQuotes();
  }

  try {
    const { data, error } = await client
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        useLocalStorageFallback = true;
        return getLocalQuotes();
      }
      throw error;
    }
    return data || [];
  } catch (err) {
    console.warn('Supabase fetch failed for quotes, falling back to LocalStorage:', err);
    useLocalStorageFallback = true;
    return getLocalQuotes();
  }
};

export const addQuote = async (quote) => {
  if (useLocalStorageFallback) {
    const local = getLocalQuotes();
    const newQuote = {
      id: Math.random().toString(36).substring(2, 15) + '_' + Date.now(),
      text: quote.text,
      author: quote.author || 'Unknown',
      category: quote.category || 'Inspiration',
      tags: quote.tags || [],
      source: quote.source || '',
      created_at: new Date().toISOString()
    };
    local.unshift(newQuote);
    saveLocalQuotes(local);
    return newQuote;
  }

  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');

  const { data: { user } } = await client.auth.getUser().catch(() => ({ data: { user: null } }));
  const payload = {
    text: quote.text,
    author: quote.author || 'Unknown',
    category: quote.category || 'Inspiration',
    tags: quote.tags || [],
    source: quote.source || '',
    ...(user ? { user_id: user.id } : {})
  };

  const { data, error } = await client
    .from('quotes')
    .insert([payload])
    .select();

  if (error) throw error;
  return data[0];
};

export const updateQuote = async (id, updates) => {
  if (useLocalStorageFallback) {
    const local = getLocalQuotes();
    const idx = local.findIndex(q => q.id === id);
    if (idx !== -1) {
      local[idx] = {
        ...local[idx],
        text: updates.text,
        author: updates.author || 'Unknown',
        category: updates.category || 'Inspiration',
        tags: updates.tags || [],
        source: updates.source || ''
      };
      saveLocalQuotes(local);
      return local[idx];
    }
    throw new Error('Quote not found locally');
  }

  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');

  const { data, error } = await client
    .from('quotes')
    .update({
      text: updates.text,
      author: updates.author || 'Unknown',
      category: updates.category || 'Inspiration',
      tags: updates.tags || [],
      source: updates.source || ''
    })
    .eq('id', id)
    .select();

  if (error) throw error;
  return data[0];
};

export const deleteQuote = async (id) => {
  if (useLocalStorageFallback) {
    const local = getLocalQuotes();
    const filtered = local.filter(q => q.id !== id);
    saveLocalQuotes(filtered);
    return true;
  }

  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');

  const { error } = await client
    .from('quotes')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
