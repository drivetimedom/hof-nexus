import React from 'react';

interface EmailLayoutProps {
  children: React.ReactNode;
  previewText?: string;
}

const emailStyles = {
  body: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    lineHeight: '1.6',
    color: '#333',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f9fafb',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    overflow: 'hidden' as const,
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
  },
  footer: {
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'center' as const,
    marginTop: '20px',
    paddingTop: '15px',
    borderTop: '1px solid #e5e7eb',
  },
};

export const EmailLayout: React.FC<EmailLayoutProps> = ({ children, previewText }) => (
  <div style={emailStyles.body}>
    {previewText && (
      <div style={{ display: 'none', maxHeight: 0, overflow: 'hidden' }}>
        {previewText}
      </div>
    )}
    <div style={emailStyles.container}>
      {children}
    </div>
    <p style={emailStyles.footer}>
      Este é um email automático, não responda a esta mensagem.<br />
      © {new Date().getFullYear()} HOF Circle Analytics — Time Dom. Todos os direitos reservados.
    </p>
  </div>
);

export const EmailHeader: React.FC<{
  title: string;
  subtitle?: string;
}> = ({ title, subtitle }) => (
  <div style={{
    background: '#0B0B0C',
    padding: '30px',
    textAlign: 'center' as const,
  }}>
    <div style={{
      display: 'inline-block',
      fontSize: '12px',
      fontWeight: 600,
      letterSpacing: '1.5px',
      color: '#FF6A00',
      textTransform: 'uppercase' as const,
      marginBottom: '10px',
    }}>
      HOF CIRCLE ANALYTICS
    </div>
    <h1 style={{
      color: 'white',
      margin: 0,
      fontSize: '22px',
      fontWeight: '600',
    }}>
      {title}
    </h1>
    {subtitle && (
      <p style={{ color: '#9ca3af', margin: '8px 0 0 0', fontSize: '13px' }}>{subtitle}</p>
    )}
  </div>
);

export const EmailBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ padding: '30px' }}>
    {children}
  </div>
);

export const EmailButton: React.FC<{
  href: string;
  children: React.ReactNode;
}> = ({ href, children }) => (
  <div style={{ textAlign: 'center' as const, margin: '30px 0' }}>
    <a
      href={href}
      style={{
        background: '#FF6A00',
        color: 'white',
        padding: '14px 32px',
        textDecoration: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        fontSize: '16px',
        display: 'inline-block',
      }}
    >
      {children}
    </a>
  </div>
);

export const EmailAlert: React.FC<{
  children: React.ReactNode;
  variant?: "info" | "warning";
}> = ({ children, variant = "info" }) => {
  const isWarning = variant === "warning";

  return (
    <div
      style={{
        backgroundColor: isWarning ? "#fff7ed" : "#eff6ff",
        border: `1px solid ${isWarning ? "#fed7aa" : "#bfdbfe"}`,
        borderRadius: "10px",
        color: isWarning ? "#9a3412" : "#1e3a8a",
        margin: "22px 0",
        padding: "16px",
      }}
    >
      {children}
    </div>
  );
};

export const EmailKpiGrid: React.FC<{
  items: { label: string; value: string }[];
}> = ({ items }) => (
  <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse', margin: '20px 0' }}>
    <tbody>
      {Array.from({ length: Math.ceil(items.length / 2) }).map((_, rowIdx) => (
        <tr key={rowIdx}>
          {items.slice(rowIdx * 2, rowIdx * 2 + 2).map((item, i) => (
            <td
              key={i}
              style={{
                width: '50%',
                padding: '14px',
                backgroundColor: '#fafafa',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                textAlign: 'center' as const,
              }}
            >
              <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#0B0B0C', marginTop: '4px' }}>
                {item.value}
              </div>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

export const EmailSignature: React.FC = () => (
  <p style={{
    fontSize: '14px',
    color: '#6b7280',
    borderTop: '1px solid #e5e7eb',
    paddingTop: '20px',
    marginBottom: 0,
  }}>
    Bons resultados,<br />
    <strong>HOF Circle Analytics</strong>
  </p>
);
