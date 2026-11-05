export const WHATSAPP_NUMBER = "5531996907206";

export const whatsappLink = (text = "Olá! Quero preencher minhas cadeiras vazias com o Sinal.") =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
