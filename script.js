const API_BASE = 'https://www.omdbapi.com/';
const API_KEY = 'c1167a'; 

function el(id){ return document.getElementById(id); }

async function buscarFilmes(termo){
  const area = el('resultado');
  area.innerHTML = '<p class="hint">Carregando resultados…</p>';

  if(!API_KEY){
    area.innerHTML = '<p class="no-results">Chave de API não configurada. Edite <code>script.js</code> e defina <code>API_KEY</code>.</p>';
    return;
  }

  try{
    const searchUrl = `${API_BASE}?apikey=${API_KEY}&s=${encodeURIComponent(termo)}&type=movie`;
    const resp = await fetch(searchUrl);
    if(!resp.ok) throw new Error('Erro na requisição');
    const body = await resp.json();

    if(body.Response === 'False'){
      area.innerHTML = `<p class="no-results">Nenhum filme encontrado: ${escapeHtml(body.Error || 'Tente outro termo')}</p>`;
      return;
    }

    const results = body.Search || [];
    if(results.length === 0){
      area.innerHTML = '<p class="no-results">Nenhum filme encontrado para esse termo. Tente outro título.</p>';
      return;
    }


    const detailsPromises = results.slice(0, 12).map(r => fetch(`${API_BASE}?apikey=${API_KEY}&i=${r.imdbID}&plot=short`).then(res=>res.json()).catch(()=>null));
    const details = await Promise.all(detailsPromises);

    const html = ['<div class="grid">'];
    for(const d of details){
      if(!d || d.Response === 'False') continue;
      const title = d.Title || '—';
      const year = d.Year || '—';
      const rating = d.imdbRating && d.imdbRating !== 'N/A' ? d.imdbRating : '—';
      const runtime = d.Runtime && d.Runtime !== 'N/A' ? d.Runtime : '—';
      const genres = d.Genre && d.Genre !== 'N/A' ? d.Genre : '';
      const plot = truncate(d.Plot && d.Plot !== 'N/A' ? d.Plot : 'Sem resumo disponível.', 220);
      const poster = d.Poster && d.Poster !== 'N/A' ? d.Poster : '';

      html.push(`
        <article class="card">
          <img class="poster" src="${poster}" alt="Poster de ${escapeHtml(title)}" onerror="this.style.display='none'">
          <div class="card-body">
            <h3 class="title">${escapeHtml(title)}</h3>
            <div class="meta">${year} • Nota: ${rating} • ${runtime}</div>
            <div class="meta">${escapeHtml(genres)}</div>
            <p class="overview">${escapeHtml(plot)}</p>
          </div>
        </article>
      `);
    }
    html.push('</div>');
    area.innerHTML = html.join('\n');

  }catch(err){
    console.error(err);
    el('resultado').innerHTML = '<p class="no-results">Ops! Não foi possível buscar os filmes agora. Verifique sua conexão ou tente novamente mais tarde.</p>';
  }
}

function truncate(str, n){ return String(str).length>n ? String(str).slice(0,n-1)+'…' : String(str); }
function escapeHtml(s){
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

document.addEventListener('DOMContentLoaded', ()=>{
  el('botao-buscar').addEventListener('click', ()=>{
    const termo = el('campo-busca').value.trim();
    if(termo) buscarFilmes(termo);
  });

  el('campo-busca').addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){
      const termo = el('campo-busca').value.trim();
      if(termo) buscarFilmes(termo);
    }
  });
});
