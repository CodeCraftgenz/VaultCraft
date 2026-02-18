# VaultCraft

**Seu cofre pessoal, 100% offline.**

VaultCraft e um aplicativo desktop para Windows que permite organizar documentos importantes, notas e checklists com anexos, busca instantanea, controle de vencimentos, backup/restauracao e privacidade total — sem nuvem, sem telemetria, sem internet.

## Funcionalidades

| Recurso | Descricao |
|---------|-----------|
| **Pastas hierarquicas** | Organize tudo em pastas e subpastas com profundidade ilimitada |
| **3 tipos de item** | Notas (Markdown), Documentos (com anexos) e Checklists (tarefas) |
| **Tags coloridas** | Categorize itens com etiquetas personalizaveis |
| **Anexos** | Adicione qualquer arquivo (PDF, imagens, etc.) aos itens |
| **Busca FTS5** | Busca full-text instantanea em titulo, descricao e conteudo |
| **Vencimentos** | Acompanhe prazos de seguros, contratos e validades |
| **Backup 1-clique** | Backups blindados em formato `.vaultbackup` (ZIP) |
| **Pacotes Vault** | Exporte pastas como pacotes portaveis para pendrive |
| **Exportacao** | Exporte itens como HTML/PDF ou listas como CSV |
| **Auditoria** | Historico completo de todas as acoes no cofre |
| **Tema claro/escuro** | Suporte a tema do sistema, claro ou escuro |
| **Licenciamento** | Ativacao por e-mail com verificacao de hardware |
| **100% Offline** | Nenhuma conexao com internet apos ativacao da licenca |

## Stack Tecnologica

| Camada | Tecnologia |
|--------|-----------|
| Desktop Framework | [Tauri 2](https://tauri.app) |
| Frontend | React 18 + TypeScript |
| Estilizacao | Tailwind CSS |
| Estado | Zustand |
| Backend | Rust |
| Banco de Dados | SQLite (rusqlite, bundled) |
| Busca | SQLite FTS5 |
| Icones | Lucide React |
| Animacoes | Framer Motion |
| HTTP (licenca) | Reqwest |
| Instalador | Inno Setup 6 |

## Pre-requisitos

- **Node.js** 18+ (recomendado: 20 LTS)
- **Rust** (via [rustup](https://rustup.rs))
- **Visual Studio Build Tools** (C++ desktop workload)
- **WebView2** (ja incluso no Windows 10/11)
- **Inno Setup 6** (opcional, para gerar instalador customizado)

## Desenvolvimento

```bash
# 1. Clonar o repositorio
git clone https://github.com/CodeCraftgenz/VaultCraft.git
cd VaultCraft

# 2. Instalar dependencias do frontend
npm install

# 3. Rodar em modo desenvolvimento
npm run tauri dev
```

O app abrira automaticamente. O Vite faz hot-reload do frontend e o Tauri recompila o Rust quando necessario.

## Build de Producao

```bash
# Gerar executavel e instaladores
npm run tauri build
```

Artefatos gerados em `src-tauri/target/release/bundle/`:
- `vaultcraft.exe` — Executavel direto
- `nsis/VaultCraft_x.x.x_x64-setup.exe` — Instalador NSIS
- `msi/VaultCraft_x.x.x_x64_en-US.msi` — Instalador MSI

### Instalador Inno Setup (customizado)

```bash
# Requer Inno Setup 6 instalado
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer\vaultcraft.iss
```

Saida: `installer\Output\VaultCraft-Setup-1.0.0.exe`

## Estrutura do Projeto

```
VaultCraft/
├── src/                              # Frontend React + TypeScript
│   ├── App.tsx                       # Componente principal (license gate, router, onboarding)
│   ├── main.tsx                      # Ponto de entrada React DOM
│   ├── index.css                     # Estilos globais + Tailwind
│   ├── domain/                       # Modelos de dominio
│   │   ├── modelos.ts                # Todas as interfaces (Pasta, Item, Tag, etc.)
│   │   └── license.ts                # Interface LicenseStatus
│   ├── infra/                        # Camada de infraestrutura
│   │   └── comandos.ts               # Wrappers para todos os commands Tauri
│   ├── stores/                       # Zustand stores (estado global)
│   │   ├── appStore.ts               # Navegacao, tema, loading, onboarding
│   │   ├── pastasStore.ts            # CRUD de pastas
│   │   ├── itensStore.ts             # CRUD de itens
│   │   ├── tagsStore.ts              # CRUD de tags
│   │   ├── buscaStore.ts             # Busca full-text
│   │   ├── vencimentosStore.ts       # Vencimentos proximos/atrasados
│   │   ├── configuracoesStore.ts     # Configuracoes do app
│   │   └── licenseStore.ts           # Verificacao e ativacao de licenca
│   ├── pages/                        # Paginas/telas do app
│   │   ├── PaginaInicial.tsx         # Tela principal (lista de itens)
│   │   ├── PaginaItem.tsx            # Editor de item (nota/doc/checklist)
│   │   ├── PaginaBusca.tsx           # Busca com filtros avancados
│   │   ├── PaginaVencimentos.tsx     # Tracker de vencimentos
│   │   ├── PaginaBackup.tsx          # Backup e restauracao
│   │   ├── PaginaPacotes.tsx         # Import/export de pacotes
│   │   ├── PaginaHistorico.tsx       # Log de auditoria
│   │   ├── PaginaConfiguracoes.tsx   # Configuracoes (tema, PIN, cripto)
│   │   └── PaginaAjuda.tsx           # Ajuda embutida
│   ├── components/                   # Componentes reutilizaveis
│   │   ├── ui/                       # Primitivos (Botao, Campo, Dialogo, Toast, etc.)
│   │   ├── layout/                   # Layout (PainelLateral, BarraSuperior, LayoutPrincipal)
│   │   └── license/                  # Tela de login/ativacao de licenca
│   ├── hooks/                        # React hooks
│   │   ├── useAtalhos.ts             # Atalhos de teclado
│   │   └── useTema.ts                # Sistema de tema claro/escuro
│   ├── help/                         # Conteudo de ajuda embutido
│   │   ├── conteudo.ts               # Artigos de ajuda em Markdown
│   │   └── indice.ts                 # Indice de navegacao da ajuda
│   └── onboarding/                   # Fluxo de primeira execucao
│       ├── OnboardingModal.tsx        # Modal de boas-vindas
│       └── roteiro.ts                # Passos do onboarding
├── src-tauri/                        # Backend Rust
│   ├── src/
│   │   ├── lib.rs                    # Ponto de entrada: plugins, setup, registro de commands
│   │   ├── main.rs                   # Entry point do executavel
│   │   ├── commands/                 # Tauri commands (46 commands + 4 de licenca)
│   │   │   ├── mod.rs                # Todos os commands + EstadoApp
│   │   │   └── license_commands.rs   # check/activate/get_hardware_id/logout
│   │   ├── db/                       # Banco de dados
│   │   │   ├── mod.rs                # Re-exportacoes
│   │   │   ├── connection.rs         # Inicializacao SQLite (pragmas, WAL, FK)
│   │   │   ├── migrations.rs         # Sistema de migracoes versionado
│   │   │   ├── models.rs             # Structs Rust com serde (Pasta, Item, Tag, etc.)
│   │   │   ├── queries.rs            # Todas as queries SQL (CRUD, FTS, joins)
│   │   │   └── migrations/           # Arquivos SQL
│   │   │       ├── 001_schema_inicial.sql    # Schema completo (9 tabelas, 11 indices, FTS5)
│   │   │       └── 002_dados_iniciais.sql    # Configuracoes padrao
│   │   ├── services/                 # Logica de negocio
│   │   │   ├── mod.rs                # Re-exportacoes
│   │   │   ├── backup.rs             # Backup/restauracao (.vaultbackup ZIP)
│   │   │   ├── armazenamento.rs      # Gerenciamento de arquivos anexos
│   │   │   ├── exportacao.rs         # Exportacao HTML e CSV
│   │   │   └── auditoria.rs          # Registro no log de auditoria
│   │   ├── license/                  # Sistema de licenciamento
│   │   │   ├── mod.rs                # Re-exportacoes
│   │   │   ├── hardware.rs           # Fingerprint do hardware (SHA-256)
│   │   │   ├── service.rs            # API remota (verify/activate, APP_ID=14)
│   │   │   ├── storage.rs            # Armazenamento local (license.dat, base64)
│   │   │   └── validator.rs          # Validacao offline (prefixo VLTCR-)
│   │   ├── crypto/                   # Criptografia
│   │   │   └── mod.rs                # Hashing de PIN, helpers
│   │   └── storage/                  # Utilitarios de armazenamento
│   │       └── mod.rs                # Re-exportacoes
│   ├── tests/                        # Testes de integracao
│   │   ├── migracao_test.rs          # Testes de migracoes
│   │   ├── busca_test.rs             # Testes de busca FTS
│   │   ├── backup_test.rs            # Testes de backup
│   │   └── vencimentos_test.rs       # Testes de vencimentos
│   ├── capabilities/                 # Permissoes Tauri
│   │   └── default.json              # core:default, shell:default, dialog:default
│   ├── icons/                        # Icones do app (todos os tamanhos)
│   ├── Cargo.toml                    # Dependencias Rust
│   └── tauri.conf.json               # Configuracao Tauri
├── installer/                        # Instalador Inno Setup
│   ├── vaultcraft.iss                # Script do instalador
│   ├── wizard-image.bmp              # Imagem lateral (164x314)
│   ├── wizard-small.bmp              # Icone pequeno (55x55)
│   └── Output/                       # Instalador gerado (gitignored)
├── generate_icons.py                 # Script para gerar icones HD com supersampling 4x
├── instalador.png                    # Imagem base do icone (1024x1024)
├── tailwind.config.ts                # Cores customizadas (cofre, dourado)
├── vite.config.ts                    # Configuracao Vite + path aliases
├── tsconfig.json                     # TypeScript strict mode
└── package.json                      # Dependencias Node.js
```

## Banco de Dados

SQLite com WAL mode, foreign keys habilitadas e FTS5 para busca.

### Tabelas

| Tabela | Descricao | Registros |
|--------|-----------|-----------|
| `pastas` | Estrutura hierarquica de pastas | UUID PK, pasta_pai_id (self-ref) |
| `itens` | Notas, documentos e checklists | tipo CHECK('nota','documento','checklist') |
| `tags` | Etiquetas coloridas | nome UNIQUE, cor hex |
| `item_tags` | Relacao N:N entre itens e tags | PK composta (item_id, tag_id) |
| `anexos` | Metadados de arquivos anexados | hash_sha256 para integridade |
| `tarefas_checklist` | Tarefas de checklists | concluida (0/1), ordem |
| `log_auditoria` | Historico imutavel de acoes | append-only, sem FK |
| `configuracoes` | Chave-valor de configuracoes | chave PK |
| `itens_fts` | Busca full-text (FTS5 virtual) | titulo, descricao, conteudo_nota |

### Triggers FTS

A tabela `itens_fts` e sincronizada automaticamente via triggers:
- `trg_itens_fts_insert` — Insere na FTS ao criar item
- `trg_itens_fts_update` — Atualiza na FTS ao editar item (DELETE + INSERT)
- `trg_itens_fts_delete` — Remove da FTS ao excluir item

### Indices

11 indices otimizados para os padroes de acesso mais frequentes:
- `idx_itens_pasta_id` — Listar itens por pasta
- `idx_itens_tipo` — Filtrar por tipo
- `idx_itens_vencimento` — Alertas de vencimento
- `idx_itens_criado_em` / `idx_itens_atualizado_em` — Ordenacao cronologica
- `idx_anexos_item_id` / `idx_anexos_tarefa_id` — Anexos por entidade
- `idx_tarefas_item_id` — Tarefas por checklist
- `idx_log_tipo` / `idx_log_criado` — Filtragem de auditoria
- `idx_pastas_pai` — Navegacao na arvore

## API de Comandos Tauri

O frontend se comunica com o backend Rust via `invoke()`. Todos os 50 comandos disponsiveis:

### Pastas (5)
| Comando | Parametros | Retorno |
|---------|-----------|---------|
| `listar_pastas` | — | `Pasta[]` |
| `criar_pasta` | nome, pasta_pai_id? | `Pasta` |
| `renomear_pasta` | id, novo_nome | `Pasta` |
| `mover_pasta` | id, novo_pai_id? | `Pasta` |
| `excluir_pasta` | id | — |

### Itens (5)
| Comando | Parametros | Retorno |
|---------|-----------|---------|
| `listar_itens` | pasta_id | `Item[]` |
| `obter_item` | id | `Item` |
| `criar_item` | dados (NovoItem) | `Item` |
| `atualizar_item` | id, dados (AtualizacaoItem) | `Item` |
| `excluir_item` | id | — |

### Tags (4)
| Comando | Parametros | Retorno |
|---------|-----------|---------|
| `listar_tags` | — | `Tag[]` |
| `criar_tag` | nome, cor? | `Tag` |
| `atualizar_tag` | id, nome, cor? | `Tag` |
| `excluir_tag` | id | — |

### Anexos (4)
| Comando | Parametros | Retorno |
|---------|-----------|---------|
| `adicionar_anexo` | caminho_arquivo, item_id | `Anexo` |
| `remover_anexo` | id | — |
| `abrir_anexo` | id | `string` (path) |
| `listar_anexos` | item_id | `Anexo[]` |

### Tarefas Checklist (6)
| Comando | Parametros | Retorno |
|---------|-----------|---------|
| `listar_tarefas` | item_id | `TarefaChecklist[]` |
| `criar_tarefa` | item_id, titulo, ordem? | `TarefaChecklist` |
| `atualizar_tarefa` | id, dados | `TarefaChecklist` |
| `excluir_tarefa` | id | — |
| `reordenar_tarefas` | ordens: [id, ordem][] | — |
| `marcar_tarefa` | id, concluida | `TarefaChecklist` |

### Busca (1)
| Comando | Parametros | Retorno |
|---------|-----------|---------|
| `buscar_itens` | termo, filtros? | `ResultadoBusca[]` |

### Vencimentos (1)
| Comando | Parametros | Retorno |
|---------|-----------|---------|
| `listar_vencimentos` | periodo? (dias) | `Item[]` |

### Backup e Restauracao (4)
| Comando | Parametros | Retorno |
|---------|-----------|---------|
| `criar_backup` | destino (path) | `string` (path) |
| `restaurar_backup` | arquivo (path) | — |
| `exportar_pacote` | pasta_id, destino | `string` (path) |
| `importar_pacote` | arquivo (path) | — |

### Exportacao (2)
| Comando | Parametros | Retorno |
|---------|-----------|---------|
| `exportar_item_pdf` | item_id, destino | `string` (path HTML) |
| `exportar_lista_csv` | pasta_id, destino | `string` (path CSV) |

### Auditoria (1)
| Comando | Parametros | Retorno |
|---------|-----------|---------|
| `listar_historico` | filtros? (tipo_evento, limite, offset) | `LogAuditoria[]` |

### Configuracoes (3)
| Comando | Parametros | Retorno |
|---------|-----------|---------|
| `obter_configuracao` | chave | `Configuracao?` |
| `salvar_configuracao` | chave, valor | `Configuracao` |
| `obter_todas_configuracoes` | — | `Configuracao[]` |

### Manutencao (1)
| Comando | Parametros | Retorno |
|---------|-----------|---------|
| `compactar_banco` | — | — |

### Licenca (4)
| Comando | Parametros | Retorno |
|---------|-----------|---------|
| `check_license` | — | `LicenseStatus` |
| `activate_license` | email | `LicenseStatus` |
| `get_hardware_id` | — | `string` |
| `logout_license` | — | — |

## Sistema de Licenciamento

O VaultCraft usa um sistema de licenciamento baseado em hardware fingerprint:

1. **Hardware ID**: SHA-256 de (ProcessorId + MotherboardSerial), via WMI/PowerShell
2. **Ativacao**: Envia e-mail + hardware_id para a API `codecraftgenz-monorepo.onrender.com`
3. **Armazenamento local**: Licenca salva em `license.dat` (JSON codificado em base64)
4. **Verificacao online**: Verifica com a API a cada inicializacao
5. **Fallback offline**: Se sem internet, valida o fingerprint local
6. **APP_ID**: 14 (identificador do VaultCraft no backend de licencas)

### Fluxo de inicializacao

```
App inicia
  └─ checkLicense()
       ├─ Carrega license.dat local
       │   ├─ Nao existe → mostra LoginView
       │   └─ Existe → verifica online
       │       ├─ API confirma → app abre normalmente
       │       ├─ API nega → limpa licenca, mostra LoginView
       │       └─ Sem internet → verifica fingerprint local
       │           ├─ Match → app abre (modo offline)
       │           └─ Mismatch → mostra LoginView
       └─ LoginView
            └─ Usuario digita e-mail → activate_license()
                 ├─ Sucesso → salva license.dat, app abre
                 └─ Falha → mostra erro
```

## Formato de Backup

O arquivo `.vaultbackup` e um ZIP contendo:

```
backup.vaultbackup (ZIP)
├── banco.sqlite          # Copia completa do banco de dados
├── anexos/               # Todos os arquivos anexados
│   └── {uuid}/           # Pasta por anexo
│       └── arquivo.ext   # Arquivo original
└── manifesto.json        # Metadados do backup
    {
      "versao": "1.0.0",
      "criado_em": "2026-02-17T12:00:00Z",
      "contagem_itens": 42,
      "contagem_pastas": 8,
      "contagem_anexos": 15,
      "hash_banco": "sha256:...",
      "tamanho_total": 1234567
    }
```

## Onde Ficam os Dados

| Ambiente | Caminho |
|----------|---------|
| Windows (producao) | `%APPDATA%\com.vaultcraft.app\` |
| macOS (producao) | `~/Library/Application Support/com.vaultcraft.app/` |
| Linux (producao) | `~/.local/share/com.vaultcraft.app/` |

```
com.vaultcraft.app/
├── banco.sqlite          # Banco de dados principal
├── banco.sqlite-wal      # Write-Ahead Log
├── license.dat           # Licenca ativada (base64)
└── storage/
    └── anexos/           # Arquivos anexados
```

## Configuracao Tauri

```json
{
  "productName": "VaultCraft",
  "version": "0.1.0",
  "identifier": "com.vaultcraft.app",
  "windows": [{
    "title": "VaultCraft — Seu cofre pessoal",
    "width": 1200, "height": 800,
    "minWidth": 900, "minHeight": 600
  }],
  "plugins": { "shell": { "open": true } }
}
```

## Design System

### Cores customizadas (Tailwind)

| Token | Uso | Hex (500) |
|-------|-----|-----------|
| `cofre-*` | Cor principal (azul) | Gradiente azul |
| `dourado-*` | Acentos e destaques | Gradiente dourado |

### Fontes

- **Sans**: Inter, system-ui
- **Mono**: JetBrains Mono, Fira Code

### Animacoes

- `fadeIn` — Entrada suave com opacidade
- `slideUp` / `slideDown` — Deslizar vertical
- `pulseSuave` — Pulsacao suave para loading

## Instalador

O instalador Inno Setup (`installer/vaultcraft.iss`) gera um `.exe` profissional:

- Idiomas: Portugues BR + Ingles
- WebView2: verifica e orienta instalacao se necessario
- Opcoes: icone na area de trabalho, iniciar com Windows
- Desinstalacao: oferece remover dados do usuario
- Dados em: `%LOCALAPPDATA%\com.vaultcraft.app`

### Gerar icones

```bash
# Requer Python 3 + Pillow
python generate_icons.py
```

Gera todos os 21 icones PNG + ICO + ICNS + imagens do wizard do instalador a partir de `instalador.png`, usando supersampling 4x para qualidade HD.

## Roadmap

### v0.1 (MVP) — Atual
- [x] CRUD de pastas, itens (nota/documento/checklist), tags
- [x] Anexos (adicionar/remover/abrir)
- [x] Busca FTS5 com filtros
- [x] Vencimentos (lista com status)
- [x] Backup e Restore com manifesto
- [x] Pacotes Vault (export/import de pasta)
- [x] Auditoria e historico
- [x] Ajuda embutida com busca
- [x] Onboarding de primeira execucao
- [x] PIN basico (hash + salt)
- [x] Tema claro/escuro
- [x] Sistema de licenciamento
- [x] Instalador Inno Setup

### v0.2 (Pro)
- [ ] Criptografia robusta (SQLCipher)
- [ ] Chaves protegidas via Windows DPAPI
- [ ] Exportacao PDF nativa
- [ ] Backup incremental
- [ ] Melhorias de UI/UX

### v1.0 (Estavel)
- [ ] Otimizacoes de desempenho
- [ ] Acessibilidade aprimorada
- [ ] Importadores (CSV)
- [ ] Testes abrangentes

## Licenca

Uso pessoal. Todos os direitos reservados.
CodeCraftgenz (c) 2026.
