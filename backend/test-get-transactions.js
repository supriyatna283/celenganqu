require('dotenv').config();
const jwt = require('jsonwebtoken');

async function test() {
  const token = jwt.sign({ id: 1010627 }, process.env.JWT_SECRET, { expiresIn: '15m' });
  try {
    const res = await fetch('http://localhost:5000/v1/transactions', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log(`Total transactions returned: ${data.length}`);
    const latest = data.slice(0, 3);
    console.log("Top 3 transactions:");
    latest.forEach(t => console.log(`- ${t.description} (Rp ${t.amount}) [${t.transaction_date}] account: ${t.account_id}`));
  } catch (err) {
    console.error(err);
  }
}
test();
