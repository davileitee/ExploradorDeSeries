# Explorador de Séries

## Autor
Davi Leite Macedo Maduro — Matrícula 22553233

## Descrição

Aplicação frontend que permite pesquisar séries usando a API pública TVMaze e exibe informações como nome, poster, ano de estreia, nota, gêneros e resumo.

## API utilizada

- TVMaze API — https://www.tvmaze.com/api
- Endpoint utilizado: `https://api.tvmaze.com/search/shows?q=TERMO`

## Funcionalidades

- Pesquisar séries por nome (campo de busca).
- Iniciar busca com o botão `Buscar` ou pressionando `Enter`.
- Exibir em cards: nome, poster (quando disponível), ano de estreia, nota, gêneros e resumo.
- Tratamento de erros e mensagem amigável quando não há resultados.

## Como executar localmente
1. Clone o repositório:
git clone URL_DO_REPOSITORIO
2. Abra a pasta do projeto.
3. Abra o arquivo `index.html` no navegador ou use um servidor local (recomendado). Exemplo com Python 3:

python -m http.server 5500

npx http-server -p 5500
4. Abra `http://localhost:5500` no navegador.

## Links
- Aplicação no ar (GitHub Pages): https://davileitee.github.io/ExploradorDeSeries/
- Repositório: https://github.com/davileitee/ExploradorDeSeries
