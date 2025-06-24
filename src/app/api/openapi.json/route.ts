import { NextRequest, NextResponse } from 'next/server';
import openapiSpec from '../../../../openapi/openapi.json';

export const runtime = 'edge';

export async function GET(_req: NextRequest) {
  return NextResponse.json(openapiSpec, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}
