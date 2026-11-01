import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const API_BASE = 'https://api.tvmaze.com';
const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANON';
const SUPABASE_CONFIGURADO = !(SUPABASE_URL.includes('SEU-PROJETO') || SUPABASE_ANON_KEY.includes('SUA_CHAVE_ANON'));
const supabase = SUPABASE_CONFIGURADO ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

function el(id) { return document.getElementById(id); }

function stripTags(html) {
  return html ? String(html).replace(/<[^>]*>/g, '') : '';
}

function truncate(str, n) {
  const value = String(str ?? '');
  return value.length > n ? `${value.slice(0, n - 1)}…` : value;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderNoResults(message = 'Não encontramos nenhuma série com esse nome. Tente outro termo.') {
  el('resultado').innerHTML = `<p class="no-results">${escapeHtml(message)}</p>`;
}

async function buscarSeries(termo) {
  const area = el('resultado');
  area.innerHTML = '<p class="hint">Carregando resultados…</p>';

  try {
    const url = `${API_BASE}/search/shows?q=${encodeURIComponent(termo)}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Erro na requisição');

    const body = await resp.json();
    if (!Array.isArray(body) || body.length === 0) {
      renderNoResults();
      return;
    }

    const shows = body.slice(0, 12).map(item => item.show || item);
    const html = ['<div class="grid">'];

    for (const s of shows) {
      const showId = s.id ?? 0;
      const name = s.name || 'Não informado';
      const premiered = s.premiered ? s.premiered.split('-')[0] : 'Não informado';
      const rating = s.rating && s.rating.average ? s.rating.average : 'Não informado';
      const genres = Array.isArray(s.genres) && s.genres.length ? s.genres.join(', ') : 'Não informado';
      const summary = truncate(stripTags(s.summary || 'Não informado'), 220);
      const poster = s.image && (s.image.medium || s.image.original) ? (s.image.medium || s.image.original) : '';

      html.push(`
        <article class="card">
          ${poster ? `<img class="poster" src="${escapeHtml(poster)}" alt="Poster de ${escapeHtml(name)}" onerror="this.style.display='none'">` : ''}
          <div class="card-body">
            <h3 class="title">${escapeHtml(name)}</h3>
            <div class="meta">${escapeHtml(premiered)} • Nota: ${escapeHtml(rating)}</div>
            <div class="meta">${escapeHtml(genres)}</div>
            <p class="overview">${escapeHtml(summary)}</p>
          </div>
          <div class="card-footer">
            <button
              class="save-series-btn"
              type="button"
              data-show-id="${escapeHtml(String(showId))}"
              data-show-name="${escapeHtml(name)}"
              data-show-premiered="${escapeHtml(premiered)}"
              data-show-rating="${escapeHtml(String(rating))}"
              data-show-genres="${escapeHtml(genres)}"
              data-show-summary="${escapeHtml(summary)}"
              data-show-poster="${escapeHtml(poster)}"
              ${SUPABASE_CONFIGURADO ? '' : 'disabled title="Configure a URL e a chave anon do Supabase"'}
            >Salvar</button>
          </div>
        </article>
      `);
    }

    html.push('</div>');
    area.innerHTML = html.join('\n');
  } catch (err) {
    console.error(err);
    el('resultado').innerHTML = '<p class="no-results">Não foi possível buscar as séries agora. Tente novamente mais tarde.</p>';
  }
}

function renderSavedSeriesMessage(message, isError = false) {
  const area = el('series-salvas');
  area.innerHTML = `<p class="${isError ? 'error-state' : 'info-state'}">${escapeHtml(message)}</p>`;
}

function renderEmptySavedSeries() {
  el('series-salvas').innerHTML = '<p class="empty-state">Você ainda não salvou nenhuma série.</p>';
}

function renderSavedSeries(list) {
  const area = el('series-salvas');

  if (!Array.isArray(list) || list.length === 0) {
    renderEmptySavedSeries();
    return;
  }

  const html = list.map(item => {
    const poster = item.poster_url || '';
    const assistida = Boolean(item.assistida);
    const anotacao = item.anotacao || '';

    return `
      <article class="saved-item" data-saved-id="${escapeHtml(String(item.id))}">
        ${poster ? `<img src="${escapeHtml(poster)}" alt="Poster de ${escapeHtml(item.nome)}" onerror="this.style.display='none'">` : '<div class="poster-placeholder"></div>'}
        <div class="saved-content">
          <div class="saved-header">
            <h4>${escapeHtml(item.nome)}</h4>
            <button class="delete-saved-btn" type="button" data-delete-id="${escapeHtml(String(item.id))}">Excluir</button>
          </div>
          <div class="saved-meta">${escapeHtml(item.ano_estreia || 'Ano não informado')} • ${escapeHtml(item.generos || 'Gêneros não informados')}</div>
          <div class="saved-actions">
            <label>
              <input type="checkbox" data-action="toggle-assistida" data-id="${escapeHtml(String(item.id))}" ${assistida ? 'checked' : ''}>
              Assistida
            </label>
          </div>
          <textarea data-action="update-anotacao" data-id="${escapeHtml(String(item.id))}" placeholder="Escreva uma anotação...">${escapeHtml(anotacao)}</textarea>
        </div>
      </article>
    `;
  }).join('');

  area.innerHTML = html;
}

async function carregarSeriesSalvas() {
  const area = el('series-salvas');
  if (!SUPABASE_CONFIGURADO || !supabase) {
    area.innerHTML = '<p class="info-state">Configure a URL e a chave anon do Supabase para ativar o armazenamento.</p>';
    return;
  }

  area.innerHTML = '<p class="hint">Carregando suas séries salvas…</p>';

  try {
    const { data, error } = await supabase
      .from('series_salvas')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) throw error;
    renderSavedSeries(data || []);
  } catch (error) {
    console.error(error);
    renderSavedSeriesMessage('Não foi possível carregar suas séries salvas.', true);
  }
}

async function salvarSerie(showData) {
  if (!SUPABASE_CONFIGURADO || !supabase) {
    renderSavedSeriesMessage('Configure a URL e a chave anon do Supabase para salvar séries.', false);
    return;
  }

  const payload = {
    tvmaze_id: Number(showData.showId),
    nome: showData.showName || 'Sem nome',
    ano_estreia: showData.showPremiered || null,
    nota: showData.showRating && showData.showRating !== 'Não informado' ? Number(showData.showRating) : null,
    generos: showData.showGenres || null,
    poster_url: showData.showPoster || null,
    dados_extra: {
      resumo: showData.showSummary || null,
      nota_original: showData.showRating && showData.showRating !== 'Não informado' ? showData.showRating : null
    }
  };

  try {
    const { error } = await supabase.from('series_salvas').insert(payload);
    if (error) {
      if (error.code === '23505') {
        renderSavedSeriesMessage('Essa série já está salva na sua lista.', false);
      } else {
        throw error;
      }
      return;
    }

    renderSavedSeriesMessage('Série salva com sucesso.', false);
    await carregarSeriesSalvas();
  } catch (error) {
    console.error(error);
    renderSavedSeriesMessage('Não foi possível salvar esta série no banco.', true);
  }
}

async function excluirSerie(id) {
  if (!SUPABASE_CONFIGURADO || !supabase) {
    renderSavedSeriesMessage('Configure a URL e a chave anon do Supabase para excluir séries.', false);
    return;
  }

  try {
    const { error } = await supabase.from('series_salvas').delete().eq('id', Number(id));
    if (error) throw error;
    renderSavedSeriesMessage('Série removida da sua lista.', false);
    await carregarSeriesSalvas();
  } catch (error) {
    console.error(error);
    renderSavedSeriesMessage('Não foi possível excluir esta série.', true);
  }
}

async function limparListaSeries() {
  if (!SUPABASE_CONFIGURADO || !supabase) {
    renderSavedSeriesMessage('Configure a URL e a chave anon do Supabase para limpar a lista.', false);
    return;
  }

  try {
    const { error } = await supabase.from('series_salvas').delete().neq('id', 0);
    if (error) throw error;
    renderSavedSeriesMessage('Lista de séries limpa com sucesso.', false);
    await carregarSeriesSalvas();
  } catch (error) {
    console.error(error);
    renderSavedSeriesMessage('Não foi possível limpar a lista de séries.', true);
  }
}

async function atualizarAssistida(id, assistida) {
  if (!SUPABASE_CONFIGURADO || !supabase) return;

  try {
    const { error } = await supabase.from('series_salvas').update({ assistida }).eq('id', Number(id));
    if (error) throw error;
  } catch (error) {
    console.error(error);
    renderSavedSeriesMessage('Não foi possível atualizar o status da série.', true);
  }
}

async function atualizarAnotacao(id, anotacao) {
  if (!SUPABASE_CONFIGURADO || !supabase) return;

  try {
    const { error } = await supabase.from('series_salvas').update({ anotacao }).eq('id', Number(id));
    if (error) throw error;
  } catch (error) {
    console.error(error);
    renderSavedSeriesMessage('Não foi possível atualizar a anotação da série.', true);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const campoBusca = el('campo-busca');
  const botaoBuscar = el('botao-buscar');
  const botaoLimparLista = el('botao-limpar-lista');

  botaoBuscar.addEventListener('click', () => {
    const termo = campoBusca.value.trim();
    if (termo) buscarSeries(termo);
  });

  botaoLimparLista.addEventListener('click', async () => {
    await limparListaSeries();
  });

  campoBusca.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const termo = campoBusca.value.trim();
      if (termo) buscarSeries(termo);
    }
  });

  document.addEventListener('click', async (event) => {
    const target = event.target;

    if (target.matches('.save-series-btn')) {
      salvarSerie({
        showId: target.dataset.showId,
        showName: target.dataset.showName,
        showPremiered: target.dataset.showPremiered,
        showRating: target.dataset.showRating,
        showGenres: target.dataset.showGenres,
        showSummary: target.dataset.showSummary,
        showPoster: target.dataset.showPoster,
      });
      return;
    }

    if (target.matches('[data-delete-id]')) {
      const id = target.dataset.deleteId;
      await excluirSerie(id);
    }
  });

  document.addEventListener('change', async (event) => {
    const target = event.target;

    if (target.matches('[data-action="toggle-assistida"]')) {
      await atualizarAssistida(target.dataset.id, target.checked);
      return;
    }
  });

  document.addEventListener('input', async (event) => {
    const target = event.target;

    if (target.matches('[data-action="update-anotacao"]')) {
      await atualizarAnotacao(target.dataset.id, target.value);
    }
  });

  carregarSeriesSalvas();
});
