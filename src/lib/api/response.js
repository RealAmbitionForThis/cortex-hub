import { NextResponse } from 'next/server';

export function success(data = {}, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status });
}

export function error(message, status = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function notFound(message = 'Not found') {
  return error(message, 404);
}

export function badRequest(message = 'Bad request') {
  return error(message, 400);
}
