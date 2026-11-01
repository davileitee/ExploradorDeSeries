# Explorador de Séries

Aplicação frontend para buscar séries na API pública TVMaze, visualizar informações como poster, ano, nota, gêneros e resumo, e salvar favoritos em um banco PostgreSQL com Supabase.

Como funciona:
- busca por nome em tempo real na API TVMaze;
- exibe cards com poster, ano, nota e resumo;
- salva séries em banco de dados real;
- permite remover itens da lista e registrar observações simples.

Comando para executar:

```bash
docker run -d -p 8080:80 davileitem/explorador-series:1.1
```

Repositório do projeto: https://github.com/davileitee/ExploradorDeSeries
GitHub Pages: https://davileitee.github.io/ExploradorDeSeries/
