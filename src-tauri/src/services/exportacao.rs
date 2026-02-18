// =============================================================================
// VaultCraft — Serviço de Exportação
// =============================================================================
// Exporta itens do cofre em formatos úteis para compartilhamento:
// - HTML: formatado para impressão/conversão em PDF pelo navegador
// - CSV: para importação em planilhas (Excel, Google Sheets, etc.)
//
// Decisão de design:
//   Gerar PDF diretamente em Rust é complexo e requer dependências pesadas.
//   Para o MVP, geramos HTML bem formatado que o usuário pode abrir no
//   navegador e "Imprimir como PDF". Isso cobre 95% dos casos de uso
//   com zero dependências adicionais.
// =============================================================================

use anyhow::{Context, Result};
use chrono::Utc;
use log::info;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

use crate::db::models::{Item, TipoItem};

/// Exporta um item como arquivo HTML formatado para impressão.
///
/// O HTML gerado inclui:
/// - Estilos CSS embutidos (inline) para funcionar sem internet
/// - Layout otimizado para impressão (@media print)
/// - Metadados do item (tipo, pasta, tags, data de criação)
/// - Conteúdo formatado de acordo com o tipo do item
///
/// Para converter em PDF, o usuário pode abrir no navegador e usar Ctrl+P.
pub fn exportar_item_html(item: &Item, destino: &Path) -> Result<PathBuf> {
    let nome_limpo = item.titulo
        .replace(|c: char| !c.is_alphanumeric() && c != '_' && c != '-' && c != ' ', "")
        .replace(' ', "_");

    let nome_arquivo = format!("{}.html", nome_limpo);
    let caminho_arquivo = destino.join(&nome_arquivo);

    info!("Exportando item '{}' como HTML para: {:?}", item.titulo, caminho_arquivo);

    // Montar o conteúdo principal baseado no tipo do item
    let conteudo_html = match item.tipo {
        TipoItem::Nota => formatar_nota_html(item),
        TipoItem::Documento => formatar_documento_html(item),
        TipoItem::Checklist => formatar_checklist_html(item),
    };

    // Montar tags como badges
    let tags_html = if item.tags.is_empty() {
        String::new()
    } else {
        let badges: Vec<String> = item.tags.iter().map(|tag| {
            format!(
                r#"<span class="tag" style="background-color: {};">{}</span>"#,
                tag.cor, tag.nome
            )
        }).collect();
        format!(r#"<div class="tags">{}</div>"#, badges.join(" "))
    };

    // Data de vencimento se existir
    let vencimento_html = match &item.data_vencimento {
        Some(data) => format!(
            r#"<p class="meta"><strong>Vencimento:</strong> {}</p>"#,
            data
        ),
        None => String::new(),
    };

    // HTML completo com CSS embutido
    let html = format!(
        r#"<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{titulo} — VaultCraft</title>
    <style>
        /* Estilos base — design limpo e legível */
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1a1a2e;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #ffffff;
        }}
        h1 {{
            font-size: 1.8rem;
            margin-bottom: 8px;
            color: #16213e;
        }}
        .meta {{
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 4px;
        }}
        .tags {{
            margin: 12px 0;
        }}
        .tag {{
            display: inline-block;
            padding: 2px 10px;
            border-radius: 12px;
            color: white;
            font-size: 0.8rem;
            margin-right: 6px;
        }}
        .divider {{
            border: none;
            border-top: 2px solid #e8e8e8;
            margin: 20px 0;
        }}
        .conteudo {{
            margin-top: 20px;
            white-space: pre-wrap;
            font-size: 1rem;
        }}
        .checklist-item {{
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
            display: flex;
            align-items: center;
        }}
        .checklist-item .checkbox {{
            width: 18px;
            height: 18px;
            border: 2px solid #ccc;
            border-radius: 3px;
            margin-right: 12px;
            flex-shrink: 0;
        }}
        .checklist-item.concluida .checkbox {{
            background: #22c55e;
            border-color: #22c55e;
        }}
        .checklist-item.concluida .titulo-tarefa {{
            text-decoration: line-through;
            color: #999;
        }}
        .anexos {{
            margin-top: 16px;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 8px;
        }}
        .anexos h3 {{
            font-size: 0.95rem;
            margin-bottom: 8px;
            color: #444;
        }}
        .anexos li {{
            font-size: 0.85rem;
            margin-bottom: 4px;
        }}
        .rodape {{
            margin-top: 40px;
            padding-top: 16px;
            border-top: 1px solid #e8e8e8;
            font-size: 0.75rem;
            color: #999;
            text-align: center;
        }}
        /* Estilos para impressão */
        @media print {{
            body {{ padding: 20px; }}
            .tag {{ border: 1px solid #ccc; }}
        }}
    </style>
</head>
<body>
    <h1>{titulo}</h1>
    <p class="meta"><strong>Tipo:</strong> {tipo}</p>
    <p class="meta"><strong>Criado em:</strong> {criado_em}</p>
    <p class="meta"><strong>Atualizado em:</strong> {atualizado_em}</p>
    {vencimento}
    {tags}
    <hr class="divider">
    {conteudo}
    {anexos}
    <div class="rodape">
        Exportado pelo VaultCraft em {data_exportacao}
    </div>
</body>
</html>"#,
        titulo = html_escape(&item.titulo),
        tipo = item.tipo,
        criado_em = item.criado_em,
        atualizado_em = item.atualizado_em,
        vencimento = vencimento_html,
        tags = tags_html,
        conteudo = conteudo_html,
        anexos = formatar_anexos_html(item),
        data_exportacao = Utc::now().format("%d/%m/%Y %H:%M UTC"),
    );

    // Escrever arquivo
    let mut arquivo = fs::File::create(&caminho_arquivo)
        .context("Falha ao criar arquivo HTML")?;
    arquivo.write_all(html.as_bytes())
        .context("Falha ao escrever arquivo HTML")?;

    info!("Item exportado como HTML: {:?}", caminho_arquivo);
    Ok(caminho_arquivo)
}

/// Exporta uma lista de itens como arquivo CSV.
///
/// Colunas: titulo, tipo, tags, criado_em, atualizado_em, data_vencimento
/// Usa ponto-e-vírgula como separador (padrão brasileiro, melhor para Excel PT-BR).
/// Tags são separadas por vírgula dentro da mesma célula.
pub fn exportar_lista_csv(itens: &[Item], destino: &Path) -> Result<PathBuf> {
    let agora = Utc::now().format("%Y%m%d_%H%M%S").to_string();
    let nome_arquivo = format!("vaultcraft_itens_{}.csv", agora);
    let caminho_arquivo = destino.join(&nome_arquivo);

    info!("Exportando {} itens como CSV para: {:?}", itens.len(), caminho_arquivo);

    let mut arquivo = fs::File::create(&caminho_arquivo)
        .context("Falha ao criar arquivo CSV")?;

    // BOM (Byte Order Mark) para que o Excel reconheça UTF-8 corretamente
    arquivo.write_all(&[0xEF, 0xBB, 0xBF])
        .context("Falha ao escrever BOM")?;

    // Cabeçalho
    writeln!(arquivo, "Titulo;Tipo;Tags;Criado Em;Atualizado Em;Vencimento")
        .context("Falha ao escrever cabeçalho CSV")?;

    // Dados
    for item in itens {
        let tags_str = item.tags.iter()
            .map(|t| t.nome.as_str())
            .collect::<Vec<_>>()
            .join(", ");

        let vencimento = item.data_vencimento.as_deref().unwrap_or("");

        writeln!(
            arquivo,
            "{};{};{};{};{};{}",
            csv_escape(&item.titulo),
            item.tipo,
            csv_escape(&tags_str),
            item.criado_em,
            item.atualizado_em,
            vencimento,
        ).context("Falha ao escrever linha CSV")?;
    }

    info!("CSV exportado: {:?} ({} itens)", caminho_arquivo, itens.len());
    Ok(caminho_arquivo)
}

// =============================================================================
// FUNCOES AUXILIARES DE FORMATACAO
// =============================================================================

/// Formata o conteúdo de uma nota como HTML.
fn formatar_nota_html(item: &Item) -> String {
    let conteudo = item.conteudo_nota.as_deref().unwrap_or("(sem conteúdo)");
    format!(
        r#"<div class="conteudo">{}</div>"#,
        html_escape(conteudo)
    )
}

/// Formata o conteúdo de um documento como HTML.
fn formatar_documento_html(item: &Item) -> String {
    let descricao = item.descricao.as_deref().unwrap_or("(sem descrição)");
    format!(
        r#"<div class="conteudo">
            <p>{}</p>
        </div>"#,
        html_escape(descricao)
    )
}

/// Formata um checklist como HTML com checkboxes visuais.
fn formatar_checklist_html(item: &Item) -> String {
    let descricao = match &item.descricao {
        Some(d) => format!(r#"<p class="conteudo">{}</p>"#, html_escape(d)),
        None => String::new(),
    };

    // Nota: as tarefas não estão no struct Item diretamente,
    // mas o conteudo_nota pode conter uma representação textual.
    // Para o MVP, mostramos a descrição do item.
    let conteudo = item.conteudo_nota.as_deref().unwrap_or("");

    format!(
        r#"{}
        <div class="conteudo">{}</div>"#,
        descricao,
        html_escape(conteudo)
    )
}

/// Formata a lista de anexos como HTML.
fn formatar_anexos_html(item: &Item) -> String {
    if item.anexos.is_empty() {
        return String::new();
    }

    let itens_lista: Vec<String> = item.anexos.iter().map(|anexo| {
        format!(
            "<li>{} ({}, {})</li>",
            html_escape(&anexo.nome_original),
            anexo.tipo_mime,
            formatar_tamanho(anexo.tamanho)
        )
    }).collect();

    format!(
        r#"<div class="anexos">
            <h3>Anexos ({} arquivo{})</h3>
            <ul>{}</ul>
        </div>"#,
        item.anexos.len(),
        if item.anexos.len() == 1 { "" } else { "s" },
        itens_lista.join("\n            ")
    )
}

/// Escapa caracteres especiais do HTML para prevenir XSS.
fn html_escape(texto: &str) -> String {
    texto
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}

/// Escapa um valor para uso em CSV com ponto-e-vírgula como separador.
/// Envolve em aspas duplas se contiver caracteres especiais.
fn csv_escape(valor: &str) -> String {
    if valor.contains(';') || valor.contains('"') || valor.contains('\n') {
        format!("\"{}\"", valor.replace('"', "\"\""))
    } else {
        valor.to_string()
    }
}

/// Formata um tamanho em bytes para exibição humana (KB, MB, etc.).
fn formatar_tamanho(bytes: i64) -> String {
    const KB: i64 = 1024;
    const MB: i64 = KB * 1024;
    const GB: i64 = MB * 1024;

    if bytes >= GB {
        format!("{:.1} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.1} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.1} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} bytes", bytes)
    }
}
