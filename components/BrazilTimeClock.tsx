'use client';

import { useEffect, useState } from 'react';

export default function BrazilTimeClock() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Brasília time (UTC-3)
      const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      
      const hours = brazilTime.getHours().toString().padStart(2, '0');
      const minutes = brazilTime.getMinutes().toString().padStart(2, '0');
      
      setTime(`${hours}:${minutes} BRT`);
    };

    // Initial update
    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span className="navbar-clock" style={{
      color: '#ffffff4d',
      fontFamily: 'Roboto Mono, monospace',
      fontSize: '11px',
      fontWeight: '400',
    }}>
      {time}
    </span>
  );
}
