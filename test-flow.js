const TOKEN = process.env.TOKEN || 'PASTE_A_JWT_FROM_POST_/api/auth/login';

async function test() {
  console.log('1. Creating Session...');
  let res = await fetch('http://localhost:3000/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
    body: JSON.stringify({
      title: "Physics - Rotational Motion Doubt Session",
      participants: ["mentor@vectorify.in", "aspirant@example.com"],
      sessionDate: "2026-06-06T10:00:00Z",
      transcript: [
        {timestamp: "00:10", speaker: "Mentor", text: "Let us start with where you got stuck on torque."},
        {timestamp: "00:20", speaker: "Student", text: "I will redo the moment of inertia problems."}
      ]
    })
  });
  let data = await res.json();
  console.log(JSON.stringify(data, null, 2));
  const sessionId = data.data.id;

  console.log('\n2. Listing Sessions...');
  res = await fetch('http://localhost:3000/api/sessions', {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  console.log(JSON.stringify(await res.json(), null, 2));

  console.log(`\n3. Analyzing Session ${sessionId}...`);
  res = await fetch(`http://localhost:3000/api/sessions/${sessionId}/analyze`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  console.log(JSON.stringify(await res.json(), null, 2));

  console.log('\n4. Checking Action Items...');
  res = await fetch('http://localhost:3000/api/action-items', {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  console.log(JSON.stringify(await res.json(), null, 2));
}
test().catch(console.error);
