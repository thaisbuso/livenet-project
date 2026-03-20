import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import AdminClientPage from '../AdminClientPage';

export default async function SessionDashboardPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { sessionId } = await params;
  return <AdminClientPage sessionId={sessionId} />;
}
