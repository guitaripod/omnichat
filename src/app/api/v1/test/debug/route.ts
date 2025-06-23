import { NextRequest, NextResponse } from 'next/server';
import { getDevStorage } from '@/lib/db/dev-storage';

export const runtime = 'edge';

export async function GET(_request: NextRequest) {
  const storage = getDevStorage();

  const data: any = {};
  let totalRecords = 0;

  for (const [tableName, map] of Object.entries(storage)) {
    if (map instanceof Map) {
      data[tableName] = Array.from(map.values());
      totalRecords += map.size;
    }
  }

  return NextResponse.json({
    storage: data,
    tables: Object.keys(storage),
    totalRecords,
    sqlitetableRecords: storage.sqlitetable ? Array.from(storage.sqlitetable.values()) : [],
  });
}
