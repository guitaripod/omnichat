// This file ensures nodejs_compat is available for Pages Functions
export async function onRequest(context) {
  // Pass through to the next handler
  return context.next();
}
