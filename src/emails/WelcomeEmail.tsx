import React from 'react';
import { EmailLayout, EmailHeader, EmailBody, EmailButton, EmailAlert, EmailSignature } from './EmailLayout';

interface WelcomeEmailProps {
  nome: string;
  email: string;
  senhaTemporaria: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({ nome, email, senhaTemporaria }) => (
  <EmailLayout previewText={`Bem-vindo(a) ao HOF Circle Analytics, ${nome}!`}>
    <EmailHeader title="Bem-vindo(a) ao HOF Circle Analytics" />
    <EmailBody>
      <h2 style={{ color: '#1f2937', marginTop: 0, fontSize: '18px' }}>Olá {nome}!</h2>
      <p style={{ fontSize: '15px', color: '#374151' }}>
        Seu acesso à plataforma de inteligência estratégica do HOF Circle foi liberado. 🎉
      </p>
      <p style={{ fontSize: '15px', color: '#374151' }}>
        Aqui você acompanha suas campanhas, métricas de tráfego e insights personalizados com a
        metodologia D.O.M., tudo em um só lugar.
      </p>

      <EmailAlert variant="warning">
        <p style={{ margin: 0, fontSize: '14px' }}>
          <strong>Email:</strong> {email}
        </p>
        <p style={{ margin: '6px 0 0 0', fontWeight: 'bold' }}>
          🔐 Senha temporária: {senhaTemporaria}
        </p>
        <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
          Por segurança, altere sua senha assim que fizer o primeiro acesso (em Preferências →
          Segurança).
        </p>
      </EmailAlert>

      <EmailButton href="https://ads.timedom.com.br">Acessar Plataforma</EmailButton>

      <EmailSignature />
    </EmailBody>
  </EmailLayout>
);
