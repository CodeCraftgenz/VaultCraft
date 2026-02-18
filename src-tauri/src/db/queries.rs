// =============================================================================
// VaultCraft — Consultas ao Banco de Dados
// =============================================================================
// Implementa todas as operações CRUD para cada entidade do sistema.
// Usa rusqlite com params! para consultas parametrizadas (previne SQL injection).
// Transações são usadas em operações que modificam múltiplas tabelas.
//
// Convenções:
// - Funções de leitura retornam Result<Vec<T>> ou Result<T>
// - Funções de escrita retornam Result<T> com o registro criado/atualizado
// - Funções de exclusão retornam Result<()>
// - Todos os IDs são gerados aqui (UUID v4)
// - Todos os timestamps são gerados aqui (UTC ISO 8601)
// =============================================================================

use anyhow::{Context, Result, anyhow};
use chrono::Utc;
use log::info;
use rusqlite::{params, Connection};
use uuid::Uuid;

use super::models::*;

// =============================================================================
// PASTAS — Operações CRUD para a hierarquia de pastas
// =============================================================================

/// Lista todas as pastas do cofre, ordenadas pelo caminho.
/// Retorna a árvore completa em ordem alfabética do caminho.
pub fn listar_pastas(conexao: &Connection) -> Result<Vec<Pasta>> {
    let mut stmt = conexao.prepare(
        "SELECT id, pasta_pai_id, nome, caminho, criado_em, atualizado_em
         FROM pastas ORDER BY caminho ASC",
    )?;

    let pastas = stmt.query_map([], |linha| {
        Ok(Pasta {
            id: linha.get(0)?,
            pasta_pai_id: linha.get(1)?,
            nome: linha.get(2)?,
            caminho: linha.get(3)?,
            criado_em: linha.get(4)?,
            atualizado_em: linha.get(5)?,
        })
    })?
    .collect::<Result<Vec<_>, _>>()
    .context("Falha ao listar pastas")?;

    Ok(pastas)
}

/// Obtém uma pasta pelo seu ID.
pub fn obter_pasta_por_id(conexao: &Connection, id: &str) -> Result<Pasta> {
    conexao.query_row(
        "SELECT id, pasta_pai_id, nome, caminho, criado_em, atualizado_em
         FROM pastas WHERE id = ?1",
        params![id],
        |linha| {
            Ok(Pasta {
                id: linha.get(0)?,
                pasta_pai_id: linha.get(1)?,
                nome: linha.get(2)?,
                caminho: linha.get(3)?,
                criado_em: linha.get(4)?,
                atualizado_em: linha.get(5)?,
            })
        },
    ).with_context(|| format!("Pasta não encontrada: {}", id))
}

/// Obtém as pastas filhas de uma pasta pai.
/// Se pasta_pai_id for None, retorna as pastas raiz.
pub fn obter_pastas_filhas(conexao: &Connection, pasta_pai_id: Option<&str>) -> Result<Vec<Pasta>> {
    let mut stmt = match pasta_pai_id {
        Some(_) => conexao.prepare(
            "SELECT id, pasta_pai_id, nome, caminho, criado_em, atualizado_em
             FROM pastas WHERE pasta_pai_id = ?1 ORDER BY nome ASC",
        )?,
        None => conexao.prepare(
            "SELECT id, pasta_pai_id, nome, caminho, criado_em, atualizado_em
             FROM pastas WHERE pasta_pai_id IS NULL ORDER BY nome ASC",
        )?,
    };

    let pastas = match pasta_pai_id {
        Some(pai_id) => stmt.query_map(params![pai_id], |linha| {
            Ok(Pasta {
                id: linha.get(0)?,
                pasta_pai_id: linha.get(1)?,
                nome: linha.get(2)?,
                caminho: linha.get(3)?,
                criado_em: linha.get(4)?,
                atualizado_em: linha.get(5)?,
            })
        })?.collect::<Result<Vec<_>, _>>()?,
        None => stmt.query_map([], |linha| {
            Ok(Pasta {
                id: linha.get(0)?,
                pasta_pai_id: linha.get(1)?,
                nome: linha.get(2)?,
                caminho: linha.get(3)?,
                criado_em: linha.get(4)?,
                atualizado_em: linha.get(5)?,
            })
        })?.collect::<Result<Vec<_>, _>>()?,
    };

    Ok(pastas)
}

/// Cria uma nova pasta no cofre.
/// O caminho é calculado automaticamente com base na pasta pai.
pub fn criar_pasta(conexao: &Connection, dados: &NovaPasta) -> Result<Pasta> {
    let id = Uuid::new_v4().to_string();
    let agora = Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();

    // Calcular o caminho completo baseado na pasta pai
    let caminho = match &dados.pasta_pai_id {
        Some(pai_id) => {
            let pai = obter_pasta_por_id(conexao, pai_id)?;
            if pai.caminho == "/" {
                format!("/{}", dados.nome)
            } else {
                format!("{}/{}", pai.caminho, dados.nome)
            }
        }
        None => format!("/{}", dados.nome),
    };

    conexao.execute(
        "INSERT INTO pastas (id, pasta_pai_id, nome, caminho, criado_em, atualizado_em)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, dados.pasta_pai_id, dados.nome, caminho, agora, agora],
    ).context("Falha ao criar pasta")?;

    info!("Pasta criada: {} ({})", dados.nome, id);
    obter_pasta_por_id(conexao, &id)
}

/// Renomeia uma pasta e atualiza os caminhos de todas as subpastas.
/// Usa transação para garantir consistência dos caminhos.
pub fn renomear_pasta(conexao: &Connection, id: &str, novo_nome: &str) -> Result<Pasta> {
    let agora = Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();
    let pasta_atual = obter_pasta_por_id(conexao, id)?;

    // Calcular novo caminho
    let novo_caminho = match &pasta_atual.pasta_pai_id {
        Some(pai_id) => {
            let pai = obter_pasta_por_id(conexao, pai_id)?;
            if pai.caminho == "/" {
                format!("/{}", novo_nome)
            } else {
                format!("{}/{}", pai.caminho, novo_nome)
            }
        }
        None => format!("/{}", novo_nome),
    };

    let caminho_antigo = pasta_atual.caminho.clone();

    // Atualizar a pasta em si
    conexao.execute(
        "UPDATE pastas SET nome = ?1, caminho = ?2, atualizado_em = ?3 WHERE id = ?4",
        params![novo_nome, novo_caminho, agora, id],
    ).context("Falha ao renomear pasta")?;

    // Atualizar caminhos de todas as subpastas (substituindo o prefixo antigo pelo novo)
    conexao.execute(
        "UPDATE pastas SET caminho = ?1 || substr(caminho, ?2), atualizado_em = ?3
         WHERE caminho LIKE ?4 AND id != ?5",
        params![
            novo_caminho,
            caminho_antigo.len() as i64 + 1,
            agora,
            format!("{}/%", caminho_antigo),
            id
        ],
    ).context("Falha ao atualizar caminhos das subpastas")?;

    info!("Pasta renomeada: {} -> {}", pasta_atual.nome, novo_nome);
    obter_pasta_por_id(conexao, id)
}

/// Move uma pasta para dentro de outra pasta (ou para a raiz se destino for None).
/// Atualiza recursivamente os caminhos de todas as subpastas.
pub fn mover_pasta(conexao: &Connection, id: &str, novo_pai_id: Option<&str>) -> Result<Pasta> {
    let agora = Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();
    let pasta_atual = obter_pasta_por_id(conexao, id)?;
    let caminho_antigo = pasta_atual.caminho.clone();

    // Calcular novo caminho
    let novo_caminho = match novo_pai_id {
        Some(pai_id) => {
            let pai = obter_pasta_por_id(conexao, pai_id)?;
            if pai.caminho == "/" {
                format!("/{}", pasta_atual.nome)
            } else {
                format!("{}/{}", pai.caminho, pasta_atual.nome)
            }
        }
        None => format!("/{}", pasta_atual.nome),
    };

    // Atualizar a pasta
    conexao.execute(
        "UPDATE pastas SET pasta_pai_id = ?1, caminho = ?2, atualizado_em = ?3 WHERE id = ?4",
        params![novo_pai_id, novo_caminho, agora, id],
    ).context("Falha ao mover pasta")?;

    // Atualizar caminhos das subpastas
    conexao.execute(
        "UPDATE pastas SET caminho = ?1 || substr(caminho, ?2), atualizado_em = ?3
         WHERE caminho LIKE ?4 AND id != ?5",
        params![
            novo_caminho,
            caminho_antigo.len() as i64 + 1,
            agora,
            format!("{}/%", caminho_antigo),
            id
        ],
    ).context("Falha ao atualizar caminhos das subpastas movidas")?;

    info!("Pasta movida: {} para {:?}", pasta_atual.nome, novo_pai_id);
    obter_pasta_por_id(conexao, id)
}

/// Exclui uma pasta e todo o seu conteúdo (cascade via foreign key).
/// O SQLite cuida de deletar itens, tags associadas, anexos, etc.
pub fn excluir_pasta(conexao: &Connection, id: &str) -> Result<()> {
    // Verificar se a pasta existe antes de excluir
    let pasta = obter_pasta_por_id(conexao, id)?;

    conexao.execute(
        "DELETE FROM pastas WHERE id = ?1",
        params![id],
    ).context("Falha ao excluir pasta")?;

    info!("Pasta excluída: {} ({})", pasta.nome, id);
    Ok(())
}

// =============================================================================
// ITENS — Operações CRUD para notas, documentos e checklists
// =============================================================================

/// Lista todos os itens de uma pasta, com tags carregadas.
pub fn listar_itens_por_pasta(conexao: &Connection, pasta_id: &str) -> Result<Vec<Item>> {
    let mut stmt = conexao.prepare(
        "SELECT id, pasta_id, tipo, titulo, descricao, conteudo_nota,
                data_vencimento, criado_em, atualizado_em
         FROM itens WHERE pasta_id = ?1 ORDER BY atualizado_em DESC",
    )?;

    let mut itens: Vec<Item> = stmt.query_map(params![pasta_id], |linha| {
        let tipo_str: String = linha.get(2)?;
        Ok(Item {
            id: linha.get(0)?,
            pasta_id: linha.get(1)?,
            tipo: TipoItem::de_str(&tipo_str),
            titulo: linha.get(3)?,
            descricao: linha.get(4)?,
            conteudo_nota: linha.get(5)?,
            data_vencimento: linha.get(6)?,
            criado_em: linha.get(7)?,
            atualizado_em: linha.get(8)?,
            tags: vec![],
            anexos: vec![],
        })
    })?
    .collect::<Result<Vec<_>, _>>()
    .context("Falha ao listar itens da pasta")?;

    // Carregar tags e anexos para cada item
    for item in &mut itens {
        item.tags = obter_tags_do_item(conexao, &item.id)?;
        item.anexos = listar_anexos_por_item(conexao, &item.id)?;
    }

    Ok(itens)
}

/// Obtém um item pelo ID com todos os dados associados (tags, anexos).
pub fn obter_item_por_id(conexao: &Connection, id: &str) -> Result<Item> {
    let mut item: Item = conexao.query_row(
        "SELECT id, pasta_id, tipo, titulo, descricao, conteudo_nota,
                data_vencimento, criado_em, atualizado_em
         FROM itens WHERE id = ?1",
        params![id],
        |linha| {
            let tipo_str: String = linha.get(2)?;
            Ok(Item {
                id: linha.get(0)?,
                pasta_id: linha.get(1)?,
                tipo: TipoItem::de_str(&tipo_str),
                titulo: linha.get(3)?,
                descricao: linha.get(4)?,
                conteudo_nota: linha.get(5)?,
                data_vencimento: linha.get(6)?,
                criado_em: linha.get(7)?,
                atualizado_em: linha.get(8)?,
                tags: vec![],
                anexos: vec![],
            })
        },
    ).with_context(|| format!("Item não encontrado: {}", id))?;

    // Carregar dados associados
    item.tags = obter_tags_do_item(conexao, &item.id)?;
    item.anexos = listar_anexos_por_item(conexao, &item.id)?;

    Ok(item)
}

/// Cria um novo item no cofre.
/// Se tag_ids forem fornecidos, vincula as tags ao item.
pub fn criar_item(conexao: &Connection, dados: &NovoItem) -> Result<Item> {
    let id = Uuid::new_v4().to_string();
    let agora = Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();

    conexao.execute(
        "INSERT INTO itens (id, pasta_id, tipo, titulo, descricao, conteudo_nota,
                            data_vencimento, criado_em, atualizado_em)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            id,
            dados.pasta_id,
            dados.tipo.to_string(),
            dados.titulo,
            dados.descricao,
            dados.conteudo_nota,
            dados.data_vencimento,
            agora,
            agora
        ],
    ).context("Falha ao criar item")?;

    // Vincular tags se fornecidas
    if let Some(ref tag_ids) = dados.tag_ids {
        for tag_id in tag_ids {
            vincular_tag_a_item(conexao, &id, tag_id)?;
        }
    }

    info!("Item criado: {} ({}) tipo={}", dados.titulo, id, dados.tipo);
    obter_item_por_id(conexao, &id)
}

/// Atualiza um item existente.
/// Apenas os campos fornecidos (Some) são atualizados.
pub fn atualizar_item(conexao: &Connection, id: &str, dados: &AtualizacaoItem) -> Result<Item> {
    let item_atual = obter_item_por_id(conexao, id)?;
    let agora = Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();

    let titulo = dados.titulo.as_deref().unwrap_or(&item_atual.titulo);
    let descricao = dados.descricao.as_ref().or(item_atual.descricao.as_ref());
    let conteudo_nota = dados.conteudo_nota.as_ref().or(item_atual.conteudo_nota.as_ref());
    let data_vencimento = dados.data_vencimento.as_ref().or(item_atual.data_vencimento.as_ref());
    let pasta_id = dados.pasta_id.as_deref().unwrap_or(&item_atual.pasta_id);

    conexao.execute(
        "UPDATE itens SET titulo = ?1, descricao = ?2, conteudo_nota = ?3,
                          data_vencimento = ?4, pasta_id = ?5, atualizado_em = ?6
         WHERE id = ?7",
        params![titulo, descricao, conteudo_nota, data_vencimento, pasta_id, agora, id],
    ).context("Falha ao atualizar item")?;

    // Atualizar tags se fornecidas
    if let Some(ref tag_ids) = dados.tag_ids {
        // Remover todas as tags atuais e adicionar as novas
        conexao.execute(
            "DELETE FROM item_tags WHERE item_id = ?1",
            params![id],
        )?;
        for tag_id in tag_ids {
            vincular_tag_a_item(conexao, id, tag_id)?;
        }
    }

    info!("Item atualizado: {}", id);
    obter_item_por_id(conexao, id)
}

/// Exclui um item e todos os dados associados (cascade).
pub fn excluir_item(conexao: &Connection, id: &str) -> Result<()> {
    let item = obter_item_por_id(conexao, id)?;

    conexao.execute(
        "DELETE FROM itens WHERE id = ?1",
        params![id],
    ).context("Falha ao excluir item")?;

    info!("Item excluído: {} ({})", item.titulo, id);
    Ok(())
}

// =============================================================================
// TAGS — Operações CRUD para categorização
// =============================================================================

/// Lista todas as tags do cofre.
pub fn listar_tags(conexao: &Connection) -> Result<Vec<Tag>> {
    let mut stmt = conexao.prepare(
        "SELECT id, nome, cor, criado_em FROM tags ORDER BY nome ASC",
    )?;

    let tags = stmt.query_map([], |linha| {
        Ok(Tag {
            id: linha.get(0)?,
            nome: linha.get(1)?,
            cor: linha.get(2)?,
            criado_em: linha.get(3)?,
        })
    })?
    .collect::<Result<Vec<_>, _>>()
    .context("Falha ao listar tags")?;

    Ok(tags)
}

/// Cria uma nova tag.
pub fn criar_tag(conexao: &Connection, dados: &NovaTag) -> Result<Tag> {
    let id = Uuid::new_v4().to_string();
    let agora = Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();
    let cor = dados.cor.as_deref().unwrap_or("#6366f1");

    conexao.execute(
        "INSERT INTO tags (id, nome, cor, criado_em) VALUES (?1, ?2, ?3, ?4)",
        params![id, dados.nome, cor, agora],
    ).context("Falha ao criar tag")?;

    info!("Tag criada: {} ({})", dados.nome, id);
    Ok(Tag {
        id,
        nome: dados.nome.clone(),
        cor: cor.to_string(),
        criado_em: agora,
    })
}

/// Atualiza uma tag existente.
pub fn atualizar_tag(conexao: &Connection, id: &str, dados: &NovaTag) -> Result<Tag> {
    let cor = dados.cor.as_deref().unwrap_or("#6366f1");

    conexao.execute(
        "UPDATE tags SET nome = ?1, cor = ?2 WHERE id = ?3",
        params![dados.nome, cor, id],
    ).context("Falha ao atualizar tag")?;

    info!("Tag atualizada: {} ({})", dados.nome, id);

    conexao.query_row(
        "SELECT id, nome, cor, criado_em FROM tags WHERE id = ?1",
        params![id],
        |linha| {
            Ok(Tag {
                id: linha.get(0)?,
                nome: linha.get(1)?,
                cor: linha.get(2)?,
                criado_em: linha.get(3)?,
            })
        },
    ).with_context(|| format!("Tag não encontrada após atualização: {}", id))
}

/// Exclui uma tag. A tabela associativa item_tags é limpa via cascade.
pub fn excluir_tag(conexao: &Connection, id: &str) -> Result<()> {
    conexao.execute(
        "DELETE FROM tags WHERE id = ?1",
        params![id],
    ).context("Falha ao excluir tag")?;

    info!("Tag excluída: {}", id);
    Ok(())
}

/// Vincula uma tag a um item (relação N:N).
pub fn vincular_tag_a_item(conexao: &Connection, item_id: &str, tag_id: &str) -> Result<()> {
    conexao.execute(
        "INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?1, ?2)",
        params![item_id, tag_id],
    ).context("Falha ao vincular tag ao item")?;

    Ok(())
}

/// Remove a vinculação de uma tag a um item.
pub fn desvincular_tag_de_item(conexao: &Connection, item_id: &str, tag_id: &str) -> Result<()> {
    conexao.execute(
        "DELETE FROM item_tags WHERE item_id = ?1 AND tag_id = ?2",
        params![item_id, tag_id],
    ).context("Falha ao desvincular tag do item")?;

    Ok(())
}

/// Obtém todas as tags associadas a um item.
fn obter_tags_do_item(conexao: &Connection, item_id: &str) -> Result<Vec<Tag>> {
    let mut stmt = conexao.prepare(
        "SELECT t.id, t.nome, t.cor, t.criado_em
         FROM tags t
         INNER JOIN item_tags it ON t.id = it.tag_id
         WHERE it.item_id = ?1
         ORDER BY t.nome ASC",
    )?;

    let tags = stmt.query_map(params![item_id], |linha| {
        Ok(Tag {
            id: linha.get(0)?,
            nome: linha.get(1)?,
            cor: linha.get(2)?,
            criado_em: linha.get(3)?,
        })
    })?
    .collect::<Result<Vec<_>, _>>()
    .context("Falha ao obter tags do item")?;

    Ok(tags)
}

// =============================================================================
// ANEXOS — Operações CRUD para arquivos armazenados
// =============================================================================

/// Lista todos os anexos de um item.
pub fn listar_anexos_por_item(conexao: &Connection, item_id: &str) -> Result<Vec<Anexo>> {
    let mut stmt = conexao.prepare(
        "SELECT id, item_id, tarefa_id, nome_original, caminho_interno,
                tamanho, tipo_mime, hash_sha256, criado_em
         FROM anexos WHERE item_id = ?1 ORDER BY criado_em DESC",
    )?;

    let anexos = stmt.query_map(params![item_id], |linha| {
        Ok(Anexo {
            id: linha.get(0)?,
            item_id: linha.get(1)?,
            tarefa_id: linha.get(2)?,
            nome_original: linha.get(3)?,
            caminho_interno: linha.get(4)?,
            tamanho: linha.get(5)?,
            tipo_mime: linha.get(6)?,
            hash_sha256: linha.get(7)?,
            criado_em: linha.get(8)?,
        })
    })?
    .collect::<Result<Vec<_>, _>>()
    .context("Falha ao listar anexos do item")?;

    Ok(anexos)
}

/// Obtém um anexo pelo ID.
pub fn obter_anexo_por_id(conexao: &Connection, id: &str) -> Result<Anexo> {
    conexao.query_row(
        "SELECT id, item_id, tarefa_id, nome_original, caminho_interno,
                tamanho, tipo_mime, hash_sha256, criado_em
         FROM anexos WHERE id = ?1",
        params![id],
        |linha| {
            Ok(Anexo {
                id: linha.get(0)?,
                item_id: linha.get(1)?,
                tarefa_id: linha.get(2)?,
                nome_original: linha.get(3)?,
                caminho_interno: linha.get(4)?,
                tamanho: linha.get(5)?,
                tipo_mime: linha.get(6)?,
                hash_sha256: linha.get(7)?,
                criado_em: linha.get(8)?,
            })
        },
    ).with_context(|| format!("Anexo não encontrado: {}", id))
}

/// Registra um novo anexo no banco de dados.
/// O arquivo já deve ter sido copiado para o armazenamento pelo serviço de armazenamento.
///
/// Nota: no schema existente, hash_sha256 é NOT NULL. Se não fornecido,
/// usamos string vazia como placeholder (o serviço de armazenamento sempre
/// calcula o hash, então na prática nunca ficará vazio).
pub fn criar_anexo(conexao: &Connection, anexo: &Anexo) -> Result<Anexo> {
    let hash = anexo.hash_sha256.as_deref().unwrap_or("");

    conexao.execute(
        "INSERT INTO anexos (id, item_id, tarefa_id, nome_original, caminho_interno,
                             tamanho, tipo_mime, hash_sha256, criado_em)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            anexo.id,
            anexo.item_id,
            anexo.tarefa_id,
            anexo.nome_original,
            anexo.caminho_interno,
            anexo.tamanho,
            anexo.tipo_mime,
            hash,
            anexo.criado_em
        ],
    ).context("Falha ao criar registro de anexo")?;

    info!("Anexo registrado: {} ({})", anexo.nome_original, anexo.id);
    obter_anexo_por_id(conexao, &anexo.id)
}

/// Remove o registro de um anexo do banco.
/// O arquivo físico deve ser removido pelo serviço de armazenamento.
pub fn excluir_anexo(conexao: &Connection, id: &str) -> Result<()> {
    conexao.execute(
        "DELETE FROM anexos WHERE id = ?1",
        params![id],
    ).context("Falha ao excluir anexo")?;

    info!("Anexo excluído: {}", id);
    Ok(())
}

/// Lista todos os anexos de uma tarefa de checklist.
pub fn listar_anexos_por_tarefa(conexao: &Connection, tarefa_id: &str) -> Result<Vec<Anexo>> {
    let mut stmt = conexao.prepare(
        "SELECT id, item_id, tarefa_id, nome_original, caminho_interno,
                tamanho, tipo_mime, hash_sha256, criado_em
         FROM anexos WHERE tarefa_id = ?1 ORDER BY criado_em DESC",
    )?;

    let anexos = stmt.query_map(params![tarefa_id], |linha| {
        Ok(Anexo {
            id: linha.get(0)?,
            item_id: linha.get(1)?,
            tarefa_id: linha.get(2)?,
            nome_original: linha.get(3)?,
            caminho_interno: linha.get(4)?,
            tamanho: linha.get(5)?,
            tipo_mime: linha.get(6)?,
            hash_sha256: linha.get(7)?,
            criado_em: linha.get(8)?,
        })
    })?
    .collect::<Result<Vec<_>, _>>()
    .context("Falha ao listar anexos da tarefa")?;

    Ok(anexos)
}

// =============================================================================
// TAREFAS CHECKLIST — Operações CRUD para itens de checklist
// =============================================================================

/// Lista todas as tarefas de um item checklist, ordenadas pela posição.
pub fn listar_tarefas_por_item(conexao: &Connection, item_id: &str) -> Result<Vec<TarefaChecklist>> {
    let mut stmt = conexao.prepare(
        "SELECT id, item_id, titulo, concluida, ordem, criado_em, atualizado_em
         FROM tarefas_checklist WHERE item_id = ?1 ORDER BY ordem ASC",
    )?;

    let mut tarefas: Vec<TarefaChecklist> = stmt.query_map(params![item_id], |linha| {
        let concluida_int: i32 = linha.get(3)?;
        Ok(TarefaChecklist {
            id: linha.get(0)?,
            item_id: linha.get(1)?,
            titulo: linha.get(2)?,
            concluida: concluida_int != 0,
            ordem: linha.get(4)?,
            criado_em: linha.get(5)?,
            atualizado_em: linha.get(6)?,
            anexos: vec![],
        })
    })?
    .collect::<Result<Vec<_>, _>>()
    .context("Falha ao listar tarefas do checklist")?;

    // Carregar anexos de cada tarefa
    for tarefa in &mut tarefas {
        tarefa.anexos = listar_anexos_por_tarefa(conexao, &tarefa.id)?;
    }

    Ok(tarefas)
}

/// Cria uma nova tarefa de checklist.
/// Se a ordem não for especificada, coloca no final da lista.
pub fn criar_tarefa(conexao: &Connection, dados: &NovaTarefa) -> Result<TarefaChecklist> {
    let id = Uuid::new_v4().to_string();
    let agora = Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();

    // Se ordem não especificada, usar o próximo número disponível
    let ordem = match dados.ordem {
        Some(o) => o,
        None => {
            let max_ordem: i32 = conexao.query_row(
                "SELECT COALESCE(MAX(ordem), -1) FROM tarefas_checklist WHERE item_id = ?1",
                params![dados.item_id],
                |linha| linha.get(0),
            ).unwrap_or(0);
            max_ordem + 1
        }
    };

    conexao.execute(
        "INSERT INTO tarefas_checklist (id, item_id, titulo, concluida, ordem, criado_em, atualizado_em)
         VALUES (?1, ?2, ?3, 0, ?4, ?5, ?6)",
        params![id, dados.item_id, dados.titulo, ordem, agora, agora],
    ).context("Falha ao criar tarefa")?;

    info!("Tarefa criada: {} ({})", dados.titulo, id);
    obter_tarefa_por_id(conexao, &id)
}

/// Obtém uma tarefa pelo ID.
fn obter_tarefa_por_id(conexao: &Connection, id: &str) -> Result<TarefaChecklist> {
    let mut tarefa: TarefaChecklist = conexao.query_row(
        "SELECT id, item_id, titulo, concluida, ordem, criado_em, atualizado_em
         FROM tarefas_checklist WHERE id = ?1",
        params![id],
        |linha| {
            let concluida_int: i32 = linha.get(3)?;
            Ok(TarefaChecklist {
                id: linha.get(0)?,
                item_id: linha.get(1)?,
                titulo: linha.get(2)?,
                concluida: concluida_int != 0,
                ordem: linha.get(4)?,
                criado_em: linha.get(5)?,
                atualizado_em: linha.get(6)?,
                anexos: vec![],
            })
        },
    ).with_context(|| format!("Tarefa não encontrada: {}", id))?;

    tarefa.anexos = listar_anexos_por_tarefa(conexao, &tarefa.id)?;
    Ok(tarefa)
}

/// Atualiza uma tarefa existente (título, estado, ordem).
pub fn atualizar_tarefa(conexao: &Connection, id: &str, dados: &AtualizacaoTarefa) -> Result<TarefaChecklist> {
    let tarefa_atual = obter_tarefa_por_id(conexao, id)?;
    let agora = Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();

    let titulo = dados.titulo.as_deref().unwrap_or(&tarefa_atual.titulo);
    let concluida = dados.concluida.unwrap_or(tarefa_atual.concluida);
    let ordem = dados.ordem.unwrap_or(tarefa_atual.ordem);

    conexao.execute(
        "UPDATE tarefas_checklist SET titulo = ?1, concluida = ?2, ordem = ?3, atualizado_em = ?4
         WHERE id = ?5",
        params![titulo, concluida as i32, ordem, agora, id],
    ).context("Falha ao atualizar tarefa")?;

    info!("Tarefa atualizada: {}", id);
    obter_tarefa_por_id(conexao, id)
}

/// Exclui uma tarefa de checklist.
pub fn excluir_tarefa(conexao: &Connection, id: &str) -> Result<()> {
    conexao.execute(
        "DELETE FROM tarefas_checklist WHERE id = ?1",
        params![id],
    ).context("Falha ao excluir tarefa")?;

    info!("Tarefa excluída: {}", id);
    Ok(())
}

/// Marca/desmarca uma tarefa como concluída.
pub fn marcar_tarefa_concluida(conexao: &Connection, id: &str, concluida: bool) -> Result<TarefaChecklist> {
    let agora = Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();

    conexao.execute(
        "UPDATE tarefas_checklist SET concluida = ?1, atualizado_em = ?2 WHERE id = ?3",
        params![concluida as i32, agora, id],
    ).context("Falha ao marcar tarefa")?;

    info!("Tarefa {} marcada como {}", id, if concluida { "concluída" } else { "pendente" });
    obter_tarefa_por_id(conexao, id)
}

/// Reordena as tarefas de um checklist.
/// Recebe um vetor de (tarefa_id, nova_ordem) e atualiza todas em transação.
pub fn reordenar_tarefas(conexao: &Connection, ordens: &[(String, i32)]) -> Result<()> {
    let agora = Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();

    for (tarefa_id, nova_ordem) in ordens {
        conexao.execute(
            "UPDATE tarefas_checklist SET ordem = ?1, atualizado_em = ?2 WHERE id = ?3",
            params![nova_ordem, agora, tarefa_id],
        ).with_context(|| format!("Falha ao reordenar tarefa: {}", tarefa_id))?;
    }

    info!("Tarefas reordenadas: {} itens", ordens.len());
    Ok(())
}

// =============================================================================
// BUSCA FULL-TEXT — Pesquisa com FTS5 do SQLite
// =============================================================================

/// Busca itens usando Full-Text Search (FTS5).
/// O termo é pesquisado em título, descrição e conteúdo de notas.
/// Filtros adicionais podem restringir por tipo, pasta, tags e período.
///
/// A relevância é calculada pelo FTS5 rank (bm25). Valores mais negativos
/// indicam maior relevância, então invertemos o sinal para o frontend.
pub fn buscar_fts(conexao: &Connection, termo: &str, filtros: &FiltrosBusca) -> Result<Vec<ResultadoBusca>> {
    // Construir a query dinamicamente com base nos filtros.
    // A FTS5 do VaultCraft é standalone (não content-table), então possui
    // uma coluna 'id' UNINDEXED para vincular ao item original.
    // Usamos JOIN em itens_fts.id = i.id para obter os dados completos.
    let mut sql = String::from(
        "SELECT i.id, i.pasta_id, i.tipo, i.titulo, i.descricao, i.conteudo_nota,
                i.data_vencimento, i.criado_em, i.atualizado_em,
                -itens_fts.rank as relevancia
         FROM itens_fts
         INNER JOIN itens i ON itens_fts.id = i.id
         WHERE itens_fts MATCH ?1"
    );

    // Adicionar filtros dinamicamente
    let mut param_index = 2;
    let mut params_vec: Vec<Box<dyn rusqlite::types::ToSql>> = vec![
        Box::new(termo.to_string()),
    ];

    if let Some(ref tipo) = filtros.tipo {
        sql.push_str(&format!(" AND i.tipo = ?{}", param_index));
        params_vec.push(Box::new(tipo.to_string()));
        param_index += 1;
    }

    if let Some(ref pasta_id) = filtros.pasta_id {
        sql.push_str(&format!(" AND i.pasta_id = ?{}", param_index));
        params_vec.push(Box::new(pasta_id.clone()));
        param_index += 1;
    }

    if let Some(ref data_inicio) = filtros.data_inicio {
        sql.push_str(&format!(" AND i.criado_em >= ?{}", param_index));
        params_vec.push(Box::new(data_inicio.clone()));
        param_index += 1;
    }

    if let Some(ref data_fim) = filtros.data_fim {
        sql.push_str(&format!(" AND i.criado_em <= ?{}", param_index));
        params_vec.push(Box::new(data_fim.clone()));
        let _ = param_index; // Suprimir aviso de variável não usada
    }

    sql.push_str(" ORDER BY relevancia DESC LIMIT 100");

    let params_refs: Vec<&dyn rusqlite::types::ToSql> =
        params_vec.iter().map(|p| p.as_ref()).collect();

    let mut stmt = conexao.prepare(&sql)?;

    let mut resultados: Vec<ResultadoBusca> = stmt.query_map(params_refs.as_slice(), |linha| {
        let tipo_str: String = linha.get(2)?;
        Ok(ResultadoBusca {
            item: Item {
                id: linha.get(0)?,
                pasta_id: linha.get(1)?,
                tipo: TipoItem::de_str(&tipo_str),
                titulo: linha.get(3)?,
                descricao: linha.get(4)?,
                conteudo_nota: linha.get(5)?,
                data_vencimento: linha.get(6)?,
                criado_em: linha.get(7)?,
                atualizado_em: linha.get(8)?,
                tags: vec![],
                anexos: vec![],
            },
            relevancia: linha.get(9)?,
        })
    })?
    .collect::<Result<Vec<_>, _>>()
    .context("Falha na busca full-text")?;

    // Filtrar por tags se especificadas (feito em memória pois é mais simples
    // e o volume de dados é pequeno em um app pessoal)
    if let Some(ref tag_ids) = filtros.tag_ids {
        if !tag_ids.is_empty() {
            for resultado in &mut resultados {
                resultado.item.tags = obter_tags_do_item(conexao, &resultado.item.id)?;
            }
            resultados.retain(|r| {
                r.item.tags.iter().any(|t| tag_ids.contains(&t.id))
            });
        }
    }

    // Carregar tags e anexos dos resultados finais
    for resultado in &mut resultados {
        if resultado.item.tags.is_empty() {
            resultado.item.tags = obter_tags_do_item(conexao, &resultado.item.id)?;
        }
        resultado.item.anexos = listar_anexos_por_item(conexao, &resultado.item.id)?;
    }

    Ok(resultados)
}

// =============================================================================
// VENCIMENTOS — Consultas por data de vencimento
// =============================================================================

/// Lista itens com vencimento nos próximos N dias.
/// Útil para mostrar lembretes ao usuário.
pub fn listar_proximos_vencimentos(conexao: &Connection, dias: i64) -> Result<Vec<Item>> {
    let agora = Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();
    let limite = (Utc::now() + chrono::Duration::days(dias))
        .format("%Y-%m-%dT%H:%M:%SZ")
        .to_string();

    let mut stmt = conexao.prepare(
        "SELECT id, pasta_id, tipo, titulo, descricao, conteudo_nota,
                data_vencimento, criado_em, atualizado_em
         FROM itens
         WHERE data_vencimento IS NOT NULL
           AND data_vencimento >= ?1
           AND data_vencimento <= ?2
         ORDER BY data_vencimento ASC",
    )?;

    let mut itens: Vec<Item> = stmt.query_map(params![agora, limite], |linha| {
        let tipo_str: String = linha.get(2)?;
        Ok(Item {
            id: linha.get(0)?,
            pasta_id: linha.get(1)?,
            tipo: TipoItem::de_str(&tipo_str),
            titulo: linha.get(3)?,
            descricao: linha.get(4)?,
            conteudo_nota: linha.get(5)?,
            data_vencimento: linha.get(6)?,
            criado_em: linha.get(7)?,
            atualizado_em: linha.get(8)?,
            tags: vec![],
            anexos: vec![],
        })
    })?
    .collect::<Result<Vec<_>, _>>()
    .context("Falha ao listar próximos vencimentos")?;

    for item in &mut itens {
        item.tags = obter_tags_do_item(conexao, &item.id)?;
    }

    Ok(itens)
}

/// Lista itens com vencimento já expirado (atrasados).
pub fn listar_vencimentos_atrasados(conexao: &Connection) -> Result<Vec<Item>> {
    let agora = Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();

    let mut stmt = conexao.prepare(
        "SELECT id, pasta_id, tipo, titulo, descricao, conteudo_nota,
                data_vencimento, criado_em, atualizado_em
         FROM itens
         WHERE data_vencimento IS NOT NULL
           AND data_vencimento < ?1
         ORDER BY data_vencimento ASC",
    )?;

    let mut itens: Vec<Item> = stmt.query_map(params![agora], |linha| {
        let tipo_str: String = linha.get(2)?;
        Ok(Item {
            id: linha.get(0)?,
            pasta_id: linha.get(1)?,
            tipo: TipoItem::de_str(&tipo_str),
            titulo: linha.get(3)?,
            descricao: linha.get(4)?,
            conteudo_nota: linha.get(5)?,
            data_vencimento: linha.get(6)?,
            criado_em: linha.get(7)?,
            atualizado_em: linha.get(8)?,
            tags: vec![],
            anexos: vec![],
        })
    })?
    .collect::<Result<Vec<_>, _>>()
    .context("Falha ao listar vencimentos atrasados")?;

    for item in &mut itens {
        item.tags = obter_tags_do_item(conexao, &item.id)?;
    }

    Ok(itens)
}

// =============================================================================
// AUDITORIA — Log de eventos para rastreabilidade
// =============================================================================

/// Registra um evento no log de auditoria.
/// Chamado internamente pelos serviços após cada operação importante.
///
/// Nota: no schema existente, entidade_id é NOT NULL.
/// Se nenhum ID de entidade for fornecido, usamos "sistema" como placeholder
/// para eventos globais (backup, restauração, etc.)
pub fn registrar_evento_auditoria(
    conexao: &Connection,
    tipo_evento: &str,
    entidade_tipo: &str,
    entidade_id: Option<&str>,
    detalhes: Option<&str>,
) -> Result<()> {
    let id = Uuid::new_v4().to_string();
    let agora = Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();
    // entidade_id é NOT NULL no schema, usar "sistema" como fallback
    let entidade_id_valor = entidade_id.unwrap_or("sistema");

    conexao.execute(
        "INSERT INTO log_auditoria (id, tipo_evento, entidade_tipo, entidade_id, detalhes, criado_em)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, tipo_evento, entidade_tipo, entidade_id_valor, detalhes, agora],
    ).context("Falha ao registrar evento de auditoria")?;

    Ok(())
}

/// Lista eventos de auditoria com filtros opcionais.
pub fn listar_eventos_auditoria(conexao: &Connection, filtros: &FiltrosAuditoria) -> Result<Vec<LogAuditoria>> {
    let mut sql = String::from(
        "SELECT id, tipo_evento, entidade_tipo, entidade_id, detalhes, criado_em
         FROM log_auditoria WHERE 1=1"
    );

    let mut param_index = 1;
    let mut params_vec: Vec<Box<dyn rusqlite::types::ToSql>> = vec![];

    if let Some(ref tipo) = filtros.tipo_evento {
        sql.push_str(&format!(" AND tipo_evento = ?{}", param_index));
        params_vec.push(Box::new(tipo.clone()));
        param_index += 1;
    }

    if let Some(ref entidade_tipo) = filtros.entidade_tipo {
        sql.push_str(&format!(" AND entidade_tipo = ?{}", param_index));
        params_vec.push(Box::new(entidade_tipo.clone()));
        param_index += 1;
    }

    if let Some(ref entidade_id) = filtros.entidade_id {
        sql.push_str(&format!(" AND entidade_id = ?{}", param_index));
        params_vec.push(Box::new(entidade_id.clone()));
        let _ = param_index;
    }

    sql.push_str(" ORDER BY criado_em DESC");

    let limite = filtros.limite.unwrap_or(100);
    let offset = filtros.offset.unwrap_or(0);
    sql.push_str(&format!(" LIMIT {} OFFSET {}", limite, offset));

    let params_refs: Vec<&dyn rusqlite::types::ToSql> =
        params_vec.iter().map(|p| p.as_ref()).collect();

    let mut stmt = conexao.prepare(&sql)?;

    let eventos = stmt.query_map(params_refs.as_slice(), |linha| {
        Ok(LogAuditoria {
            id: linha.get(0)?,
            tipo_evento: linha.get(1)?,
            entidade_tipo: linha.get(2)?,
            entidade_id: linha.get(3)?,
            detalhes: linha.get(4)?,
            criado_em: linha.get(5)?,
        })
    })?
    .collect::<Result<Vec<_>, _>>()
    .context("Falha ao listar eventos de auditoria")?;

    Ok(eventos)
}

// =============================================================================
// CONFIGURACOES — Pares chave/valor para preferências
// =============================================================================

/// Obtém o valor de uma configuração pela chave.
pub fn obter_configuracao(conexao: &Connection, chave: &str) -> Result<Option<Configuracao>> {
    let resultado = conexao.query_row(
        "SELECT chave, valor, atualizado_em FROM configuracoes WHERE chave = ?1",
        params![chave],
        |linha| {
            Ok(Configuracao {
                chave: linha.get(0)?,
                valor: linha.get(1)?,
                atualizado_em: linha.get(2)?,
            })
        },
    );

    match resultado {
        Ok(config) => Ok(Some(config)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(anyhow!(e).context("Falha ao obter configuração")),
    }
}

/// Salva uma configuração (cria ou atualiza).
/// Usa UPSERT (INSERT OR REPLACE) para simplificar.
pub fn salvar_configuracao(conexao: &Connection, chave: &str, valor: &str) -> Result<Configuracao> {
    let agora = Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();

    conexao.execute(
        "INSERT INTO configuracoes (chave, valor, atualizado_em) VALUES (?1, ?2, ?3)
         ON CONFLICT(chave) DO UPDATE SET valor = ?2, atualizado_em = ?3",
        params![chave, valor, agora],
    ).context("Falha ao salvar configuração")?;

    Ok(Configuracao {
        chave: chave.to_string(),
        valor: Some(valor.to_string()),
        atualizado_em: agora,
    })
}

/// Lista todas as configurações.
pub fn listar_configuracoes(conexao: &Connection) -> Result<Vec<Configuracao>> {
    let mut stmt = conexao.prepare(
        "SELECT chave, valor, atualizado_em FROM configuracoes ORDER BY chave ASC",
    )?;

    let configs = stmt.query_map([], |linha| {
        Ok(Configuracao {
            chave: linha.get(0)?,
            valor: linha.get(1)?,
            atualizado_em: linha.get(2)?,
        })
    })?
    .collect::<Result<Vec<_>, _>>()
    .context("Falha ao listar configurações")?;

    Ok(configs)
}

// =============================================================================
// UTILITARIOS — Funções auxiliares para contagens e manutenção
// =============================================================================

/// Conta o total de itens no banco (usado no manifesto de backup).
pub fn contar_itens(conexao: &Connection) -> Result<i64> {
    conexao.query_row(
        "SELECT COUNT(*) FROM itens",
        [],
        |linha| linha.get(0),
    ).context("Falha ao contar itens")
}

/// Conta o total de anexos no banco (usado no manifesto de backup).
pub fn contar_anexos(conexao: &Connection) -> Result<i64> {
    conexao.query_row(
        "SELECT COUNT(*) FROM anexos",
        [],
        |linha| linha.get(0),
    ).context("Falha ao contar anexos")
}

/// Lista todos os caminhos internos de anexos (usado no backup).
pub fn listar_caminhos_anexos(conexao: &Connection) -> Result<Vec<String>> {
    let mut stmt = conexao.prepare(
        "SELECT caminho_interno FROM anexos",
    )?;

    let caminhos = stmt.query_map([], |linha| {
        linha.get(0)
    })?
    .collect::<Result<Vec<String>, _>>()
    .context("Falha ao listar caminhos de anexos")?;

    Ok(caminhos)
}

/// Executa VACUUM no banco para compactar e otimizar.
/// Útil após grandes exclusões para recuperar espaço em disco.
pub fn compactar_banco(conexao: &Connection) -> Result<()> {
    conexao.execute_batch("VACUUM;")
        .context("Falha ao compactar banco de dados")?;

    info!("Banco de dados compactado com VACUUM.");
    Ok(())
}

/// Lista itens de uma pasta específica para exportação de pacote.
/// Inclui todos os dados necessários para reconstruir o pacote.
pub fn listar_itens_completos_da_pasta(conexao: &Connection, pasta_id: &str) -> Result<Vec<Item>> {
    // Reutiliza a função existente que já carrega tags e anexos
    listar_itens_por_pasta(conexao, pasta_id)
}

/// Lista todas as subpastas de uma pasta recursivamente.
/// Útil para exportação de pacotes completos.
pub fn listar_subpastas_recursivas(conexao: &Connection, pasta_id: &str) -> Result<Vec<Pasta>> {
    let pasta = obter_pasta_por_id(conexao, pasta_id)?;

    let mut stmt = conexao.prepare(
        "SELECT id, pasta_pai_id, nome, caminho, criado_em, atualizado_em
         FROM pastas WHERE caminho LIKE ?1 ORDER BY caminho ASC",
    )?;

    let pastas = stmt.query_map(params![format!("{}/%", pasta.caminho)], |linha| {
        Ok(Pasta {
            id: linha.get(0)?,
            pasta_pai_id: linha.get(1)?,
            nome: linha.get(2)?,
            caminho: linha.get(3)?,
            criado_em: linha.get(4)?,
            atualizado_em: linha.get(5)?,
        })
    })?
    .collect::<Result<Vec<_>, _>>()
    .context("Falha ao listar subpastas recursivas")?;

    Ok(pastas)
}
