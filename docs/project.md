# CreateYourOwnAlphabet

Ferramenta web para o usuário criar seu próprio alfabeto desenhando cada letra em um canvas. O resultado pode ser salvo como imagem PNG (letra individual ou alfabeto completo em grade 7x4) ou usado para importar/cortar imagens existentes.

## Visão geral

- **Público-alvo:** qualquer pessoa que queira criar um alfabeto próprio (caligrafia, fantasia, estudos, etc.).
- **Plataforma:** navegador (desktop e mobile/touch).
- **Stack:** HTML + CSS + JavaScript vanilla (sem frameworks) + biblioteca externa [JSZip](https://cdn.jsdelivr.net/npm/jszip@3.10.1/) via CDN para gerar ZIP.
- **Sem build:** o site é servido diretamente pelos arquivos estáticos.

## Estado atual

O `index.html` abre **direto na ferramenta de desenho** (ainda não há página inicial/banner de boas-vindas). A funcionalidade hoje implementada é:

| Funcionalidade | Status |
| --- | --- |
| Desenhar letras A–Z em canvas | Implementado |
| Navegar entre letras (Anterior/Próximo) | Implementado |
| Ajustar cor e espessura do pincel | Implementado |
| Limpar desenho da letra atual | Implementado |
| Salvar letra individual (PNG) | Implementado |
| Salvar alfabeto completo em grade 7x4 (PNG) | Implementado |
| Fundo transparente ao salvar | Implementado |
| Importar imagem em grade 7x4 e cortar em letras (ZIP) | Implementado |
| Seletor de alfabetos existentes | Não implementado (visão) |
| Alfabeto personalizado (criar/apagar letras) | Não implementado (visão) |
| Página inicial com banner e modais | Não implementado (visão) |

> A seção [Visão futura](#visão-futura) descreve os planos ainda não implementados.

## Requisitos funcionais

1. Exibir a letra-modelo (referência) em um canvas.
2. Permitir desenhar a mesma letra em um segundo canvas com o mouse ou toque.
3. Navegar pelas 26 letras do alfabeto (A–Z) com botões Anterior/Próximo.
4. Ajustar cor e espessura do traço; limpar o desenho atual.
5. Baixar a letra atual como PNG (`letra-X.png`).
6. Baixar o alfabeto inteiro como uma única imagem PNG em grade **7 colunas × 4 linhas** (`meu-alfabeto.png`).
7. Escolher se a imagem exportada terá fundo transparente ou branco.
8. Importar uma imagem com grade 7x4, recortar automaticamente as 26 letras e baixá-las como `letras.zip`.

### Fluxo de uso (como o usuário interage hoje)

1. Abre o site e vê dois painéis: **Modelo** (letra de referência) e **Desenhe aqui**.
2. Navega até a letra desejada com Anterior/Próximo.
3. Desenha com o mouse ou o dedo (touch), escolhendo cor e espessura.
4. As ferramentas de exportação:
   - **Salvar Letra** → baixa o PNG da letra atual.
   - **Salvar Alfabeto** → baixa o PNG da grade 7x4 com todas as letras.
   - **Importar imagem** → recorta a grade e baixa um ZIP com as letras.

## Requisitos não funcionais

- **Performance:** desenho fluido (renderiza por `requestAnimationFrame` implícito ao redesenhar a cada `mousemove`); adequado para uso simples, sem carregamento.
- **Compatibilidade visual:** responsivo (flexbox), redimensiona os canvases conforme o painel.
- **Acessibilidade/UX:** cores de contraste nos botões, estados `:hover`, `:disabled` e navegação via teclado nativa dos botões.
- **Portabilidade:** funciona offline após o download (exceto o CDN do JSZip).
- **Manutenibilidade:** código em arquivo único (`main.js`) hoje, com pastas `components/`, `services/` e `utils/` já reservadas para organização futura.

## Como funciona (detalhes técnicos)

### Desenho

- O `canvas#draw_letter` recebe eventos de `mousedown/mousemove/mouseup` e `touchstart/touchmove/touchend`.
- Cada traço é armazenado como um objeto `{ type: 'stroke', color, width, points: [...] }` em `storedDraws[currentIndex]` (um array de traços por letra).
- `drawAllObjects()` desenha os objetos salvos no canvas, suportando escala (`scale`) — usado tanto na tela quanto na exportação.
- O canvas interno é redimensionado para o tamanho real renderizado via `getBoundingClientRect()`, e as coordenadas do ponteiro são convertidas com `getPos()`.

### Alfabeto e grade

- Alfabeto fixo A–Z (códigos 65–90 da tabela ASCII) gerado em `main.js:19`.
- Exportação usa uma grade fixa de `GRID_COLS = 7` e `GRID_ROWS = 4` (`main.js:25-26`), totalizando 28 células (26 usadas + 2 vazias).

### Exportação

- `buildGridCanvas(cellSize)` cria um canvas de `7×cellSize` por `4×cellSize`, preenche de branco (a menos que "Fundo transparente" esteja ativo) e re-desenha cada letra com escala `cellSize / sourceSize`.
- Download via elemento `<a download>` com `dataURL`.

### Importação

- Lê a imagem selecionada via `FileReader`.
- Calcula cada célula como `largura/7` por `altura/4`; usa o **menor lado** para manter células quadradas e centraliza a grade com offsets.
- Usa `JSZip` para empacotar as 26 letras (`A.png` … `Z.png`) e dispara o download.

## Estrutura do projeto

```
CreateYourOwnAlphabet/
├── index.html          # Página única com a ferramenta (canvas + controles)
├── assets/             # Mídia estática (imagens, fontes, ícones) — não passa por build
│   ├── docs/           # Documentação de mídia
│   ├── fonts/
│   ├── icons/
│   ├── images/
│   └── videos/
├── src/
│   ├── css/styles.css  # Estilos da ferramenta
│   ├── data/           # (vazio) futuros dados, ex.: alfabetos
│   └── js/
│       ├── main.js     # Lógica principal (desenho, exportação, importação)
│       ├── components/ # (vazio) futuros componentes
│       ├── services/   # (vazio) futuros serviços
│       └── utils/      # (vazio) futuras utilidades
├── tests/js/           # (vazio) futuros testes JS
└── docs/
    ├── project.md      # Este documento
    └── guias/
        └── manutencao.md  # Guia de manutenção (a criar/conteúdo)
```

### Regras do projeto

- JS e CSS sempre em `src/`, nunca em `assets/`.
- `assets/` apenas para mídia crua consumida pelo navegador.

## Visão futura

Planejado (descrito na intenção original do projeto, ainda não implementado):

- **Página inicial:** banner/header, footer e dois botões centrais: "Criar seu Próprio Alfabeto" e "Importar um Alfabeto", abrindo modais com as ferramentas.
- **Seleção de alfabeto:** abrir aba com alfabetos existentes para troca + opção de criar alfabeto personalizado (quantidade de letras livre, sem canvas de referência).
- **Ferramentas de desenho completas:** pincel, borracha, limpar tudo, espessura e cor.
- **Salvar alfabeto editável/importável:** exportar no formato da ferramenta para permitir reimportar e editar depois.
- **Edição após importar:** editar letras do alfabeto importado e recortar novamente para ZIP.

## Próximos passos sugeridos

1. Implementar a página inicial (banner + botões) e a navegação em modais.
2. Extrair a lógica de `main.js` em módulos (`services`, `components`, `utils`) pois o arquivo concentra desenho, exportação e importação.
3. Definir o "formato de arquivo" de um alfabeto salvo (JSON + imagens) para viabilizar importar/editar.
4. Criar testes automatizados em `tests/js/`.
5. Preencher `docs/guias/manutencao.md`.