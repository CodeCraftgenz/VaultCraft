-- ============================================================================
-- VaultCraft - Migration 002: Dados Iniciais (Seed Data)
-- ============================================================================
-- Descricao: Insere as configuracoes padrao necessarias para o primeiro uso
--            da aplicacao. Estas configuracoes definem o estado inicial do
--            VaultCraft antes de qualquer interacao do usuario.
--
-- Autor: VaultCraft Team
-- Data: 2026-02-17
-- Versao: 1
-- ============================================================================

-- ============================================================================
-- CONFIGURACOES PADRAO
-- ============================================================================
-- Inserimos as configuracoes com valores padrao seguros e conservadores.
-- A aplicacao (Rust) lera estes valores na inicializacao e permitira que
-- o usuario os altere via tela de configuracoes.
--
-- Usamos INSERT OR IGNORE para garantir idempotencia: se a migration for
-- executada mais de uma vez (por seguranca), nao causara erro nem sobrescrever
-- valores que o usuario ja tenha alterado.

-- Tema visual da aplicacao.
-- Valor padrao: 'claro' (light mode).
-- Opcoes previstas: 'claro', 'escuro', 'sistema' (segue o tema do SO).
-- Razao: a maioria dos usuarios espera light mode como padrao; dark mode
-- pode ser habilitado nas configuracoes.
INSERT OR IGNORE INTO configuracoes (chave, valor, atualizado_em)
VALUES ('tema', 'claro', datetime('now'));

-- Protecao por PIN.
-- Valor padrao: 'false' (desabilitado).
-- Quando habilitado, a aplicacao solicita um PIN ao abrir, adicionando
-- uma camada extra de seguranca para o cofre pessoal.
-- O PIN em si e armazenado de forma segura (hash) em outro local,
-- nao nesta tabela de configuracoes.
INSERT OR IGNORE INTO configuracoes (chave, valor, atualizado_em)
VALUES ('pin_habilitado', 'false', datetime('now'));

-- Criptografia dos dados.
-- Valor padrao: 'false' (desabilitada).
-- Quando habilitada, os conteudos sensiveis (notas, anexos) sao criptografados
-- em repouso usando a chave derivada da senha mestra do usuario.
-- Comeca desabilitada para nao impor complexidade no primeiro uso;
-- o onboarding pode sugerir a ativacao.
INSERT OR IGNORE INTO configuracoes (chave, valor, atualizado_em)
VALUES ('criptografia_habilitada', 'false', datetime('now'));

-- Status do onboarding (primeira experiencia do usuario).
-- Valor padrao: 'false' (nao concluido).
-- Quando o usuario completa o fluxo de onboarding (criar primeira pasta,
-- configurar PIN, etc.), este valor e alterado para 'true'.
-- A aplicacao verifica este valor na inicializacao para decidir se exibe
-- o fluxo de boas-vindas ou a tela principal.
INSERT OR IGNORE INTO configuracoes (chave, valor, atualizado_em)
VALUES ('onboarding_concluido', 'false', datetime('now'));

-- Versao do schema do banco de dados.
-- Valor padrao: '1' (primeira versao).
-- Utilizado pela aplicacao para determinar se migrations adicionais
-- precisam ser executadas ao atualizar o app. Comparado com a versao
-- mais recente disponivel no codigo para decidir quais migrations aplicar.
INSERT OR IGNORE INTO configuracoes (chave, valor, atualizado_em)
VALUES ('versao_schema', '1', datetime('now'));

-- ============================================================================
-- NOTA SOBRE PASTAS INICIAIS
-- ============================================================================
-- Nenhuma pasta padrao e criada propositalmente.
-- O usuario cria suas proprias pastas durante o onboarding ou no primeiro uso.
-- Isso respeita a filosofia do VaultCraft: o cofre e verdadeiramente pessoal,
-- e a estrutura organizacional deve refletir as necessidades do usuario,
-- nao uma estrutura pre-definida pelo sistema.
--
-- Caso futuramente seja decidido criar pastas padrao (ex: "Documentos",
-- "Notas Pessoais"), basta adicionar uma nova migration (003_...) com
-- os INSERTs necessarios. Nunca alterar migrations ja aplicadas.
