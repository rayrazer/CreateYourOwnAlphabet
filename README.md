# Meu Site

Ferramenta web para o usuário criar seu próprio alfabeto desenhando cada letra em um canvas. O resultado pode ser salvo como imagem PNG (letra individual ou alfabeto completo em grade 7x4) ou usado para importar/cortar imagens existentes.

## Estrutura

- `assets/` - mídia estática (imagens, fontes, ícones) - não passa pelo build
- `src/` - código-fonte (JS, CSS) que será processado
- `docs/` - documentação
- `tests/` - testes

## Como usar
### Criar seu Próprio Alfabeto
1. Clique em **Criar seu Próprio Alfabeto**.
2. Selecione um alfabeto para se basear (Normal, Mexicano, Grego, Russo, Japonês, Árabe...) ou o card **Alfabeto Personalizado** (sem letra de referência e com tamanho livre).
3. Escreva cada letra no painel **Desenhe aqui** usando as ferramentas de desenho:
   - **Pincel** e **Borracha** (seleção de ferramenta ativa)
   - **Cor** e **Espessura** do traço
   - **Limpar** para apagar o desenho atual da letra
   - **Anterior / Próximo** para navegar entre as letras
   - *Personalizado:* **Adicionar letra** e **Apagar letra**
4. Salve o resultado:
   - **Salvar Letra** → baixa o PNG da letra atual
   - **Salvar Alfabeto** → baixa o PNG do alfabeto em grade de **7 colunas × N linhas** (N é calculado pela quantidade de letras)
   - A opção **Fundo transparente** controla se o PNG terá fundo branco (desmarcada) ou transparente (marcada)

### Importar um Alfabeto
1. Clique em **Importar um Alfabeto**.
2. Selecione uma imagem de alfabeto em **formato de tabela**: células quadradas com mesma largura e altura, organizadas em **7 colunas** (o alfabeto Normal padrão usa por volta de 7 colunas × 4 linhas). A quantidade de linhas é detectada automaticamente pela altura da imagem.
3. Escolha uma ação:
   - **Importar para edição** → as letras são carregadas no editor, onde você pode desenhar por cima, apagar ou limpar cada letra e depois salvar.
   - **Cortar letras e salvar ZIP** → recorta cada letra da tabela e baixa um arquivo `letras.zip` (com `01.png`, `02.png`, etc.).
