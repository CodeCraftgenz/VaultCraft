-- ============================================================================
-- VaultCraft - Migration 001: Schema Inicial
-- ============================================================================
-- Descricao: Criacao completa do schema do banco de dados SQLite para o
--            VaultCraft, um cofre pessoal offline para organizar documentos,
--            notas e checklists.
--
-- Autor: VaultCraft Team
-- Data: 2026-02-17
-- Versao: 1
-- ============================================================================

-- ============================================================================
-- PRAGMAS DE SEGURANCA E PERFORMANCE
-- ============================================================================
-- Habilita chaves estrangeiras, que no SQLite sao desabilitadas por padrao.
-- Sem isso, as constraints de FK nao seriam verificadas.
PRAGMA foreign_keys = ON;

-- WAL (Write-Ahead Logging) oferece melhor concorrencia de leitura/escrita
-- e melhor performance para aplicacoes desktop.
PRAGMA journal_mode = WAL;

-- ============================================================================
-- TABELA: pastas (Folders)
-- ============================================================================
-- Estrutura hierarquica de pastas para organizar os itens do cofre.
-- Usa TEXT como PK para permitir UUIDs gerados no lado da aplicacao (Rust),
-- garantindo unicidade sem depender de auto-increment e facilitando
-- eventual sincronizacao futura.
-- O campo 'caminho' armazena o caminho completo da pasta na hierarquia
-- (ex: "/Pessoal/Financeiro") para facilitar consultas e exibicao na UI.
-- pasta_pai_id permite a construcao de arvore de pastas com profundidade
-- ilimitada, usando referencia recursiva.
CREATE TABLE IF NOT EXISTS pastas (
    id            TEXT    NOT NULL PRIMARY KEY,
    pasta_pai_id  TEXT,
    nome          TEXT    NOT NULL,
    caminho       TEXT    NOT NULL,
    criado_em     TEXT    NOT NULL,
    atualizado_em TEXT    NOT NULL,

    FOREIGN KEY (pasta_pai_id) REFERENCES pastas(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ============================================================================
-- TABELA: itens (Items)
-- ============================================================================
-- Tabela central do sistema. Cada item representa uma nota, documento ou
-- checklist dentro de uma pasta.
--
-- Decisoes de design:
-- - 'tipo' usa CHECK constraint para garantir integridade no nivel do banco,
--   restringindo aos tres tipos suportados pela aplicacao.
-- - 'conteudo_nota' armazena Markdown para notas, permitindo formatacao
--   rica sem dependencia de HTML. Para documentos e checklists, pode ser
--   NULL ou conter texto auxiliar.
-- - 'data_vencimento' e nullable porque nem todo item tem prazo (ex: notas
--   pessoais nao vencem, mas um documento pode ter validade).
-- - 'descricao' e um resumo curto para exibicao em listagens sem precisar
--   carregar o conteudo completo.
CREATE TABLE IF NOT EXISTS itens (
    id               TEXT    NOT NULL PRIMARY KEY,
    pasta_id         TEXT    NOT NULL,
    tipo             TEXT    NOT NULL CHECK(tipo IN ('nota', 'documento', 'checklist')),
    titulo           TEXT    NOT NULL,
    descricao        TEXT,
    conteudo_nota    TEXT,
    data_vencimento  TEXT,
    criado_em        TEXT    NOT NULL,
    atualizado_em    TEXT    NOT NULL,

    FOREIGN KEY (pasta_id) REFERENCES pastas(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ============================================================================
-- TABELA: tags
-- ============================================================================
-- Sistema de etiquetas para categorizar itens transversalmente, independente
-- da estrutura de pastas. Permite ao usuario criar taxonomias flexiveis.
--
-- Decisoes de design:
-- - 'nome' e UNIQUE para evitar tags duplicadas (ex: dois "Urgente").
-- - 'cor' armazena a cor em formato hexadecimal (ex: "#FF5733") para
--   personalizacao visual na UI.
CREATE TABLE IF NOT EXISTS tags (
    id        TEXT    NOT NULL PRIMARY KEY,
    nome      TEXT    NOT NULL UNIQUE,
    cor       TEXT,
    criado_em TEXT    NOT NULL
);

-- ============================================================================
-- TABELA: item_tags (Relacao N:N entre itens e tags)
-- ============================================================================
-- Tabela de juncao para o relacionamento muitos-para-muitos entre itens
-- e tags. Um item pode ter varias tags e uma tag pode estar em varios itens.
--
-- Decisoes de design:
-- - PK composta (item_id, tag_id) impede duplicacao da mesma tag no mesmo item.
-- - ON DELETE CASCADE em ambas as FKs garante que, ao excluir um item ou tag,
--   as associacoes sejam limpas automaticamente.
CREATE TABLE IF NOT EXISTS item_tags (
    item_id TEXT NOT NULL,
    tag_id  TEXT NOT NULL,

    PRIMARY KEY (item_id, tag_id),

    FOREIGN KEY (item_id) REFERENCES itens(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ============================================================================
-- TABELA: anexos (Attachments)
-- ============================================================================
-- Armazena metadados de arquivos anexados a itens ou tarefas de checklist.
-- Os arquivos em si ficam no sistema de arquivos local (gerenciados pelo Rust),
-- nao no banco de dados, para manter o SQLite leve e performatico.
--
-- Decisoes de design:
-- - Tanto 'item_id' quanto 'tarefa_id' sao nullable para permitir que um
--   anexo esteja vinculado a um item OU a uma tarefa especifica de checklist.
--   Na pratica, pelo menos um dos dois deve ser preenchido (validado na app).
-- - 'caminho_interno' e o caminho relativo dentro do diretorio de dados do
--   VaultCraft, nao o caminho original do usuario.
-- - 'hash_sha256' permite verificar integridade do arquivo e detectar
--   duplicatas, importante para um cofre que preza por seguranca.
-- - 'tamanho' em bytes para controle de espaco e exibicao na UI.
-- - 'tipo_mime' para determinar como exibir/abrir o arquivo.
CREATE TABLE IF NOT EXISTS anexos (
    id              TEXT    NOT NULL PRIMARY KEY,
    item_id         TEXT,
    tarefa_id       TEXT,
    nome_original   TEXT    NOT NULL,
    caminho_interno TEXT    NOT NULL,
    tamanho         INTEGER NOT NULL,
    tipo_mime       TEXT    NOT NULL,
    hash_sha256     TEXT    NOT NULL,
    criado_em       TEXT    NOT NULL,

    FOREIGN KEY (item_id) REFERENCES itens(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    FOREIGN KEY (tarefa_id) REFERENCES tarefas_checklist(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ============================================================================
-- TABELA: tarefas_checklist (Checklist Tasks)
-- ============================================================================
-- Tarefas individuais pertencentes a itens do tipo 'checklist'.
-- Cada checklist pode ter N tarefas ordenadas.
--
-- Decisoes de design:
-- - 'concluida' usa INTEGER (0/1) porque SQLite nao tem tipo BOOLEAN nativo.
--   0 = pendente, 1 = concluida.
-- - 'ordem' permite reordenacao via drag-and-drop na UI, usando inteiros
--   para facilitar a ordenacao (ex: 1, 2, 3...). Em caso de reordenacao,
--   a aplicacao atualiza os valores de ordem.
-- - ON DELETE CASCADE garante que, ao excluir um item/checklist, todas as
--   suas tarefas sejam removidas automaticamente.
CREATE TABLE IF NOT EXISTS tarefas_checklist (
    id            TEXT    NOT NULL PRIMARY KEY,
    item_id       TEXT    NOT NULL,
    titulo        TEXT    NOT NULL,
    concluida     INTEGER NOT NULL DEFAULT 0,
    ordem         INTEGER NOT NULL,
    criado_em     TEXT    NOT NULL,
    atualizado_em TEXT    NOT NULL,

    FOREIGN KEY (item_id) REFERENCES itens(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ============================================================================
-- TABELA: log_auditoria (Audit Log)
-- ============================================================================
-- Registro imutavel de todas as acoes relevantes no sistema.
-- Fundamental para um cofre pessoal: o usuario pode rastrear quem/quando
-- acessou ou modificou seus dados.
--
-- Decisoes de design:
-- - Nenhuma FK para evitar problemas com CASCADE: se uma entidade for
--   excluida, o log de auditoria deve permanecer intacto.
-- - 'detalhes' armazena JSON com informacoes adicionais do evento, permitindo
--   flexibilidade sem alterar o schema (ex: {"campo":"titulo","de":"X","para":"Y"}).
-- - 'tipo_evento' exemplos: 'CRIAR', 'ATUALIZAR', 'EXCLUIR', 'ABRIR',
--   'EXPORTAR', 'LOGIN', 'LOGOUT'.
-- - 'entidade_tipo' exemplos: 'pasta', 'item', 'tag', 'anexo', 'tarefa'.
-- - Esta tabela e append-only: registros nunca devem ser atualizados ou
--   excluidos pela aplicacao.
CREATE TABLE IF NOT EXISTS log_auditoria (
    id             TEXT NOT NULL PRIMARY KEY,
    tipo_evento    TEXT NOT NULL,
    entidade_tipo  TEXT NOT NULL,
    entidade_id    TEXT NOT NULL,
    detalhes       TEXT,
    criado_em      TEXT NOT NULL
);

-- ============================================================================
-- TABELA: configuracoes (Settings)
-- ============================================================================
-- Armazena configuracoes da aplicacao como pares chave-valor.
-- Abordagem simples e flexivel que permite adicionar novas configuracoes
-- sem alterar o schema.
--
-- Decisoes de design:
-- - 'chave' como PK garante unicidade e acesso direto O(1) via indice.
-- - 'valor' como TEXT generico: a aplicacao (Rust) e responsavel por
--   converter para o tipo apropriado (bool, int, etc).
-- - 'atualizado_em' para rastrear quando cada configuracao foi alterada.
CREATE TABLE IF NOT EXISTS configuracoes (
    chave         TEXT NOT NULL PRIMARY KEY,
    valor         TEXT,
    atualizado_em TEXT NOT NULL
);

-- ============================================================================
-- TABELA VIRTUAL FTS5: itens_fts (Full-Text Search)
-- ============================================================================
-- Tabela virtual FTS5 para busca textual completa nos itens do cofre.
-- Permite ao usuario encontrar rapidamente qualquer nota, documento ou
-- checklist pelo titulo, descricao ou conteudo.
--
-- Decisoes de design:
-- - Usamos FTS5 standalone (nao external content) para simplicidade e
--   confiabilidade. A sincronizacao com a tabela 'itens' e mantida via
--   triggers (INSERT, UPDATE, DELETE).
-- - Armazenamos o 'id' do item como coluna nao-indexada para poder vincular
--   os resultados da busca de volta ao item original.
-- - tokenize='unicode61' garante suporte correto a caracteres acentuados
--   do portugues (ex: "financas", "relatorio", "acoes").
CREATE VIRTUAL TABLE IF NOT EXISTS itens_fts USING fts5(
    titulo,
    descricao,
    conteudo_nota,
    id UNINDEXED,
    tokenize='unicode61'
);

-- ============================================================================
-- TRIGGERS: Sincronizacao da tabela FTS com a tabela 'itens'
-- ============================================================================

-- Trigger AFTER INSERT: quando um novo item e criado, insere seus dados
-- textuais na tabela FTS para que fique imediatamente pesquisavel.
CREATE TRIGGER IF NOT EXISTS trg_itens_fts_insert
AFTER INSERT ON itens
BEGIN
    INSERT INTO itens_fts (titulo, descricao, conteudo_nota, id)
    VALUES (NEW.titulo, NEW.descricao, NEW.conteudo_nota, NEW.id);
END;

-- Trigger AFTER UPDATE: quando um item e atualizado, remove a entrada antiga
-- da FTS e insere a nova. Isso e necessario porque FTS5 nao suporta UPDATE
-- direto em tabelas standalone; a abordagem correta e DELETE + INSERT.
CREATE TRIGGER IF NOT EXISTS trg_itens_fts_update
AFTER UPDATE ON itens
BEGIN
    DELETE FROM itens_fts WHERE id = OLD.id;
    INSERT INTO itens_fts (titulo, descricao, conteudo_nota, id)
    VALUES (NEW.titulo, NEW.descricao, NEW.conteudo_nota, NEW.id);
END;

-- Trigger AFTER DELETE: quando um item e excluido, remove seus dados da FTS
-- para manter a consistencia e evitar resultados fantasma nas buscas.
CREATE TRIGGER IF NOT EXISTS trg_itens_fts_delete
AFTER DELETE ON itens
BEGIN
    DELETE FROM itens_fts WHERE id = OLD.id;
END;

-- ============================================================================
-- INDICES
-- ============================================================================
-- Indices criados para otimizar as consultas mais frequentes da aplicacao.
-- Cada indice foi escolhido com base nos padroes de acesso esperados.

-- Indice para listar itens de uma pasta (tela principal da aplicacao).
-- Consulta esperada: SELECT * FROM itens WHERE pasta_id = ?
CREATE INDEX IF NOT EXISTS idx_itens_pasta_id
    ON itens(pasta_id);

-- Indice para filtrar itens por tipo (nota, documento, checklist).
-- Consulta esperada: SELECT * FROM itens WHERE tipo = ?
CREATE INDEX IF NOT EXISTS idx_itens_tipo
    ON itens(tipo);

-- Indice para buscar itens com vencimento proximo (alertas e notificacoes).
-- Consulta esperada: SELECT * FROM itens WHERE data_vencimento <= ? AND data_vencimento IS NOT NULL
CREATE INDEX IF NOT EXISTS idx_itens_vencimento
    ON itens(data_vencimento);

-- Indice para ordenar itens por data de criacao (listagem cronologica).
-- Consulta esperada: SELECT * FROM itens ORDER BY criado_em DESC
CREATE INDEX IF NOT EXISTS idx_itens_criado_em
    ON itens(criado_em);

-- Indice para ordenar itens por data de atualizacao (itens recentes).
-- Consulta esperada: SELECT * FROM itens ORDER BY atualizado_em DESC
CREATE INDEX IF NOT EXISTS idx_itens_atualizado_em
    ON itens(atualizado_em);

-- Indice para listar anexos de um item especifico.
-- Consulta esperada: SELECT * FROM anexos WHERE item_id = ?
CREATE INDEX IF NOT EXISTS idx_anexos_item_id
    ON anexos(item_id);

-- Indice para listar anexos de uma tarefa especifica de checklist.
-- Consulta esperada: SELECT * FROM anexos WHERE tarefa_id = ?
CREATE INDEX IF NOT EXISTS idx_anexos_tarefa_id
    ON anexos(tarefa_id);

-- Indice para listar tarefas de um checklist (carregamento do checklist).
-- Consulta esperada: SELECT * FROM tarefas_checklist WHERE item_id = ? ORDER BY ordem
CREATE INDEX IF NOT EXISTS idx_tarefas_item_id
    ON tarefas_checklist(item_id);

-- Indice para filtrar logs por tipo de evento (ex: listar todas as exclusoes).
-- Consulta esperada: SELECT * FROM log_auditoria WHERE tipo_evento = ?
CREATE INDEX IF NOT EXISTS idx_log_tipo
    ON log_auditoria(tipo_evento);

-- Indice para filtrar logs por data (ex: auditoria de um periodo especifico).
-- Consulta esperada: SELECT * FROM log_auditoria WHERE criado_em BETWEEN ? AND ?
CREATE INDEX IF NOT EXISTS idx_log_criado
    ON log_auditoria(criado_em);

-- Indice para listar subpastas de uma pasta pai (navegacao na arvore de pastas).
-- Consulta esperada: SELECT * FROM pastas WHERE pasta_pai_id = ?
CREATE INDEX IF NOT EXISTS idx_pastas_pai
    ON pastas(pasta_pai_id);
