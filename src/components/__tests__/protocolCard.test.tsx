import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ProtocolCard } from '../results/ProtocolCard';
import { computeProtocolStats } from '../../services/bettingProtocol';

describe('Protokoll kártya', () => {
  it('üres naplóval is megjelenik: adatgyűjtés, kapu-feltételek és a szabály ujjlenyomata', () => {
    const html = renderToString(<ProtocolCard stats={computeProtocolStats([])} />);
    expect(html).toContain('Fogadási protokoll');
    expect(html).toContain('Adatgyűjtés');
    expect(html).toContain('Lezárt protokoll-tippek');
    expect(html).toContain('proto-');
    expect(html).not.toContain('Éles fogadásra alkalmas');
  });
});
