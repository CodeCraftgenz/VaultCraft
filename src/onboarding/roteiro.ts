/**
 * Roteiro completo do onboarding (primeira execução).
 *
 * Por quê? Queremos que o usuário se sinta acolhido e confiante
 * ao usar o VaultCraft pela primeira vez. Cada passo realiza uma
 * ação real para que o usuário já tenha conteúdo no app ao final.
 */

export interface PassoOnboarding {
  /** Identificador único do passo */
  id: string;
  /** Número do passo (1-based) */
  numero: number;
  /** Título curto exibido no topo */
  titulo: string;
  /** Texto principal do passo */
  descricao: string;
  /** Texto do botão de ação (se houver) */
  textoBotaoAcao?: string;
  /** Ícone lucide-react para o passo */
  icone: string;
  /** Dica amigável exibida abaixo */
  dica?: string;
  /** Se este passo requer uma ação do usuário antes de avançar */
  requerAcao: boolean;
}

export const roteiroOnboarding: PassoOnboarding[] = [
  {
    id: 'boas-vindas',
    numero: 1,
    titulo: 'Bem-vindo ao VaultCraft!',
    descricao:
      'O VaultCraft é o seu cofre pessoal, 100% offline. Aqui você organiza documentos importantes, notas e checklists do dia a dia — tudo no seu computador, sem nuvem, sem complicação.\n\nTudo importante. Encontrável em segundos.',
    icone: 'Shield',
    dica: 'Seus dados nunca saem do seu computador. Privacidade total.',
    requerAcao: false,
  },
  {
    id: 'criar-pasta',
    numero: 2,
    titulo: 'Crie sua primeira pasta',
    descricao:
      'Pastas são a base da sua organização. Pense nelas como gavetas do seu cofre. Exemplos: "Carro", "Saúde", "Casa", "Trabalho".\n\nVamos criar uma pasta agora? Escolha um nome que faça sentido para você.',
    textoBotaoAcao: 'Criar pasta "Meus Documentos"',
    icone: 'FolderPlus',
    dica: 'Você pode criar subpastas depois para organizar ainda melhor.',
    requerAcao: true,
  },
  {
    id: 'criar-nota',
    numero: 3,
    titulo: 'Crie sua primeira nota',
    descricao:
      'Itens são o conteúdo do seu cofre. Você pode criar notas (com texto), documentos (com anexos) ou checklists (com tarefas).\n\nVamos criar uma nota de exemplo na pasta que acabamos de criar.',
    textoBotaoAcao: 'Criar nota de boas-vindas',
    icone: 'FileText',
    dica: 'Notas suportam formatação simples: **negrito**, *itálico* e listas.',
    requerAcao: true,
  },
  {
    id: 'anexar-arquivo',
    numero: 4,
    titulo: 'Anexe um arquivo',
    descricao:
      'Anexos são os protagonistas do VaultCraft! Você pode anexar qualquer tipo de arquivo: PDFs, fotos, documentos, comprovantes…\n\nExperimente arrastar um arquivo ou clique para selecionar.',
    textoBotaoAcao: 'Selecionar arquivo para anexar',
    icone: 'Paperclip',
    dica: 'Seus arquivos são copiados para dentro do cofre. O original não é alterado.',
    requerAcao: true,
  },
  {
    id: 'usar-busca',
    numero: 5,
    titulo: 'Encontre tudo em segundos',
    descricao:
      'A busca do VaultCraft é instantânea. Digite qualquer palavra e encontre itens pelo título, descrição, conteúdo ou tags.\n\nExperimente: pressione Ctrl+K e digite algo.',
    textoBotaoAcao: 'Abrir busca',
    icone: 'Search',
    dica: 'A busca funciona mesmo com milhares de itens. Rápida e precisa.',
    requerAcao: true,
  },
  {
    id: 'fazer-backup',
    numero: 6,
    titulo: 'Proteja seus dados',
    descricao:
      'O backup é sua rede de segurança. Com um clique, o VaultCraft cria um arquivo .vaultbackup com tudo: banco de dados, anexos e um manifesto de integridade.\n\nFaça seu primeiro backup agora!',
    textoBotaoAcao: 'Fazer backup agora',
    icone: 'Download',
    dica: 'Dica de ouro: salve o backup em um pendrive ou HD externo regularmente.',
    requerAcao: true,
  },
];

/** Textos auxiliares do onboarding */
export const textosOnboarding = {
  botaoPular: 'Pular tutorial',
  botaoProximo: 'Próximo',
  botaoAnterior: 'Voltar',
  botaoConcluir: 'Começar a usar!',
  botaoVerDepois: 'Ver depois',
  tituloConclusao: 'Tudo pronto!',
  descricaoConclusao:
    'Seu cofre está configurado e protegido. Agora é com você!\n\nLembre-se: você pode acessar este tutorial novamente em Configurações → "Ver tutorial novamente".',
  dicaFinal: 'Precisa de ajuda? Pressione F1 a qualquer momento.',
};
