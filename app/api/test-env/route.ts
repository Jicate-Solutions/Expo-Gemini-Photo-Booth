import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Test actual upload to Supabase
  let uploadResult = 'not tested';
  if (supabaseUrl && serviceKey) {
    try {
      const testBuffer = Buffer.from('test');
      const res = await fetch(`${supabaseUrl}/storage/v1/object/transformations/test-${Date.now()}.txt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'text/plain',
        },
        body: testBuffer,
      });
      const text = await res.text();
      uploadResult = `status=${res.status} body=${text}`;
    } catch (e) {
      uploadResult = `exception: ${e}`;
    }
  }

  return NextResponse.json({
    supabaseUrl: supabaseUrl ? supabaseUrl : 'MISSING',
    serviceKey: serviceKey ? `set (starts with: ${serviceKey.substring(0, 20)}...)` : 'MISSING',
    uploadResult,
  });
}
