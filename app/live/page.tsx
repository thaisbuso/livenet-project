'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import LivePlayer from '@/components/LivePlayer';
import SessionStatus from '@/components/SessionStatus';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Position, Session } from '@/lib/types';

const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false });

export default function LivePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    async function loadData() {
      const supabase = createSupabaseBrowserClient();

      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('is_live', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setSession(sessionData ?? null);

      if (sessionData) {
        const { data: positionsData } = await supabase
          .from('positions')
          .select('*')
          .eq('session_id', sessionData.id)
          .order('created_at', { ascending: false })
          .limit(100);

        setPositions(positionsData ?? []);
      }
    }

    loadData();
  }, []);

  return (
    <main className="grid">
      <SessionStatus session={session} />
      <div className="grid grid-2">
        <LivePlayer />
        <LiveMap positions={positions} />
      </div>
    </main>
  );
}