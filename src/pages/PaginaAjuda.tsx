// ============================================================
// VaultCraft - Pagina de Ajuda (TELA-10)
// Documentacao embutida com indice de topicos e busca
// ============================================================

import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  HelpCircle,
  Search,
  Book,
  FolderOpen,
  FileText,
  Shield,
  HardDrive,
  Package,
  Settings,
  Keyboard,
  ChevronRight,
} from 'lucide-react';
import { Campo } from '@/components/ui/Campo';

// ========================
// Conteudo de Ajuda Embutido
// ========================

interface TopicoAjuda {
  id: string;
  titulo: string;
  icone: React.ReactNode;
  conteudo: string;
}

const topicosAjuda: TopicoAjuda[] = [
  {
    id: 'inicio',
    titulo: 'Primeiros passos',
    icone: <Book size={18} />,
    conteudo: `# Bem-vindo ao VaultCraft

O **VaultCraft** e seu cofre pessoal para organizar documentos, notas e checklists de forma segura e offline.

## Como comecar

1. **Crie uma pasta** clicando no botao "+" no painel lateral
2. **Adicione itens** dentro da pasta: notas, documentos ou checklists
3. **Organize** com tags e defina datas de vencimento
4. **Faca backup** regularmente para proteger seus dados

## Tipos de itens

- **Notas**: Textos livres, ideais para anotacoes e lembretes
- **Documentos**: Para referenciar arquivos importantes com anexos
- **Checklists**: Listas de tarefas com marcacao de conclusao
`,
  },
  {
    id: 'pastas',
    titulo: 'Pastas e organizacao',
    icone: <FolderOpen size={18} />,
    conteudo: `# Pastas e Organizacao

## Criar pastas

Use o botao **"+"** ao lado do titulo "Pastas" no painel lateral para criar uma nova pasta.

## Estrutura de arvore

As pastas podem conter subpastas, permitindo uma organizacao hierarquica dos seus itens.

## Acoes disponiveis

- **Renomear**: Clique com o botao direito na pasta
- **Mover**: Arraste uma pasta para dentro de outra
- **Excluir**: Remove a pasta e todo o seu conteudo

> **Atencao**: Ao excluir uma pasta, todos os itens e subpastas dentro dela tambem serao removidos.
`,
  },
  {
    id: 'itens',
    titulo: 'Itens e conteudo',
    icone: <FileText size={18} />,
    conteudo: `# Itens e Conteudo

## Criar um item

1. Selecione uma pasta no painel lateral
2. Clique no botao **"Novo item"**
3. Escolha o tipo: Nota, Documento ou Checklist
4. Preencha os dados e salve

## Editar um item

Selecione o item na lista e clique em **"Editar"** na barra de acoes.

## Tags

Adicione tags coloridas para categorizar seus itens e facilitar a busca.

## Vencimento

Defina uma data de vencimento para ser alertado sobre prazos importantes.

## Anexos

Adicione arquivos ao item clicando em **"Anexar"**. Os anexos sao armazenados localmente no cofre.
`,
  },
  {
    id: 'seguranca',
    titulo: 'Seguranca',
    icone: <Shield size={18} />,
    conteudo: `# Seguranca

## PIN de Acesso

Configure um PIN em **Configuracoes > PIN de Acesso** para proteger a abertura do cofre.

## Criptografia

Ative a criptografia em **Configuracoes > Criptografia** para que seus dados sejam armazenados de forma criptografada.

## Dados locais

Todos os seus dados sao armazenados **localmente** no seu computador. O VaultCraft nao envia nenhuma informacao para a internet.

## Boas praticas

- Faca backups regulares
- Use um PIN forte (minimo 4 digitos)
- Ative a criptografia para dados sensiveis
- Mantenha seu backup em um local seguro (HD externo, pendrive)
`,
  },
  {
    id: 'backup',
    titulo: 'Backup e restauracao',
    icone: <HardDrive size={18} />,
    conteudo: `# Backup e Restauracao

## Criar backup

1. Va em **Backup** no menu lateral
2. Clique em **"Criar backup agora"**
3. O arquivo sera salvo no local padrao

O backup inclui todos os seus itens, pastas, anexos, tags e configuracoes.

## Restaurar backup

1. Va em **Backup** no menu lateral
2. Clique em **"Selecionar arquivo de backup"**
3. Escolha o arquivo de backup (.vaultbak)
4. Aguarde a restauracao

> **Importante**: A restauracao substitui todos os dados atuais. Faca um backup antes de restaurar.
`,
  },
  {
    id: 'pacotes',
    titulo: 'Pacotes',
    icone: <Package size={18} />,
    conteudo: `# Pacotes do Cofre

## O que sao pacotes?

Pacotes permitem exportar e importar pastas individuais, facilitando o compartilhamento e transferencia de conteudo.

## Exportar pacote

1. Va em **Pacotes** no menu lateral
2. Selecione a pasta a exportar
3. Clique em **"Exportar pacote"**

## Importar pacote

1. Va em **Pacotes** no menu lateral
2. Escolha a pasta de destino (opcional)
3. Clique em **"Selecionar e importar pacote"**

## Conflitos

Se um item ja existir no cofre, a versao mais recente sera mantida automaticamente.
`,
  },
  {
    id: 'configuracoes',
    titulo: 'Configuracoes',
    icone: <Settings size={18} />,
    conteudo: `# Configuracoes

## Aparencia

Escolha entre os temas **Claro**, **Escuro** ou **Sistema** (segue a preferencia do sistema operacional).

## PIN de Acesso

Configure um codigo PIN para proteger a abertura do cofre.

## Criptografia

Ative ou desative a criptografia local dos dados.

## Manutencao

Use **"Compactar banco de dados"** periodicamente para otimizar o espaco em disco e a performance.

## Tutorial

Clique em **"Ver tutorial novamente"** para rever a introducao do VaultCraft.
`,
  },
  {
    id: 'atalhos',
    titulo: 'Atalhos de teclado',
    icone: <Keyboard size={18} />,
    conteudo: `# Atalhos de Teclado

| Atalho | Acao |
|--------|------|
| **Ctrl + K** | Focar na busca |
| **Ctrl + N** | Novo item |
| **Ctrl + B** | Ir para backup |
| **F1** | Abrir ajuda |
| **Escape** | Fechar dialogo / Cancelar edicao |

## Dicas

- Use **Ctrl + K** para buscar rapidamente qualquer item no cofre
- Os atalhos funcionam em qualquer pagina da aplicacao
`,
  },
];

// ========================
// Pagina de Ajuda
// ========================

export const PaginaAjuda: React.FC = () => {
  const [topicoAtivo, setTopicoAtivo] = useState(topicosAjuda[0].id);
  const [termoBusca, setTermoBusca] = useState('');

  const topicosFiltrados = useMemo(() => {
    if (!termoBusca.trim()) return topicosAjuda;
    const termoLower = termoBusca.toLowerCase();
    return topicosAjuda.filter(
      (t) =>
        t.titulo.toLowerCase().includes(termoLower) ||
        t.conteudo.toLowerCase().includes(termoLower)
    );
  }, [termoBusca]);

  const topicoSelecionado =
    topicosAjuda.find((t) => t.id === topicoAtivo) ?? topicosAjuda[0];

  return (
    <div className="flex h-full">
      {/* Indice lateral */}
      <aside className="w-64 border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
            <HelpCircle size={18} className="text-cofre-500" />
            Ajuda
          </h3>
          <Campo
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            placeholder="Buscar na ajuda..."
            icone={<Search size={14} />}
          />
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {topicosFiltrados.map((topico) => (
            <button
              key={topico.id}
              onClick={() => setTopicoAtivo(topico.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-2.5 text-sm
                transition-colors duration-100
                ${
                  topicoAtivo === topico.id
                    ? 'bg-cofre-50 text-cofre-700 dark:bg-cofre-950/50 dark:text-cofre-400 border-r-2 border-cofre-500'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }
              `}
            >
              <span className="flex-shrink-0">{topico.icone}</span>
              <span className="truncate">{topico.titulo}</span>
              <ChevronRight size={14} className="ml-auto flex-shrink-0 opacity-30" />
            </button>
          ))}

          {topicosFiltrados.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6 px-4">
              Nenhum topico encontrado para "{termoBusca}".
            </p>
          )}
        </nav>
      </aside>

      {/* Conteudo do topico */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto">
          <article className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-600 dark:prose-p:text-gray-400 prose-strong:text-gray-900 dark:prose-strong:text-gray-200 prose-a:text-cofre-600 dark:prose-a:text-cofre-400">
            <ReactMarkdown>{topicoSelecionado.conteudo}</ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  );
};
