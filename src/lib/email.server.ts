// Helper server-side para envio de emails via Resend.
// Reaproveitado pelos fluxos de boas-vindas, redefinição de senha e resumo semanal.

export async function sendEmail(params: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[email] RESEND_API_KEY não configurada — email não enviado.");
    return { ok: false, error: "RESEND_API_KEY não configurada." };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "HOF Circle Analytics <relatorios@timedom.com.br>",
      to: [params.to],
      subject: params.subject,
      html: `<!DOCTYPE html>${params.html}`,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[email] Falha ao enviar:", errText);
    return { ok: false, error: errText };
  }

  return { ok: true };
}
