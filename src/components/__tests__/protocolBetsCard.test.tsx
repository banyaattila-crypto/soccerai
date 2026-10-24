import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ProtocolBetsCard } from '../bankroll/ProtocolBetsCard';
import { computeProtocolBetStats } from '../../services/protocolBets';

describe('Protokoll-fogadások kártya', () => {
  it('fogadás nélkül elmagyarázza, mit kell tenni', () => {
    const html = renderToString(<ProtocolBetsCard stats={computeProtocolBetStats([])} />);
    expect(html).toContain('Megfogadtam');
    expect(html).toContain('Még nincs protokoll-tippre kötött fogadás');
  });
});
