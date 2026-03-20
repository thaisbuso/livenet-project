// Rota pública: /join/[token]
// Servidor lê o token e passa para o componente cliente.
import { Metadata } from 'next';
import JoinForm from './JoinForm';

export const metadata: Metadata = {
  title: 'Aceitar Convite — NumbatNET',
  description: 'Você foi convidado para participar de um grupo no NumbatNET.',
};

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <JoinForm token={token} />;
}
