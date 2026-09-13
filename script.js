// script.js — Explorador de Séries (usa TVMaze API)
const API_BASE = 'https://api.tvmaze.com';

function el(id){ return document.getElementById(id); }

function stripTags(html){ return html ? String(html).replace(/<[^>]*>/g,'') : ''; }

async function buscarSeries(termo){
  const area = el('resultado');
  area.innerHTML = '<p class="hint">Carregando resultados…</p>';

  try{
    const url = `${API_BASE}/search/shows?q=${encodeURIComponent(termo)}`;
    const resp = await fetch(url);
    if(!resp.ok) throw new Error('Erro na requisição');
    const body = await resp.json();

    if(!Array.isArray(body) || body.length === 0){
      area.innerHTML = '<p class="no-results">Não encontramos nenhuma série com esse nome. Tente outro termo.</p>';
      return;
    }

    const shows = body.slice(0, 12).map(item => item.show || item);

    const html = ['<div class="grid">'];
    for(const s of shows){
      const name = s.name || 'Não informado';
      const premiered = s.premiered ? (s.premiered.split('-')[0]) : 'Não informado';
      const rating = s.rating && s.rating.average ? s.rating.average : 'Não informado';
      const genres = Array.isArray(s.genres) && s.genres.length ? s.genres.join(', ') : 'Não informado';
      const summaryRaw = s.summary || '';
      const summary = truncate(stripTags(summaryRaw) || 'Não informado', 220);
      const poster = (s.image && (s.image.medium || s.image.original)) ? (s.image.medium || s.image.original) : '';

      html.push(`
        <article class="card">
          ${poster ? `<img class="poster" src="${poster}" alt="Poster de ${escapeHtml(name)}" onerror="this.style.display='none'">` : ''}
          <div class="card-body">
            <h3 class="title">${escapeHtml(name)}</h3>
            <div class="meta">${escapeHtml(premiered)} • Nota: ${escapeHtml(rating)}</div>
            <div class="meta">${escapeHtml(genres)}</div>
            <p class="overview">${escapeHtml(summary)}</p>
          </div>
        </article>
      `);
    }
    html.push('</div>');
    area.innerHTML = html.join('\n');

  }catch(err){
    console.error(err);
    el('resultado').innerHTML = '<p class="no-results">Não foi possível buscar as séries agora. Tente novamente mais tarde.</p>';
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
    if(termo) buscarSeries(termo);
  });

  el('campo-busca').addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){
      const termo = el('campo-busca').value.trim();
      if(termo) buscarSeries(termo);
    }
  });
});
