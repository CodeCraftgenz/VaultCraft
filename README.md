# VaultCraft

**Seu cofre pessoal, 100% offline.**

VaultCraft é um aplicativo desktop para Windows que permite organizar documentos importantes, notas e checklists do dia a dia com anexos, busca instantânea, controle de vencimentos, backup/restauração blindados e privacidade total — sem nuvem.

## Visão Geral

- **100% Offline**: nenhuma conexão com internet. Seus dados nunca saem do seu computador.
- **Documentos + Anexos**: anexe qualquer arquivo (PDF, imagens, etc.) aos seus itens.
- **Busca Instantânea**: encontre tudo em segundos com busca full-text (SQLite FTS5).
- **Checklists**: organize tarefas do dia a dia com progresso visual.
- **Vencimentos**: nunca perca um prazo — acompanhe seguros, contratos, validades.
- **Backup 1-Clique**: proteja seus dados com backups blindados (.vaultbackup).
- **Pacotes Vault**: exporte pastas como pacotes portáteis para pendrive.
- **Privacidade Total**: sem telemetria, sem analytics, sem nuvem.

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Desktop Framework | Tauri 2 |
| Frontend | React 18 + TypeScript |
| Estilização | Tailwind CSS |
| Estado | Zustand |
| Backend | Rust |
| Banco de Dados | SQLite (rusqlite) |
| Busca | SQLite FTS5 |
| Empacotamento | ZIP (.vaultbackup) |

## Pré-requisitos

- **Node.js** 18+ (recomendado: 20 LTS)
- **Rust** (via rustup): https://rustup.rs
- **Visual Studio Build Tools** (C++ desktop workload)
- **WebView2** (já incluso no Windows 10/11)

## Desenvolvimento

```bash
# 1. Clonar o repositório
git clone <url> VaultCraft
cd VaultCraft

# 2. Instalar dependências do frontend
npm install

# 3. Rodar em modo desenvolvimento
npm run tauri dev
```

O app abrirá automaticamente. O Vite faz hot-reload do frontend e o Tauri recompila o Rust quando necessário.

## Build de Produção

```bash
# Gerar executável e instaladores
npm run tauri build
```

Os artefatos ficam em `src-tauri/target/release/bundle/`:
- `.exe` — Executável direto
- `nsis/` — Instalador NSIS
- `msi/` — Instalador MSI

## Estrutura do Projeto

```
VaultCraft/
├── src/                          # Frontend React
│   ├── app/                      # Configuração do app
│   ├── components/               # Componentes reutilizáveis
│   │   ├── ui/                   # Primitivos (Botao, Campo, Dialogo, etc.)
│   │   └── layout/               # Layout (PainelLateral, BarraSuperior)
│   ├── domain/                   # Modelos de domínio (TypeScript)
│   ├── stores/                   # Zustand stores
│   ├── hooks/                    # React hooks customizados
│   ├── pages/                    # Páginas/telas do app
│   ├── infra/                    # Adaptadores (chamadas Tauri)
│   ├── help/                     # Conteúdo de ajuda embutido
│   └── onboarding/               # Sistema de onboarding
├── src-tauri/                    # Backend Rust
│   ├── src/
│   │   ├── commands/             # Tauri commands (API interna)
│   │   ├── services/             # Serviços de negócio
│   │   ├── db/                   # Banco de dados e migrações
│   │   │   └── migrations/       # Arquivos SQL
│   │   ├── storage/              # Gerenciamento de arquivos
│   │   └── crypto/               # Criptografia e hashing
│   ├── tauri.conf.json           # Configuração do Tauri
│   └── Cargo.toml                # Dependências Rust
├── tests/                        # Testes
├── public/                       # Assets estáticos
└── scripts/                      # Scripts auxiliares
```

## Onde ficam os dados

Em produção, os dados ficam no diretório do app:

```
%APPDATA%/com.vaultcraft.app/
├── banco.sqlite          # Banco de dados SQLite
├── banco.sqlite-wal      # Write-Ahead Log
└── storage/
    └── anexos/           # Arquivos anexados
        └── {id}/         # Pasta por anexo
            └── arquivo   # Arquivo original
```

## Backup

O arquivo `.vaultbackup` é um ZIP contendo:
- `banco.sqlite` — Cópia do banco de dados
- `anexos/` — Todos os arquivos anexados
- `manifesto.json` — Metadados (versão, hashes, contagens)

## Roadmap

### v0.1 (MVP) — Atual
- CRUD de pastas, itens (nota/documento/checklist), tags
- Anexos (adicionar/remover/abrir)
- Busca FTS5
- Vencimentos (lista básica)
- Backup e Restore com manifesto
- Pacotes Vault (export/import de pasta)
- Auditoria e histórico
- Ajuda embutida com busca
- Onboarding de primeira execução
- PIN básico (hash + salt)
- Tema claro/escuro

### v0.2 (Pro)
- Criptografia robusta (SQLCipher ou banco inteiro)
- Chaves protegidas via Windows DPAPI
- Melhor gestão de pacotes
- Exportação PDF nativa
- Melhorias de UI/UX
- Backup incremental

### v1.0 (Estável)
- Otimizações de desempenho
- Acessibilidade aprimorada
- Importadores (CSV)
- Polimento visual completo
- Testes abrangentes

## Limpando dados de desenvolvimento

```bash
# Remover banco e anexos de teste (CUIDADO: irreversível)
# O diretório varia conforme o ambiente:
# Dev: pasta do projeto (quando executado com tauri dev)
# Prod: %APPDATA%/com.vaultcraft.app/

# Para limpar em dev, basta remover:
del banco.sqlite
rmdir /s storage
```

## Licença

Uso pessoal. Todos os direitos reservados.
