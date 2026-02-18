export const conteudoAjuda: Record<string, string> = {

  '01_boas_vindas': `## Bem-vindo ao VaultCraft

**Seu cofre pessoal, 100% offline.**

O VaultCraft foi criado para ser o lugar onde você guarda tudo o que importa: documentos, anotações, checklists e arquivos -- tudo organizado do seu jeito, sem depender de internet ou serviços na nuvem.

### O que o VaultCraft faz por você

- **Notas** -- escreva anotações rápidas ou textos mais longos com formatação Markdown.
- **Documentos** -- cadastre seus documentos importantes e anexe arquivos (PDFs, fotos, contratos...).
- **Checklists** -- crie listas de tarefas com progresso visual e anexos em cada item.
- **Pastas e Tags** -- organize tudo em pastas e subpastas, e use tags para classificar por tema.
- **Busca instantânea** -- encontre qualquer coisa em segundos, mesmo com milhares de itens.
- **Vencimentos** -- acompanhe prazos e validades com alertas dentro do app.
- **Backup com 1 clique** -- salve e restaure todos os seus dados de forma simples e segura.
- **Pacotes Vault** -- exporte pastas inteiras para levar no pendrive ou arquivar.

### Sua privacidade em primeiro lugar

O VaultCraft funciona **100% offline**. Ele nunca se conecta à internet. Nenhum dado seu é enviado para lugar nenhum -- sem telemetria, sem analytics, sem nuvem. Seus dados ficam no **seu** computador, e só você tem acesso a eles.

### Comece em 5 passos

1. **Crie uma pasta** -- clique em "Nova Pasta" no painel lateral para criar sua primeira pasta (ex: "Documentos Pessoais").
2. **Adicione um item** -- dentro da pasta, clique em "Novo Item" e escolha entre Nota, Documento ou Checklist.
3. **Anexe arquivos** -- arraste ou selecione arquivos para anexar ao item (PDFs, imagens, qualquer tipo).
4. **Organize com tags** -- crie tags como "Urgente", "Saúde" ou "Casa" para classificar seus itens.
5. **Faça um backup** -- vá em Configurações e clique em "Fazer Backup" para salvar tudo com segurança.

Pronto! Agora é só explorar. Se tiver dúvidas, pressione **F1** a qualquer momento para voltar a esta ajuda.`,

  '02_pastas_e_tags': `## Pastas e Tags

Pastas e tags são as duas formas de organizar seus itens no VaultCraft. Pense nas pastas como gavetas de um arquivo, e nas tags como etiquetas coloridas que você cola nos documentos.

### Criando pastas

- Clique em **"Nova Pasta"** no painel lateral esquerdo.
- Dê um nome descritivo (ex: "Carro", "Saúde", "Casa").
- Para criar uma **subpasta**, clique com o botão direito em uma pasta existente e escolha "Nova Subpasta".
- Você pode criar quantos níveis quiser: Casa > Contas > Energia.

### Gerenciando pastas

- **Renomear** -- clique com o botão direito na pasta e escolha "Renomear".
- **Mover** -- arraste a pasta para dentro de outra, ou use o menu de contexto.
- **Excluir** -- clique com o botão direito e escolha "Excluir". Os itens dentro da pasta também serão removidos, então tenha cuidado!

### Navegação por breadcrumb

Quando você entra em subpastas, o VaultCraft mostra o caminho completo no topo da tela (ex: Casa > Contas > Energia). Clique em qualquer parte do caminho para voltar rapidamente.

### Criando e gerenciando tags

- Vá em **Configurações > Tags** ou crie uma tag diretamente ao editar um item.
- Cada tag tem um nome e uma cor para facilitar a identificação visual.
- Você pode renomear ou excluir tags a qualquer momento.

### Usando tags nos itens

- Ao criar ou editar um item, clique no campo de tags e selecione as tags desejadas.
- Um mesmo item pode ter **várias tags** ao mesmo tempo.
- Na lista de itens, clique em uma tag para filtrar e ver apenas os itens com aquela tag.

### Dicas de organização

Não existe jeito certo ou errado -- o melhor é o que funciona para você. Aqui vão algumas ideias:

- **Por área da vida**: Carro, Saúde, Casa, Trabalho, Finanças
- **Por projeto**: Reforma da cozinha, Viagem para Gramado, Matrícula escolar
- **Tags transversais**: "Urgente", "Vence em breve", "Pago", "Pendente"

Combine pastas (para localização) com tags (para classificação) e você vai encontrar tudo rapidamente.`,

  '03_itens_e_anexos': `## Itens e Anexos

No VaultCraft, tudo que você guarda é um **item**. Existem três tipos de itens, cada um com seu propósito.

### Tipos de itens

- **Nota** -- para anotações livres, lembretes, textos e observações. Suporta formatação Markdown.
- **Documento** -- para cadastrar um documento importante (RG, contrato, apólice, receita médica). Ideal para combinar descrição + anexos.
- **Checklist** -- para listas de tarefas com itens que podem ser marcados como concluídos.

### Criando e editando itens

1. Navegue até a pasta desejada.
2. Clique em **"Novo Item"** (ou use **Ctrl+N**).
3. Escolha o tipo: Nota, Documento ou Checklist.
4. Preencha o título, a descrição e os campos específicos do tipo.
5. Clique em "Salvar".

Para editar, basta clicar no item e fazer as alterações.

### Formatação Markdown nas notas

Nas notas, você pode usar Markdown para formatar o texto:

- **Negrito**: \`**texto**\`
- *Itálico*: \`*texto*\`
- Listas com \`-\` ou \`1.\`
- Links: \`[texto](url)\`
- Cabeçalhos: \`## Título\`

O VaultCraft mostra uma prévia formatada ao lado do editor.

### Anexando arquivos

Você pode anexar qualquer tipo de arquivo a um item:

- Clique no botão **"Anexar"** dentro do item.
- Selecione o arquivo no seu computador (PDF, imagem, planilha, qualquer coisa).
- O arquivo será **copiado** para o cofre do VaultCraft.
- Você pode anexar vários arquivos a um mesmo item.

### Abrindo anexos

Clique no anexo para abri-lo com o programa padrão do Windows. Por exemplo, um PDF vai abrir no seu leitor de PDF, uma imagem no visualizador de fotos.

### Removendo anexos

Clique no ícone de lixeira ao lado do anexo. O arquivo será removido do cofre, mas **não** do local original no seu computador (se ainda existir lá).

### Dica importante

O VaultCraft copia os arquivos para dentro do seu cofre. Isso significa que, mesmo que você apague o arquivo original, a cópia no cofre continua segura. Porém, é sempre bom manter os originais em um lugar seguro também -- especialmente documentos muito importantes.`,

  '04_checklists': `## Checklists

Checklists são perfeitos para organizar tarefas, acompanhar etapas de um processo ou garantir que você não esqueça nada. O VaultCraft torna isso simples e visual.

### Criando um checklist

1. Navegue até a pasta desejada.
2. Clique em **"Novo Item"** e escolha **Checklist**.
3. Dê um título descritivo (ex: "Checklist de Viagem").
4. Adicione uma descrição geral, se quiser.
5. Comece a adicionar tarefas.

### Adicionando e editando tarefas

- Clique em **"Adicionar tarefa"** para criar uma nova tarefa no checklist.
- Digite o texto da tarefa (ex: "Comprar passagens aéreas").
- Para editar, clique diretamente no texto da tarefa.
- Cada tarefa pode ter um texto descritivo e até **anexos próprios**.

### Reordenando tarefas

Arraste as tarefas para reorganizar a ordem. Coloque as mais importantes ou urgentes no topo para facilitar o acompanhamento.

### Marcando tarefas como concluídas

Clique na caixa de seleção ao lado da tarefa para marcá-la como concluída. A tarefa fica riscada para indicar que foi feita.

### Progresso visual

O VaultCraft mostra uma **barra de progresso** com a porcentagem de tarefas concluídas. Assim você sabe exatamente quanto falta para terminar -- por exemplo, "7 de 10 tarefas (70%)".

### Anexos em tarefas individuais

Cada tarefa pode ter seus próprios anexos. Isso é útil quando uma tarefa tem um documento relacionado. Por exemplo, na tarefa "Enviar comprovante", você pode anexar o PDF do comprovante diretamente nela.

### Exportando para PDF

Precisa imprimir ou compartilhar o checklist? Clique em **"Exportar para PDF"** no menu do item. O VaultCraft gera um PDF formatado com todas as tarefas e seus status.

### Exemplos práticos

- **Viagem**: passaporte, reservas, seguro viagem, roupas, carregadores, remédios
- **Mudança**: contratar frete, embalar caixas, transferir contas, atualizar endereço
- **Entrega de projeto**: revisar documentação, testar funcionalidades, preparar apresentação, enviar ao cliente

Os checklists ajudam você a transformar qualquer processo em etapas claras e organizadas.`,

  '05_busca': `## Busca Instantânea

O VaultCraft usa um mecanismo de busca rápido e inteligente que encontra seus itens em milissegundos, mesmo com milhares de registros no cofre.

### Como funciona

Por baixo dos panos, o VaultCraft utiliza uma tecnologia chamada **FTS5** (Full-Text Search), que indexa todo o conteúdo dos seus itens. Na prática, isso significa que a busca é muito rápida e não precisa percorrer item por item -- ela já sabe onde cada palavra está.

### O que é pesquisado

Quando você digita algo na busca, o VaultCraft procura em:

- **Título** do item
- **Descrição** do item
- **Conteúdo** das notas
- **Nomes das tags** associadas
- **Tarefas** dos checklists

### Como usar a busca

1. Pressione **Ctrl+K** (ou clique no campo de busca no topo da tela).
2. Digite uma ou mais palavras-chave.
3. Os resultados aparecem instantaneamente conforme você digita.

### Usando filtros

Além do texto, você pode refinar a busca com filtros:

- **Pasta** -- buscar apenas dentro de uma pasta específica.
- **Tipo** -- filtrar por Nota, Documento ou Checklist.
- **Tags** -- mostrar apenas itens com determinadas tags.
- **Vencimento** -- filtrar itens por status de vencimento (vencido, próximo de vencer, etc.).

Combine texto com filtros para resultados ainda mais precisos.

### Ordenação dos resultados

Você pode ordenar os resultados por:

- **Relevância** -- os itens mais relevantes para a sua busca aparecem primeiro (padrão).
- **Data de criação** -- itens mais recentes ou mais antigos primeiro.
- **Vencimento** -- itens que vencem antes aparecem primeiro.

### Dicas para buscar melhor

- **Use palavras-chave diretas**: em vez de "documento do carro que vence em março", tente "carro vencimento" ou "IPVA".
- **Palavras parciais funcionam**: digitar "segu" vai encontrar "seguro", "segurança", etc.
- **Menos é mais**: comece com poucas palavras e adicione mais só se precisar refinar.
- **Combine com filtros**: se você sabe que é um documento, selecione o filtro de tipo para reduzir os resultados.

A busca é sua melhor amiga para encontrar rapidamente qualquer coisa no cofre.`,

  '06_vencimentos': `## Vencimentos

Muitos documentos e compromissos têm prazos e datas de validade. O VaultCraft ajuda você a acompanhar tudo isso para que nada passe despercebido.

### Adicionando uma data de vencimento

Ao criar ou editar qualquer item (Nota, Documento ou Checklist), você encontra o campo **"Data de vencimento"**. Basta selecionar a data e salvar.

Exemplos de uso:

- Validade da CNH
- Vencimento do seguro do carro
- Prazo de renovação de contrato
- Data limite para entregar um projeto
- Validade de um exame médico

### Painel de vencimentos

O VaultCraft tem um **painel de vencimentos** dedicado, acessível pelo menu lateral. Ele organiza seus itens em abas para facilitar a visualização:

- **Vencidos** -- itens cuja data de vencimento já passou. Estes precisam de atenção imediata.
- **Próximos 7 dias** -- itens que vencem na próxima semana.
- **Próximos 30 dias** -- itens que vencem no próximo mês.
- **Próximos 90 dias** -- itens que vencem nos próximos três meses.

### Alertas visuais

O VaultCraft mostra **badges** (indicadores numéricos) no menu lateral para que você saiba quantos itens estão vencidos ou próximos de vencer, sem precisar abrir o painel. Assim, toda vez que abrir o app, você já sabe se há algo que precisa de atenção.

### Exemplos práticos

| Documento | Vencimento típico |
|---|---|
| Seguro do carro | Anual |
| Vistoria / IPVA | Anual |
| CNH | A cada 5 ou 10 anos |
| Contrato de aluguel | Anual ou conforme contrato |
| Exame médico periódico | Anual |
| Passaporte | A cada 10 anos |
| Certificado digital | 1 a 3 anos |

### Dica

Crie o hábito de cadastrar a data de vencimento sempre que adicionar um documento com prazo. Assim o VaultCraft trabalha por você, avisando quando algo estiver perto de vencer. Você nunca mais vai perder um prazo por esquecimento.`,

  '07_backup_e_restore': `## Backup e Restauração

Seus dados são preciosos. O VaultCraft facilita a criação de backups para que você nunca perca nada, mesmo em caso de problemas com o computador.

### Por que fazer backup?

Computadores podem falhar, discos podem corromper, e acidentes acontecem. Um backup é a sua rede de segurança. Com ele, você pode restaurar todos os seus dados exatamente como estavam.

### Backup com 1 clique

1. Vá em **Configurações > Backup**.
2. Clique em **"Fazer Backup"**.
3. Escolha onde salvar o arquivo (recomendamos um pendrive ou HD externo).
4. Pronto! O VaultCraft cria um arquivo \`.vaultbackup\` com tudo dentro.

### O que tem dentro do backup?

O arquivo \`.vaultbackup\` contém:

- **Banco de dados completo** -- todas as suas pastas, itens, tags, checklists e configurações.
- **Todos os anexos** -- cópias de todos os arquivos que você anexou aos itens.
- **Manifesto** -- informações sobre a versão do app e a data do backup, para garantir a integridade.

Tudo empacotado em um único arquivo, fácil de copiar e guardar.

### Restaurando um backup

1. Vá em **Configurações > Backup**.
2. Clique em **"Restaurar Backup"**.
3. Selecione o arquivo \`.vaultbackup\`.
4. Confirme a restauração.

**Importante**: antes de restaurar, o VaultCraft cria automaticamente um **backup dos dados atuais**, por segurança. Assim, se algo der errado, você pode voltar ao estado anterior.

### Recursos de segurança

- **Backup automático antes de restaurar** -- proteção extra contra perda de dados.
- **Validação do arquivo** -- o VaultCraft verifica se o backup está íntegro antes de restaurar.
- **Verificação de versão** -- garante compatibilidade entre a versão do backup e a versão do app.

### Boas práticas

- Faça backup **pelo menos uma vez por semana** se você usa o app diariamente.
- Salve o backup em um **dispositivo externo** (pendrive, HD externo) -- não apenas no mesmo computador.
- Mantenha **mais de uma cópia** do backup, em locais diferentes.
- Depois de adicionar muitos itens ou fazer mudanças importantes, faça um backup extra.

### Se algo der errado

Se o backup não funcionar, verifique se há espaço suficiente no disco. Se a restauração falhar, tente outro arquivo de backup (por isso é bom manter mais de uma cópia). O backup automático criado antes da restauração pode ser sua salvação.`,

  '08_pacotes_vault': `## Pacotes Vault

Pacotes Vault são uma forma prática de exportar e importar pastas inteiras do seu cofre. Pense neles como "pacotes portáteis" que você pode levar para qualquer lugar.

### O que é um Pacote Vault?

Um Pacote Vault é um arquivo que contém uma pasta completa do VaultCraft, incluindo todos os seus itens, subitens, tags e anexos. É como pegar uma gaveta do seu cofre e colocar numa caixa para transportar.

### Exportando uma pasta como pacote

1. Clique com o botão direito na pasta que deseja exportar.
2. Escolha **"Exportar como Pacote Vault"**.
3. Selecione onde salvar o arquivo.
4. O VaultCraft cria o pacote com todos os itens e anexos da pasta (e subpastas).

### Importando um pacote

1. Vá em **Configurações > Pacotes** ou clique com o botão direito no painel de pastas.
2. Escolha **"Importar Pacote Vault"**.
3. Selecione o arquivo do pacote.
4. Escolha a pasta de destino (ou crie uma nova).
5. Confirme a importação.

### Resolução de conflitos

Se você importar um pacote e já existirem itens com o mesmo nome na pasta de destino, o VaultCraft adiciona um **sufixo** ao nome do item importado para evitar confusão. Por exemplo, se já existe "Seguro do Carro", o item importado ficará como "Seguro do Carro (importado)". Assim, nenhum dado é sobrescrito.

### Para que usar Pacotes Vault?

- **Compartilhar no pendrive** -- exporte os documentos do carro para um pendrive e leve ao despachante.
- **Arquivar projetos antigos** -- exporte a pasta de um projeto concluído e remova do cofre para liberar espaço.
- **Organizar por tema** -- exporte e reimporte pastas para reorganizar a estrutura do cofre.
- **Migrar entre computadores** -- leve seus dados para outro computador com VaultCraft instalado.

### Exemplo: "Documentos do Carro"

Imagine que você tem uma pasta "Carro" com CRLV, seguro, vistoria, multas e comprovante de IPVA. Você precisa levar esses documentos ao despachante. Basta exportar a pasta "Carro" como Pacote Vault, salvar no pendrive, e no computador do despachante (se ele também usar VaultCraft) é só importar.

Mesmo sem VaultCraft no destino, o pacote serve como um **arquivo organizado** dos seus documentos.`,

  '09_privacidade_e_criptografia': `## Privacidade e Segurança

A privacidade dos seus dados é um dos princípios fundamentais do VaultCraft. Aqui explicamos exatamente como seus dados são tratados.

### 100% Offline -- sempre

O VaultCraft **nunca se conecta à internet**. Ele não faz requisições de rede, não baixa atualizações automáticas, não envia dados para nenhum servidor. Nada sai do seu computador.

### Sem telemetria, sem analytics

O VaultCraft **não coleta nenhum tipo de informação** sobre como você usa o app. Não há rastreamento, não há métricas de uso, não há identificadores. Você é completamente invisível.

### Seus dados ficam no SEU computador

Todos os dados -- o banco de dados, os anexos, as configurações -- ficam armazenados localmente em uma pasta no seu computador. Só você (e quem tiver acesso ao seu computador) pode ver esses dados.

### Proteção por PIN (opcional)

Você pode configurar um **PIN numérico** para proteger o acesso ao VaultCraft:

- O PIN é solicitado toda vez que o app é aberto.
- O PIN é armazenado como um **hash** (uma transformação irreversível) -- ele nunca é guardado em texto simples.
- Mesmo que alguém acesse os arquivos do app, não conseguirá descobrir seu PIN a partir do hash.

### Como o PIN funciona

Quando você define um PIN, o VaultCraft gera um hash criptográfico e armazena apenas esse hash. Quando você digita o PIN para entrar, o app calcula o hash do que você digitou e compara com o armazenado. Se forem iguais, o acesso é liberado. O PIN original nunca é gravado em nenhum lugar.

### Criptografia (opcional)

O VaultCraft oferece uma camada opcional de criptografia para proteger dados sensíveis. Porém, é importante entender as limitações da versão atual:

- A criptografia protege o conteúdo no banco de dados.
- Anexos grandes podem ter performance reduzida quando criptografados.
- A implementação atual é adequada para uso pessoal, mas não substitui ferramentas especializadas para dados altamente sensíveis.

### Limitações e recomendações

- Se alguém tiver acesso físico ao seu computador **e** souber onde estão os arquivos do VaultCraft, poderá acessar os dados (a menos que o PIN e criptografia estejam ativados).
- Para documentos extremamente sensíveis (dados financeiros, médicos, jurídicos), considere usar também criptografia de disco (BitLocker) ou ferramentas especializadas como complemento.
- O PIN protege contra acesso casual, mas não substitui a segurança do sistema operacional.

### Resumo

| Recurso | Status |
|---|---|
| Conexão com internet | Nunca |
| Telemetria / Analytics | Nenhuma |
| Armazenamento | Apenas local |
| Proteção por PIN | Opcional |
| Criptografia | Opcional |`,

  '10_atalhos_e_dicas': `## Atalhos e Dicas

Conheça os atalhos de teclado e dicas que vão tornar o seu uso do VaultCraft ainda mais ágil.

### Atalhos de teclado

| Atalho | Ação |
|---|---|
| **Ctrl+K** | Abrir busca instantânea |
| **Ctrl+N** | Criar novo item |
| **Ctrl+B** | Fazer backup |
| **F1** | Abrir a ajuda |
| **Esc** | Fechar diálogo / voltar |

Esses atalhos funcionam de qualquer tela do app. Use-os para navegar rapidamente sem tirar as mãos do teclado.

### Dicas de produtividade

- **Ctrl+K é seu melhor amigo** -- em vez de navegar pelas pastas, pressione Ctrl+K e digite o que procura. É mais rápido.
- **Crie itens rapidamente** -- pressione Ctrl+N, escolha o tipo e comece a escrever. Não precisa organizar tudo de primeira; você pode mover o item para outra pasta depois.
- **Use a busca para filtrar** -- mesmo dentro de uma pasta, a busca ajuda a encontrar itens específicos quando a lista é grande.
- **Duplique itens como modelo** -- se você cria itens parecidos frequentemente (ex: checklists de viagem), duplique um existente e altere o que for necessário.

### Dicas de organização

- **Comece simples** -- não crie dezenas de pastas e tags de uma vez. Comece com poucas e vá expandindo conforme a necessidade.
- **Use pastas para localização e tags para classificação** -- por exemplo, a pasta "Carro" contém tudo sobre o carro, mas a tag "Vence em breve" marca qualquer item de qualquer pasta.
- **Revise periodicamente** -- uma vez por mês, dê uma olhada no painel de vencimentos e nas pastas para ver se há algo desatualizado.
- **Nomes claros** -- dê nomes descritivos aos itens. "Seguro do Carro 2026 - Porto Seguro" é muito melhor do que "Documento 1".

### Dicas de backup

- **Defina um dia fixo** -- escolha um dia da semana (ex: domingo) para fazer backup. Crie até um checklist no VaultCraft para lembrar!
- **Varie o destino** -- alterne entre pendrive, HD externo ou outra pasta segura.
- **Antes de grandes mudanças** -- vai reorganizar as pastas ou excluir muitos itens? Faça um backup antes, por precaução.
- **Teste a restauração** -- de vez em quando, restaure um backup em uma instalação separada para ter certeza de que está funcionando.

Essas pequenas práticas fazem uma grande diferença no dia a dia.`,

  '11_solucoes_de_problemas': `## Solução de Problemas

Se algo não está funcionando como esperado, confira as soluções abaixo. A maioria dos problemas tem resolução simples.

### O app está lento

- **Compacte o banco de dados**: vá em **Configurações > Avançado > Compactar banco de dados**. Isso executa uma operação chamada VACUUM que reorganiza os dados e libera espaço.
- Se o banco de dados estiver muito grande (acima de 500 MB), considere remover anexos antigos que você não precisa mais.
- Feche e reabra o app depois de compactar.

### O banco de dados está muito grande

- Verifique se há anexos grandes que podem ser removidos.
- Use a compactação (VACUUM) em **Configurações > Avançado**.
- Exporte pastas antigas como **Pacotes Vault** e depois remova-as do cofre para liberar espaço.

### O backup falha

- **Verifique o espaço em disco** -- o backup precisa de espaço suficiente para criar o arquivo. Verifique se o disco de destino (pendrive, HD) tem espaço livre.
- **Verifique as permissões** -- certifique-se de que o VaultCraft tem permissão para escrever na pasta de destino.
- **Tente outro local** -- se o pendrive está dando problema, tente salvar primeiro no próprio computador e depois copiar.

### A restauração falha

- **Verifique a integridade do arquivo** -- o arquivo \`.vaultbackup\` pode estar corrompido. Tente com outro backup (por isso é importante manter várias cópias).
- **Verifique a versão** -- backups feitos em versões muito diferentes do app podem ter incompatibilidades.
- **Espaço em disco** -- a restauração precisa de espaço para extrair todos os dados e anexos.

### Anexos não abrem

- O VaultCraft abre anexos usando o **programa padrão do Windows** para aquele tipo de arquivo.
- Se um PDF não abre, verifique se você tem um leitor de PDF instalado (ex: Adobe Reader, Foxit, ou o próprio Edge).
- Para outros formatos, verifique se o programa correspondente está instalado.

### Esqueci meu PIN

- O PIN é armazenado como hash e **não pode ser recuperado**.
- Se você esqueceu o PIN, a única opção é **redefinir o app**, o que apaga os dados locais.
- **Se você tem um backup**, pode redefinir e depois restaurar o backup (o backup não é protegido pelo PIN do app).
- Por isso, é fundamental manter backups atualizados.

### Conflitos ao importar pacotes

Quando você importa um Pacote Vault e já existem itens com o mesmo nome, o VaultCraft adiciona um **sufixo** ao nome (ex: "Seguro do Carro (importado)"). Nenhum item existente é sobrescrito. Após a importação, você pode renomear ou reorganizar os itens manualmente.

### Onde ficam meus dados?

Os dados do VaultCraft ficam armazenados na pasta de dados do aplicativo:

\`%APPDATA%\\com.vaultcraft.app\`

Dentro dessa pasta você encontra o banco de dados e a pasta de anexos. **Não modifique esses arquivos manualmente** -- use sempre o VaultCraft ou o sistema de backup para gerenciar seus dados.`,

};
