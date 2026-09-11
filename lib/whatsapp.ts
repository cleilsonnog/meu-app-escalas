interface SendMessageParams {
  phone: string;
  message: string;
}

export async function sendWhatsAppMessage({
  phone,
  message,
}: SendMessageParams) {
  // Remove caracteres não numéricos do telefone
  const cleanPhone = phone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("55")
    ? cleanPhone
    : `55${cleanPhone}`;

  const response = await fetch(
    `${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE_NAME}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.EVOLUTION_API_KEY!,
      },
      body: JSON.stringify({
        number: formattedPhone,
        textMessage: {
          text: message, // Ajustado para o padrão da v1.8.7
        },
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Erro ao enviar mensagem WhatsApp: ${response.statusText} - ${JSON.stringify(errorData)}`,
    );
  }

  return response.json();
}
