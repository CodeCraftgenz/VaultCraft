// =============================================================================
// VaultCraft — Comandos Tauri (Interface Frontend <-> Backend)
// =============================================================================
// Todos os comandos #[tauri::command] que o frontend React pode invocar.
// Cada comando recebe o estado gerenciado (EstadoApp) via tauri::State
// e delega a lógica para as camadas de queries e services.
//
// Convenções:
// - Comandos retornam Result<T, String> (Tauri exige String para erros)
// - O Mutex é travado apenas pelo tempo necessário (lock curto)
// - Auditoria é registrada após operações de escrita importantes
// - Nenhum comando faz chamadas de rede (app 100% offline)
//
// Organização:
// 1. Pastas
// 2. Itens
// 3. Tags
// 4. Anexos
// 5. Tarefas Checklist
// 6. Busca
// 7. Vencimentos
// 8. Backup e Restauração
// 9. Exportação
// 10. Auditoria
// 11. Configurações
// 12. Utilitários
// =============================================================================

use std::path::PathBuf;
use std::sync::Mutex;

use rusqlite::Connection;
use tauri::State;

use crate::db::models::*;
use crate::db::queries;
use crate::services::{auditoria, backup, armazenamento, exportacao};

pub mod license_commands;

// =============================================================================
// Estado Compartilhado do Aplicativo
// =============================================================================
// O banco de dados é envolvido em Mutex para acesso thread-safe.
// Tauri pode chamar comandos de threads diferentes, então precisamos
// garantir que apenas uma thread acesse o banco por vez.
//
// O diretorio_app é o caminho onde o banco e anexos são armazenados.
// É definido na inicialização e não muda durante a execução.
// =============================================================================

/// Estado global do aplicativo, gerenciado pelo Tauri.
/// Contém a conexão com o banco de dados e o diretório de dados.
pub struct EstadoApp {
    /// Conexão SQLite protegida por Mutex (acesso thread-safe)
    pub banco: Mutex<Connection>,
    /// Diretório raiz do aplicativo (onde ficam banco e anexos)
    pub diretorio_app: PathBuf,
}

/// Macro auxiliar para converter anyhow::Error em String (exigido pelo Tauri).
/// Mantém a mensagem de erro legível para o frontend.
fn erro_para_string(e: anyhow::Error) -> String {
    format!("{:#}", e)
}

// =============================================================================
// 1. PASTAS — Criar, listar, renomear, mover, excluir
// =============================================================================

/// Lista todas as pastas do cofre em ordem alfabética pelo caminho.
#[tauri::command]
pub fn listar_pastas(estado: State<'_, EstadoApp>) -> Result<Vec<Pasta>, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;
    queries::listar_pastas(&conn).map_err(erro_para_string)
}

/// Cria uma nova pasta no cofre.
/// Se pasta_pai_id for fornecido, cria como subpasta.
#[tauri::command]
pub fn criar_pasta(
    estado: State<'_, EstadoApp>,
    nome: String,
    pasta_pai_id: Option<String>,
) -> Result<Pasta, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;

    let dados = NovaPasta { nome: nome.clone(), pasta_pai_id };
    let pasta = queries::criar_pasta(&conn, &dados).map_err(erro_para_string)?;

    // Registrar no log de auditoria
    let _ = auditoria::registrar(
        &conn, "criacao", "pasta",
        Some(&pasta.id),
        Some(&format!("{{\"nome\": \"{}\"}}", nome)),
    );

    Ok(pasta)
}

/// Renomeia uma pasta existente.
/// Atualiza os caminhos de todas as subpastas automaticamente.
#[tauri::command]
pub fn renomear_pasta(
    estado: State<'_, EstadoApp>,
    id: String,
    novo_nome: String,
) -> Result<Pasta, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;

    let pasta = queries::renomear_pasta(&conn, &id, &novo_nome).map_err(erro_para_string)?;

    let _ = auditoria::registrar(
        &conn, "atualizacao", "pasta",
        Some(&id),
        Some(&format!("{{\"novo_nome\": \"{}\"}}", novo_nome)),
    );

    Ok(pasta)
}

/// Move uma pasta para dentro de outra (ou para a raiz).
#[tauri::command]
pub fn mover_pasta(
    estado: State<'_, EstadoApp>,
    id: String,
    novo_pai_id: Option<String>,
) -> Result<Pasta, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;

    let pasta = queries::mover_pasta(&conn, &id, novo_pai_id.as_deref())
        .map_err(erro_para_string)?;

    let _ = auditoria::registrar(
        &conn, "movimentacao", "pasta",
        Some(&id),
        Some(&format!("{{\"novo_pai_id\": {:?}}}", novo_pai_id)),
    );

    Ok(pasta)
}

/// Exclui uma pasta e todo o seu conteúdo (itens, anexos, subpastas).
/// A exclusão é em cascata via foreign keys do SQLite.
#[tauri::command]
pub fn excluir_pasta(
    estado: State<'_, EstadoApp>,
    id: String,
) -> Result<(), String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;

    // Obter nome antes de excluir (para auditoria)
    let pasta = queries::obter_pasta_por_id(&conn, &id).map_err(erro_para_string)?;
    queries::excluir_pasta(&conn, &id).map_err(erro_para_string)?;

    let _ = auditoria::registrar(
        &conn, "exclusao", "pasta",
        Some(&id),
        Some(&format!("{{\"nome\": \"{}\"}}", pasta.nome)),
    );

    Ok(())
}

// =============================================================================
// 2. ITENS — CRUD para notas, documentos e checklists
// =============================================================================

/// Lista todos os itens de uma pasta, incluindo tags e anexos.
#[tauri::command]
pub fn listar_itens(
    estado: State<'_, EstadoApp>,
    pasta_id: String,
) -> Result<Vec<Item>, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;
    queries::listar_itens_por_pasta(&conn, &pasta_id).map_err(erro_para_string)
}

/// Obtém um item específico com todos os dados associados.
#[tauri::command]
pub fn obter_item(
    estado: State<'_, EstadoApp>,
    id: String,
) -> Result<Item, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;
    queries::obter_item_por_id(&conn, &id).map_err(erro_para_string)
}

/// Cria um novo item no cofre.
#[tauri::command]
pub fn criar_item(
    estado: State<'_, EstadoApp>,
    dados: NovoItem,
) -> Result<Item, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;

    let item = queries::criar_item(&conn, &dados).map_err(erro_para_string)?;

    let _ = auditoria::registrar(
        &conn, "criacao", "item",
        Some(&item.id),
        Some(&format!("{{\"titulo\": \"{}\", \"tipo\": \"{}\"}}", dados.titulo, dados.tipo)),
    );

    Ok(item)
}

/// Atualiza um item existente. Apenas campos fornecidos são alterados.
#[tauri::command]
pub fn atualizar_item(
    estado: State<'_, EstadoApp>,
    id: String,
    dados: AtualizacaoItem,
) -> Result<Item, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;

    let item = queries::atualizar_item(&conn, &id, &dados).map_err(erro_para_string)?;

    let _ = auditoria::registrar(
        &conn, "atualizacao", "item",
        Some(&id), None,
    );

    Ok(item)
}

/// Exclui um item e todos os dados associados.
#[tauri::command]
pub fn excluir_item(
    estado: State<'_, EstadoApp>,
    id: String,
) -> Result<(), String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;

    // Obter título antes de excluir (para auditoria)
    let item = queries::obter_item_por_id(&conn, &id).map_err(erro_para_string)?;

    // Remover anexos físicos do armazenamento antes de excluir do banco
    for anexo in &item.anexos {
        let _ = armazenamento::remover_anexo(&estado.diretorio_app, &anexo.caminho_interno);
    }

    queries::excluir_item(&conn, &id).map_err(erro_para_string)?;

    let _ = auditoria::registrar(
        &conn, "exclusao", "item",
        Some(&id),
        Some(&format!("{{\"titulo\": \"{}\"}}", item.titulo)),
    );

    Ok(())
}

// =============================================================================
// 3. TAGS — CRUD para categorização
// =============================================================================

/// Lista todas as tags do cofre.
#[tauri::command]
pub fn listar_tags(estado: State<'_, EstadoApp>) -> Result<Vec<Tag>, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;
    queries::listar_tags(&conn).map_err(erro_para_string)
}

/// Cria uma nova tag com nome e cor.
#[tauri::command]
pub fn criar_tag(
    estado: State<'_, EstadoApp>,
    nome: String,
    cor: Option<String>,
) -> Result<Tag, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;

    let dados = NovaTag { nome: nome.clone(), cor };
    let tag = queries::criar_tag(&conn, &dados).map_err(erro_para_string)?;

    let _ = auditoria::registrar(
        &conn, "criacao", "tag",
        Some(&tag.id),
        Some(&format!("{{\"nome\": \"{}\"}}", nome)),
    );

    Ok(tag)
}

/// Atualiza nome e/ou cor de uma tag.
#[tauri::command]
pub fn atualizar_tag(
    estado: State<'_, EstadoApp>,
    id: String,
    nome: String,
    cor: Option<String>,
) -> Result<Tag, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;

    let dados = NovaTag { nome, cor };
    queries::atualizar_tag(&conn, &id, &dados).map_err(erro_para_string)
}

/// Exclui uma tag. Remove automaticamente as associações com itens.
#[tauri::command]
pub fn excluir_tag(
    estado: State<'_, EstadoApp>,
    id: String,
) -> Result<(), String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;

    queries::excluir_tag(&conn, &id).map_err(erro_para_string)?;

    let _ = auditoria::registrar(
        &conn, "exclusao", "tag", Some(&id), None,
    );

    Ok(())
}

// =============================================================================
// 4. ANEXOS — Adicionar, remover, abrir, listar
// =============================================================================

/// Adiciona um anexo a um item.
/// O arquivo é copiado para o armazenamento interno e registrado no banco.
#[tauri::command]
pub fn adicionar_anexo(
    estado: State<'_, EstadoApp>,
    caminho_arquivo: String,
    item_id: String,
) -> Result<Anexo, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;

    let caminho = std::path::Path::new(&caminho_arquivo);

    // Salvar arquivo no armazenamento interno
    let anexo = armazenamento::salvar_anexo(
        &estado.diretorio_app, caminho, Some(&item_id), None,
    ).map_err(erro_para_string)?;

    // Registrar no banco de dados
    let anexo_salvo = queries::criar_anexo(&conn, &anexo).map_err(erro_para_string)?;

    let _ = auditoria::registrar(
        &conn, "criacao", "anexo",
        Some(&anexo_salvo.id),
        Some(&format!("{{\"nome\": \"{}\", \"item_id\": \"{}\"}}", anexo_salvo.nome_original, item_id)),
    );

    Ok(anexo_salvo)
}

/// Remove um anexo (arquivo físico e registro no banco).
#[tauri::command]
pub fn remover_anexo(
    estado: State<'_, EstadoApp>,
    id: String,
) -> Result<(), String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;

    // Obter dados do anexo antes de excluir
    let anexo = queries::obter_anexo_por_id(&conn, &id).map_err(erro_para_string)?;

    // Remover arquivo físico
    armazenamento::remover_anexo(&estado.diretorio_app, &anexo.caminho_interno)
        .map_err(erro_para_string)?;

    // Remover registro do banco
    queries::excluir_anexo(&conn, &id).map_err(erro_para_string)?;

    let _ = auditoria::registrar(
        &conn, "exclusao", "anexo",
        Some(&id),
        Some(&format!("{{\"nome\": \"{}\"}}", anexo.nome_original)),
    );

    Ok(())
}

/// Abre um anexo com o aplicativo padrão do sistema operacional.
/// Retorna o caminho completo do arquivo para o frontend usar com shell.open.
#[tauri::command]
pub fn abrir_anexo(
    estado: State<'_, EstadoApp>,
    id: String,
) -> Result<String, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;

    let anexo = queries::obter_anexo_por_id(&conn, &id).map_err(erro_para_string)?;
    let caminho = armazenamento::obter_caminho_completo_anexo(
        &estado.diretorio_app, &anexo.caminho_interno,
    ).map_err(erro_para_string)?;

    Ok(caminho.to_string_lossy().to_string())
}

/// Lista todos os anexos de um item.
#[tauri::command]
pub fn listar_anexos(
    estado: State<'_, EstadoApp>,
    item_id: String,
) -> Result<Vec<Anexo>, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;
    queries::listar_anexos_por_item(&conn, &item_id).map_err(erro_para_string)
}

// =============================================================================
// 5. TAREFAS CHECKLIST — CRUD para itens de checklist
// =============================================================================

/// Lista todas as tarefas de um item checklist, ordenadas pela posição.
#[tauri::command]
pub fn listar_tarefas(
    estado: State<'_, EstadoApp>,
    item_id: String,
) -> Result<Vec<TarefaChecklist>, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;
    queries::listar_tarefas_por_item(&conn, &item_id).map_err(erro_para_string)
}

/// Cria uma nova tarefa em um checklist.
#[tauri::command]
pub fn criar_tarefa(
    estado: State<'_, EstadoApp>,
    item_id: String,
    titulo: String,
    ordem: Option<i32>,
) -> Result<TarefaChecklist, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;

    let dados = NovaTarefa { item_id, titulo, ordem };
    queries::criar_tarefa(&conn, &dados).map_err(erro_para_string)
}

/// Atualiza uma tarefa existente (título, estado, ordem).
#[tauri::command]
pub fn atualizar_tarefa(
    estado: State<'_, EstadoApp>,
    id: String,
    dados: AtualizacaoTarefa,
) -> Result<TarefaChecklist, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;
    queries::atualizar_tarefa(&conn, &id, &dados).map_err(erro_para_string)
}

/// Exclui uma tarefa de checklist.
#[tauri::command]
pub fn excluir_tarefa(
    estado: State<'_, EstadoApp>,
    id: String,
) -> Result<(), String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;
    queries::excluir_tarefa(&conn, &id).map_err(erro_para_string)
}

/// Reordena as tarefas de um checklist.
/// Recebe um vetor de pares (tarefa_id, nova_ordem).
#[tauri::command]
pub fn reordenar_tarefas(
    estado: State<'_, EstadoApp>,
    ordens: Vec<(String, i32)>,
) -> Result<(), String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;
    queries::reordenar_tarefas(&conn, &ordens).map_err(erro_para_string)
}

/// Marca ou desmarca uma tarefa como concluída.
#[tauri::command]
pub fn marcar_tarefa(
    estado: State<'_, EstadoApp>,
    id: String,
    concluida: bool,
) -> Result<TarefaChecklist, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;
    queries::marcar_tarefa_concluida(&conn, &id, concluida).map_err(erro_para_string)
}

// =============================================================================
// 6. BUSCA — Full-Text Search
// =============================================================================

/// Busca itens no cofre usando Full-Text Search (FTS5).
/// O termo é pesquisado em título, descrição e conteúdo de notas.
/// Filtros adicionais podem restringir os resultados.
#[tauri::command]
pub fn buscar_itens(
    estado: State<'_, EstadoApp>,
    termo: String,
    filtros: Option<FiltrosBusca>,
) -> Result<Vec<ResultadoBusca>, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;
    let filtros = filtros.unwrap_or_default();
    queries::buscar_fts(&conn, &termo, &filtros).map_err(erro_para_string)
}

// =============================================================================
// 7. VENCIMENTOS — Itens com data de vencimento
// =============================================================================

/// Lista itens com vencimento próximo ou atrasado.
/// periodo: número de dias para frente (0 = apenas atrasados).
#[tauri::command]
pub fn listar_vencimentos(
    estado: State<'_, EstadoApp>,
    periodo: Option<i64>,
) -> Result<Vec<Item>, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;

    let dias = periodo.unwrap_or(7);

    // Combinar atrasados + próximos
    let mut atrasados = queries::listar_vencimentos_atrasados(&conn)
        .map_err(erro_para_string)?;
    let proximos = queries::listar_proximos_vencimentos(&conn, dias)
        .map_err(erro_para_string)?;

    atrasados.extend(proximos);
    Ok(atrasados)
}

// =============================================================================
// 8. BACKUP E RESTAURACAO
// =============================================================================

/// Cria um backup completo do cofre no destino especificado.
/// Retorna o caminho do arquivo .vaultbackup criado.
#[tauri::command]
pub fn criar_backup(
    estado: State<'_, EstadoApp>,
    destino: String,
) -> Result<String, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;

    let caminho = backup::criar_backup(
        &estado.diretorio_app, &conn, &PathBuf::from(&destino),
    ).map_err(erro_para_string)?;

    let _ = auditoria::registrar(
        &conn, "backup", "sistema", None,
        Some(&format!("{{\"destino\": \"{}\"}}", destino)),
    );

    Ok(caminho.to_string_lossy().to_string())
}

/// Restaura o cofre a partir de um arquivo .vaultbackup.
/// CUIDADO: substitui todos os dados atuais (faz backup automático antes).
#[tauri::command]
pub fn restaurar_backup(
    estado: State<'_, EstadoApp>,
    arquivo: String,
) -> Result<(), String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;

    backup::restaurar_backup(
        &estado.diretorio_app, &conn, &PathBuf::from(&arquivo),
    ).map_err(erro_para_string)?;

    let _ = auditoria::registrar(
        &conn, "restauracao", "sistema", None,
        Some(&format!("{{\"arquivo\": \"{}\"}}", arquivo)),
    );

    Ok(())
}

/// Exporta uma pasta como pacote .vaultbackup para compartilhamento.
#[tauri::command]
pub fn exportar_pacote(
    estado: State<'_, EstadoApp>,
    pasta_id: String,
    destino: String,
) -> Result<String, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;

    let caminho = backup::exportar_pacote_pasta(
        &estado.diretorio_app, &conn, &pasta_id, &PathBuf::from(&destino),
    ).map_err(erro_para_string)?;

    Ok(caminho.to_string_lossy().to_string())
}

/// Importa um pacote .vaultbackup para o cofre.
#[tauri::command]
pub fn importar_pacote(
    estado: State<'_, EstadoApp>,
    arquivo: String,
) -> Result<(), String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;

    backup::importar_pacote(
        &estado.diretorio_app, &conn, &PathBuf::from(&arquivo),
    ).map_err(erro_para_string)?;

    let _ = auditoria::registrar(
        &conn, "importacao", "sistema", None,
        Some(&format!("{{\"arquivo\": \"{}\"}}", arquivo)),
    );

    Ok(())
}

// =============================================================================
// 9. EXPORTACAO — HTML e CSV
// =============================================================================

/// Exporta um item como arquivo HTML (para impressão/conversão em PDF).
/// Retorna o caminho do arquivo HTML gerado.
#[tauri::command]
pub fn exportar_item_pdf(
    estado: State<'_, EstadoApp>,
    item_id: String,
    destino: String,
) -> Result<String, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;

    let item = queries::obter_item_por_id(&conn, &item_id).map_err(erro_para_string)?;
    let caminho = exportacao::exportar_item_html(&item, &PathBuf::from(&destino))
        .map_err(erro_para_string)?;

    Ok(caminho.to_string_lossy().to_string())
}

/// Exporta uma lista de itens (de uma pasta) como arquivo CSV.
/// Retorna o caminho do arquivo CSV gerado.
#[tauri::command]
pub fn exportar_lista_csv(
    estado: State<'_, EstadoApp>,
    pasta_id: String,
    destino: String,
) -> Result<String, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;

    let itens = queries::listar_itens_por_pasta(&conn, &pasta_id)
        .map_err(erro_para_string)?;
    let caminho = exportacao::exportar_lista_csv(&itens, &PathBuf::from(&destino))
        .map_err(erro_para_string)?;

    Ok(caminho.to_string_lossy().to_string())
}

// =============================================================================
// 10. AUDITORIA — Histórico de eventos
// =============================================================================

/// Lista o histórico de eventos de auditoria com filtros opcionais.
#[tauri::command]
pub fn listar_historico(
    estado: State<'_, EstadoApp>,
    filtros: Option<FiltrosAuditoria>,
) -> Result<Vec<LogAuditoria>, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;
    let filtros = filtros.unwrap_or_default();
    queries::listar_eventos_auditoria(&conn, &filtros).map_err(erro_para_string)
}

// =============================================================================
// 11. CONFIGURACOES — Preferências do aplicativo
// =============================================================================

/// Obtém o valor de uma configuração pela chave.
#[tauri::command]
pub fn obter_configuracao(
    estado: State<'_, EstadoApp>,
    chave: String,
) -> Result<Option<Configuracao>, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;
    queries::obter_configuracao(&conn, &chave).map_err(erro_para_string)
}

/// Salva uma configuração (cria ou atualiza).
#[tauri::command]
pub fn salvar_configuracao(
    estado: State<'_, EstadoApp>,
    chave: String,
    valor: String,
) -> Result<Configuracao, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;
    queries::salvar_configuracao(&conn, &chave, &valor).map_err(erro_para_string)
}

/// Lista todas as configurações do aplicativo.
#[tauri::command]
pub fn obter_todas_configuracoes(
    estado: State<'_, EstadoApp>,
) -> Result<Vec<Configuracao>, String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;
    queries::listar_configuracoes(&conn).map_err(erro_para_string)
}

// =============================================================================
// 12. UTILITARIOS — Manutenção do banco
// =============================================================================

/// Compacta o banco de dados usando VACUUM.
/// Remove espaço não utilizado após grandes exclusões.
/// Pode levar alguns segundos em bancos maiores.
#[tauri::command]
pub fn compactar_banco(estado: State<'_, EstadoApp>) -> Result<(), String> {
    let conn = estado.banco.lock().map_err(|e| format!("Erro ao acessar banco: {}", e))?;

    queries::compactar_banco(&conn).map_err(erro_para_string)?;

    let _ = auditoria::registrar(
        &conn, "manutencao", "sistema", None,
        Some("{\"acao\": \"vacuum\"}"),
    );

    Ok(())
}
