import React from 'react';
import { EmailLayout, EmailHeader, EmailBody, EmailButton, EmailAlert, EmailSignature } from './EmailLayout';

interface PasswordResetEmailProps {
  nome: string;
  novaSenha: string;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({ nome, novaSenha }) => (
  <EmailLayout previewText={`Sua senha foi redefinida, ${nome}`}>
    <EmailHeader title="Redefinição de Senha" />
    <EmailBody>
      <h2 style={{ color: '#1f2937', marginTop: 0, fontSize: '18px' }}>Olá {nome}!</h2>
      <p style={{ fontSize: '15px', color: '#374151' }}>
        Sua senha no <strong>HOF Circle Analytics</strong> foi redefinida por um administrador.
      </p>

      <EmailAlert variant="info">
        <p style={{ margin: 0, fontWeight: 'bold' }}>🔐 Nova senha: {novaSenha}</p>
        <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
          Recomendamos alterar essa senha assim que fizer login (em Preferências → Segurança).
        </p>
      </EmailAlert>

      <EmailButton href="https://ads.timedom.com.br">Acessar Plataforma</EmailButton>

      <p style={{ fontSize: '13px', color: '#6b7280', borderTop: '1px solid #e5e7eb', paddingTop: '20px', marginBottom: 0 }}>
        Se você não solicitou esta alteração, entre em contato com o administrador imediatamente.
      </p>
      <EmailSignature />
    </EmailBody>
  </EmailLayout>
);
