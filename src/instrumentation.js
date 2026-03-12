export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerBuiltInJobs } = await import('@/lib/scheduler/jobs');
    registerBuiltInJobs();
  }
}
