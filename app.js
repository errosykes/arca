const DATA = {
  races: {
    'Nômades do Deserto': 'Resistentes ao calor e mestres da sobrevivência em terras áridas.',
    'Guardiões da Floresta': 'Especialistas em camuflagem e leitura dos sinais naturais.',
    'Navegadores do Mar': 'Nadadores excepcionais e resistentes à corrosão do oceano ácido.',
    'Mineiros das Montanhas': 'Força bruta, resistência e maestria em forja.',
    'Exploradores das Ruínas': 'Arqueólogos natos, atentos a armadilhas e segredos antigos.'
  },
  attributes: ['Força', 'Destreza', 'Constituição', 'Inteligência', 'Carisma', 'Sabedoria'],
  skills: {
    Força: ['Arrombamento', 'Escalada', 'Demolição', 'Lutar'],
    Destreza: ['Furtividade', 'Acrobacias', 'Roubo de Bolsas', 'Tiro com Arco'],
    Constituição: ['Resistência a Venenos', 'Suportar Fadiga', 'Cicatrização Rápida', 'Tolerância à Fome'],
    Inteligência: ['Cartografia', 'Engenharia Reversa', 'Decifração de Códigos', 'Estudo de Artefatos'],
    Carisma: ['Diplomacia', 'Persuasão', 'Intimidação', 'Negociação de Trocas'],
    Sabedoria: ['Percepção Aguda', 'Intuição Profunda', 'Senso de Justiça', 'Conexão Espiritual']
  },
  proficiencies: [
    'Criação de Armas e Armaduras Rudimentares',
    'Herborismo e Medicina Natural',
    'Precisão Mortal',
    'Domínio da Lâmina',
    'Arquearia e Técnicas de Caça',
    'Reconstrução de Tecnologias Antigas'
  ],
  lore: `
<h3>Prólogo do Mundo</h3>
<p>Mil anos após o Cataclismo, as civilizações foram reduzidas a ruínas. Tribos sobrevivem entre desertos, florestas petrificadas, montanhas fumegantes e mares ácidos.</p>
<h3>Culturas e Facções</h3>
<ul>
<li><strong>Sombrios:</strong> furtivos, caçadores noturnos e mestres da sobrevivência nas sombras.</li>
<li><strong>Forjadores:</strong> metalúrgicos resistentes que moldam o futuro em forjas primitivas.</li>
<li><strong>Águas Claras:</strong> povo das margens, protetores de fontes de água e da pesca.</li>
</ul>
<h3>Locais-chave</h3>
<ul>
<li>Kaldor (ruínas mutantes)</li>
<li>Vale das Névoas (distorções arcanas)</li>
<li>Elarion Submersa (tecnologia e magia preservadas)</li>
<li>Pedra Alta (trégua frágil entre tribos)</li>
</ul>
<p>Seu objetivo no one-shot é sobreviver, criar alianças e decidir que tipo de legado deixará nesse mundo quebrado.</p>`
};

const state = {
  currentCharacter: null,
  game: null,
  currentTab: 'ficha'
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function init() {
  bindMenu();
  buildCharacterForm();
  openScreen('menu-screen');
}

function bindMenu() {
  $$('#menu-screen [data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'createCharacter') openScreen('character-screen');
      if (action === 'newGame') startNewGame();
      if (action === 'loadGame') showLoadGame();
      if (action === 'myCharacters') showCharacters();
      if (action === 'settings') showSettings();
      if (action === 'credits') showCredits();
      if (action === 'worldLore') showLore();
    });
  });

  $$('[data-nav="menu"]').forEach((btn) => btn.addEventListener('click', saveAndBackToMenu));

  $('#action-form').addEventListener('submit', onPlayerAction);

  $$('.tab-btn').forEach((btn) => btn.addEventListener('click', () => setTab(btn.dataset.tab)));
}

function openScreen(id) {
  $$('.screen').forEach((s) => s.classList.remove('active'));
  $(`#${id}`).classList.add('active');
}

function buildCharacterForm() {
  const raceSelect = $('#character-form select[name="raca"]');
  raceSelect.innerHTML = Object.keys(DATA.races).map((r) => `<option>${r}</option>`).join('');

  const attrs = $('#attributes-grid');
  attrs.innerHTML = DATA.attributes.map((attr) => `
    <div class="attr-control" data-attr="${attr}">
      <strong>${attr}</strong>
      <div>Valor: <span class="attr-value">1</span></div>
      <div class="buttons">
        <button type="button" class="minus">-</button>
        <button type="button" class="plus">+</button>
      </div>
    </div>`).join('');

  const prof = $('#proficiency-select');
  prof.innerHTML = DATA.proficiencies.map((p) => `<option>${p}</option>`).join('');

  const values = Object.fromEntries(DATA.attributes.map((a) => [a, 1]));
  let extraPoints = 15;

  attrs.addEventListener('click', (e) => {
    const control = e.target.closest('.attr-control');
    if (!control) return;
    const attr = control.dataset.attr;
    if (e.target.classList.contains('plus') && extraPoints > 0) {
      values[attr] += 1;
      extraPoints -= 1;
    }
    if (e.target.classList.contains('minus') && values[attr] > 1) {
      values[attr] -= 1;
      extraPoints += 1;
    }
    control.querySelector('.attr-value').textContent = values[attr];
    $('#points-left').textContent = `Pontos restantes: ${extraPoints}`;
    renderSkills(values);
  });

  renderSkills(values);

  $('#character-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const character = {
      id: crypto.randomUUID(),
      nome: form.get('nome'),
      sobrenome: form.get('sobrenome'),
      idade: Number(form.get('idade')),
      alturaPeso: form.get('alturaPeso'),
      raca: form.get('raca'),
      historiaPessoal: form.get('historiaPessoal') || 'Sem registros.',
      attributes: values,
      skillPoints: Object.fromEntries(DATA.attributes.map((a) => [a, values[a] * 2])),
      proficiencia: $('#proficiency-select').value,
      hp: 14,
      sp: 14,
      gold: rollGold(),
      inventory: [],
      relations: {},
      reputation: 0,
      level: 1,
      xp: 0
    };
    persistCharacter(character);
    state.currentCharacter = character;
    alert(`Personagem salvo! Ouro inicial: ${character.gold} GP`);
    openScreen('menu-screen');
  });
}

function renderSkills(values) {
  const container = $('#skills-container');
  container.innerHTML = DATA.attributes.map((a) => {
    const related = DATA.skills[a].map((s) => `<li>${s}</li>`).join('');
    return `<div><strong>${a}</strong> — Pontos para perícias: ${values[a] * 2}<ul>${related}</ul></div>`;
  }).join('<hr/>');
}

function persistCharacter(character) {
  const chars = JSON.parse(localStorage.getItem('arca_chars') || '[]');
  chars.push(character);
  localStorage.setItem('arca_chars', JSON.stringify(chars));
}

function startNewGame() {
  const chars = JSON.parse(localStorage.getItem('arca_chars') || '[]');
  if (!chars.length) {
    alert('Crie um personagem primeiro.');
    openScreen('character-screen');
    return;
  }
  state.currentCharacter = chars.at(-1);
  state.game = {
    id: crypto.randomUUID(),
    playerId: state.currentCharacter.id,
    scene: 'pedra_alta_praca',
    hp: state.currentCharacter.hp,
    sp: state.currentCharacter.sp,
    gold: state.currentCharacter.gold,
    status: 'Atento',
    reputation: 'Neutra',
    inventory: ['Cantil', 'Faca de sobrevivência'],
    quests: ['Descobrir quem sabotou os suprimentos de Pedra Alta'],
    events: [],
    historyDiary: ['Capítulo 1 — Você chega a Pedra Alta, onde alianças frágeis escondem rivalidades antigas.'],
    relations: {
      'Mara, Mercadora': { humor: 'desconfiada', memoria: [], objetivo: 'lucrar e sobreviver', opiniao: 0 },
      'Irmão Kael, Ferreiro': { humor: 'seco', memoria: [], objetivo: 'proteger a forja', opiniao: 0 },
      'Capitã Rhen, Guarda': { humor: 'vigilante', memoria: [], objetivo: 'manter a ordem', opiniao: 0 }
    }
  };

  narrate('Mestre', 'A poeira avermelhada dança no ar quando você atravessa o arco de pedra de Pedra Alta. Três olhares pousam em você: a mercadora Mara, o ferreiro Kael e a capitã Rhen. Todos têm algo a esconder.');
  openScreen('game-screen');
  updateHUD();
  setTab('ficha');
}

function onPlayerAction(e) {
  e.preventDefault();
  const input = $('#player-action');
  const action = input.value.trim();
  if (!action) return;

  narrate('Você', action);
  const response = resolveAction(action.toLowerCase());
  narrate(response.speaker, response.text);
  state.game.events.push(response.event);
  state.game.historyDiary.push(response.diary);
  updateHUD();
  renderTab();
  input.value = '';
}

function resolveAction(action) {
  const social = state.currentCharacter.attributes.Carisma;
  if (action.includes('comprar') || action.includes('vender') || action.includes('negoci')) {
    const npc = state.game.relations['Mara, Mercadora'];
    const discount = social >= 4 || npc.opiniao > 1;
    const price = discount ? 8 : 10;
    npc.memoria.push(`Você tentou negociar. Resultado: preço ${price}.`);
    npc.opiniao += discount ? 1 : 0;
    const text = discount
      ? 'Mara cruza os braços, te observa por um segundo e sorri de canto: "Você sabe falar, viajante. Tudo bem... por você, 8 moedas. Mas não conte aos outros."'
      : 'Mara mede sua mochila, desconfiada. "Sem amizade, sem desconto. Lâmina simples: 10 moedas. Pague ou abra caminho."';
    return {
      speaker: 'Mara, Mercadora',
      text,
      event: `Negociação com Mara por item de loja (preço ${price}).`,
      diary: `No mercado de Pedra Alta, Mara testou sua lábia antes de ceder (ou não) no preço de uma lâmina.`
    };
  }

  if (action.includes('guarda') || action.includes('rhen') || action.includes('informação')) {
    const npc = state.game.relations['Capitã Rhen, Guarda'];
    npc.memoria.push('Você buscou informações sobre sabotagem.');
    npc.opiniao += 1;
    return {
      speaker: 'Capitã Rhen, Guarda',
      text: 'Rhen encosta a lança no chão e fala baixo: "Duas caixas de água sumiram da ala norte. Vi pegadas de botas de forjador, mas alguém tentou apagar os rastros. Se investigar, não atrapalhe meus homens."',
      event: 'Pista recebida sobre sabotagem dos suprimentos.',
      diary: 'Capitã Rhen revelou o roubo de água e uma trilha adulterada perto da ala norte.'
    };
  }

  if (action.includes('ferreiro') || action.includes('kael') || action.includes('arma')) {
    const npc = state.game.relations['Irmão Kael, Ferreiro'];
    const stern = state.currentCharacter.attributes.Inteligência < 3;
    npc.memoria.push('Você abordou Kael na forja.');
    return {
      speaker: 'Irmão Kael, Ferreiro',
      text: stern
        ? 'Kael limpa a fuligem da barba. "Se veio só pedir arma barata, volte quando trouxer metal de verdade."'
        : 'Kael observa suas mãos, avaliando. "Você entende ferramentas... traga sucata de Kaldor e forjo algo digno."',
      event: 'Interação com Kael na forja antiga.',
      diary: 'Kael manteve o tom áspero, mas deixou escapar que precisa de sucata de Kaldor para uma forja especial.'
    };
  }

  return {
    speaker: 'Mestre',
    text: 'Você sente o mundo reagir ao seu movimento: passos ao longe, uma discussão abafada perto do poço e o cheiro de chuva metálica no vento. Sua decisão abre novos caminhos — e novos riscos.',
    event: `Ação livre interpretada: ${action}`,
    diary: `Seu gesto alterou o clima de Pedra Alta, mudando tensões invisíveis entre as tribos.`
  };
}

function narrate(who, text) {
  const p = document.createElement('p');
  p.className = 'log-entry';
  p.innerHTML = `<strong>${who}:</strong> ${text}`;
  $('#narrative-log').appendChild(p);
  $('#narrative-log').scrollTop = $('#narrative-log').scrollHeight;
}

function setTab(tab) {
  state.currentTab = tab;
  $$('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  renderTab();
}

function renderTab() {
  if (!state.game || !state.currentCharacter) return;
  const t = state.currentTab;
  const c = $('#tab-content');
  if (t === 'ficha') {
    c.innerHTML = `<h3>${state.currentCharacter.nome} ${state.currentCharacter.sobrenome}</h3>
      <p><strong>Raça:</strong> ${state.currentCharacter.raca}</p>
      <p><strong>História pessoal:</strong> ${state.currentCharacter.historiaPessoal}</p>
      <p><strong>Nível:</strong> ${state.currentCharacter.level} | <strong>XP:</strong> ${state.currentCharacter.xp}</p>
      <ul>${Object.entries(state.currentCharacter.attributes).map(([k,v]) => `<li>${k}: ${v}</li>`).join('')}</ul>`;
  }
  if (t === 'inventario') c.innerHTML = `<ul>${state.game.inventory.map((i) => `<li>${i}</li>`).join('')}</ul>`;
  if (t === 'missoes') c.innerHTML = `<ul>${state.game.quests.map((q) => `<li>${q}</li>`).join('')}</ul>`;
  if (t === 'eventos') c.innerHTML = `<ol>${state.game.events.map((e) => `<li>${e}</li>`).join('')}</ol>`;
  if (t === 'relacoes') {
    c.innerHTML = Object.entries(state.game.relations).map(([name, data]) => `
      <div>
        <h4>${name}</h4>
        <p>Humor: ${data.humor} | Opinião: ${data.opiniao}</p>
        <p>Objetivo: ${data.objetivo}</p>
        <p>Memória recente: ${(data.memoria.at(-1) || 'Nenhuma')}</p>
      </div><hr/>`).join('');
  }
  if (t === 'historia') c.innerHTML = `<h3>Diário da Jornada</h3><ol>${state.game.historyDiary.map((h) => `<li>${h}</li>`).join('')}</ol>`;
}

function updateHUD() {
  if (!state.game) return;
  $('#hud-hp').textContent = `${state.game.hp}/14`;
  $('#hud-sp').textContent = `${state.game.sp}/14`;
  $('#hud-gold').textContent = String(state.game.gold);
  $('#hud-status').textContent = state.game.status;
  $('#hud-reputation').textContent = state.game.reputation;
}

function saveAndBackToMenu() {
  if (state.game) {
    const saves = JSON.parse(localStorage.getItem('arca_saves') || '[]');
    const slot = { ...state.game, time: new Date().toISOString() };
    saves.push(slot);
    localStorage.setItem('arca_saves', JSON.stringify(saves));
  }
  openScreen('menu-screen');
}

function showLoadGame() {
  const saves = JSON.parse(localStorage.getItem('arca_saves') || '[]');
  showModal('Carregar Jogo', saves.length
    ? `<ol>${saves.map((s, i) => `<li>Slot ${i + 1}: ${new Date(s.time).toLocaleString('pt-BR')} — Cena: ${s.scene}</li>`).join('')}</ol><p>Para simplificação, o jogo carrega sempre o último slot automaticamente ao clicar em "Novo Jogo" após ter personagem.</p>`
    : '<p>Nenhum slot de salvamento encontrado.</p>');
}

function showCharacters() {
  const chars = JSON.parse(localStorage.getItem('arca_chars') || '[]');
  showModal('Meus Personagens', chars.length
    ? `<ol>${chars.map((c) => `<li>${c.nome} ${c.sobrenome} (${c.raca})</li>`).join('')}</ol>`
    : '<p>Sem personagens salvos.</p>');
}

function showSettings() {
  showModal('Configurações', '<p>Modo PC e Mobile já ativo com layout responsivo, tipografia ampliada no celular e suporte a zoom nativo do navegador.</p>');
}

function showCredits() {
  showModal('Créditos', '<p><strong>CRIADO POR MESTRE VITOR SYKES</strong></p><p>Design e sistema narrativo: protótipo one-shot em navegador com foco em narrativa viva e NPCs reativos.</p>');
}

function showLore() {
  showModal('Mundo, História, Culturas e Raças', DATA.lore);
}

function showModal(title, html) {
  $('#modal-title').innerText = title;
  $('#modal-content').innerHTML = html;
  openScreen('modal-screen');
}

function rollGold() {
  return Math.floor(Math.random() * 50) + 1;
}

init();
