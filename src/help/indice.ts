export interface TopicoAjuda {
  id: string;
  titulo: string;
  arquivo: string;
  palavrasChave: string[];
}

export const indiceAjuda: TopicoAjuda[] = [
  { id: 'boas-vindas', titulo: 'Bem-vindo ao VaultCraft', arquivo: '01_boas_vindas', palavrasChave: ['inicio', 'comecar', 'sobre'] },
  { id: 'pastas-tags', titulo: 'Pastas e Tags', arquivo: '02_pastas_e_tags', palavrasChave: ['pasta', 'tag', 'organizar', 'categoria'] },
  { id: 'itens-anexos', titulo: 'Itens e Anexos', arquivo: '03_itens_e_anexos', palavrasChave: ['nota', 'documento', 'arquivo', 'pdf', 'anexo'] },
  { id: 'checklists', titulo: 'Checklists', arquivo: '04_checklists', palavrasChave: ['tarefa', 'lista', 'checklist', 'concluir'] },
  { id: 'busca', titulo: 'Busca Instantânea', arquivo: '05_busca', palavrasChave: ['buscar', 'pesquisar', 'encontrar', 'filtro'] },
  { id: 'vencimentos', titulo: 'Vencimentos', arquivo: '06_vencimentos', palavrasChave: ['vencer', 'prazo', 'alerta', 'validade'] },
  { id: 'backup-restore', titulo: 'Backup e Restauração', arquivo: '07_backup_e_restore', palavrasChave: ['backup', 'restaurar', 'salvar', 'seguranca'] },
  { id: 'pacotes-vault', titulo: 'Pacotes Vault', arquivo: '08_pacotes_vault', palavrasChave: ['pacote', 'exportar', 'importar', 'pendrive'] },
  { id: 'privacidade', titulo: 'Privacidade e Segurança', arquivo: '09_privacidade_e_criptografia', palavrasChave: ['privacidade', 'criptografia', 'pin', 'seguro'] },
  { id: 'atalhos', titulo: 'Atalhos e Dicas', arquivo: '10_atalhos_e_dicas', palavrasChave: ['atalho', 'teclado', 'dica', 'rapido'] },
  { id: 'problemas', titulo: 'Solução de Problemas', arquivo: '11_solucoes_de_problemas', palavrasChave: ['problema', 'erro', 'lento', 'resolver'] },
];
