const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testInsert() {
  const { data, error } = await supabase.from('customers').insert([{
    name: 'Muhammad Nawaf Tariq',
    email: 'nawaftariq99@gmail.com',
    phone: '0561204416',
    city: 'Abu Dhabi',
    address: 'DELMA STREET ABU DHABI UAE villa 132',
    notes: ''
  }]).select();

  console.log('Error:', error);
  console.log('Data:', data);
}

testInsert();
