import React from 'react';
import { EmailLayout, EmailHeader, EmailBody, EmailButton, EmailKpiGrid, EmailSignature } from './EmailLayout';

interface WeeklySummaryEmailProps {
  nome: string;
  periodLabel: string;
  spend: string;
  revenue: string;
  roas: string;
  cpl: string;
  leads: string;
  ctr: string;
}

export const WeeklySummaryEmail: React.FC<WeeklySummaryEmailProps> = ({
  nome,
  periodLabel,
  spend,
  revenue,
  roas,
  cpl,
  leads,
  ctr,
}) => (
  <EmailLayout previewText={`Seu resumo semanal está pronto, ${nome}`}>
    <EmailHeader title="Resumo Semanal" subtitle={periodLabel} />
    <EmailBody>
      <h2 style={{ color: '#1f2937', marginTop: 0, fontSize: '18px' }}>Olá {nome}!</h2>
      <p style={{ fontSize: '15px', color: '#374151' }}>
        Aqui está o panorama da sua operação na última semana:
      </p>

      <EmailKpiGrid
        items={[
          { label: 'Investimento', value: spend },
          { label: 'Receita', value: revenue },
          { label: 'ROAS', value: roas },
          { label: 'CPL', value: cpl },
          { label: 'Leads', value: leads },
          { label: 'CTR', value: ctr },
        ]}
      />

      <EmailButton href="https://ads.timedom.com.br/dashboard">
        Ver dashboard completo
      </EmailButton>

      <EmailSignature />
    </EmailBody>
  </EmailLayout>
);
