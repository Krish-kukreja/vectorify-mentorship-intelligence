const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmY2RmNWE5Ny1lYzhhLTRhOWEtOWFmYS01MTZlZWZiOTllMzMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3ODA2ODg3NTMsImV4cCI6MTc4MTI5MzU1M30.31sCPRfAFQJHAM_no5Z0X48y4GuBjtqctxBTbyjSLCU';

async function test() {
  console.log('1. Creating Meeting...');
  let res = await fetch('http://localhost:3000/api/meetings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
    body: JSON.stringify({
      title: "Sprint Planning",
      participants: ["alice@example.com", "bob@example.com"],
      meetingDate: "2026-06-06T10:00:00Z",
      transcript: [
        {timestamp: "00:10", speaker: "John", text: "We should launch next Friday."},
        {timestamp: "00:20", speaker: "Alice", text: "I will prepare release notes."}
      ]
    })
  });
  let data = await res.json();
  console.log(JSON.stringify(data, null, 2));
  const meetingId = data.data.id;

  console.log('\n2. Listing Meetings...');
  res = await fetch('http://localhost:3000/api/meetings', {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  console.log(JSON.stringify(await res.json(), null, 2));

  console.log(`\n3. Analyzing Meeting ${meetingId}...`);
  res = await fetch(`http://localhost:3000/api/meetings/${meetingId}/analyze`, {
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
