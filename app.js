// ===== Configurações =====
const CHAVE_STORAGE = 'reservas-salas-v2';
const MANHA_INICIO = '07:20';
const MANHA_FIM = '12:30';
const TARDE_INICIO = '13:00';
const TARDE_FIM = '18:15';

// ===== Elementos da página (acessados por el.nome) =====
const el = {};
[
  'data', 'modo', 'fEsp', 'fProf', 'lista', 'listaEsp', 'prev', 'next', 'fab',
  'novoEsp', 'agenda', 'espacos',
  'dRes', 'fRes', 'tRes', 'rEsp', 'rData', 'rIni', 'rFim', 'rResp', 'rTurma', 'rFin', 'rErro', 'rDel',
  'dEsp', 'fEspForm', 'tEsp', 'eNome', 'eTipo', 'eCap', 'eRec', 'eDel'
].forEach(function (id) {
  el[id] = document.getElementById(id);
});

// ===== Funções auxiliares =====
function dataParaTexto(d) {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return ano + '-' + mes + '-' + dia;
}

function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function escapar(texto) {
  const trocas = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(texto == null ? '' : texto).replace(/[&<>"']/g, function (c) {
    return trocas[c];
  });
}

function formatarData(texto) {
  const partes = texto.split('-');
  return partes[2] + '/' + partes[1] + '/' + partes[0];
}

function somarDias(texto, quantidade) {
  const d = new Date(texto + 'T12:00');
  d.setDate(d.getDate() + quantidade);
  return dataParaTexto(d);
}

// ===== Dados (localStorage) =====
function carregarDados() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_STORAGE));
    if (salvo && salvo.espacos && salvo.reservas) {
      return salvo;
    }
  } catch (erro) {
    // dados inválidos: começa do zero
  }
  return {
    espacos: [
      { id: 'e1', nome: 'Laboratório de Ciências', tipo: 'Laboratório', capacidade: 30, recursos: ['Bancadas', 'Pia'] },
      { id: 'e2', nome: 'Biblioteca', tipo: 'Biblioteca', capacidade: 40, recursos: [] },
      { id: 'e3', nome: 'Laboratório de Informática 1', tipo: 'Laboratório', capacidade: 30, recursos: ['Computadores'] },
      { id: 'e4', nome: 'Laboratório de Informática 2', tipo: 'Laboratório', capacidade: 30, recursos: ['Computadores'] },
      { id: 'e5', nome: 'Laboratório de Informática 3', tipo: 'Laboratório', capacidade: 30, recursos: ['Computadores'] },
      { id: 'e6', nome: 'Auditório', tipo: 'Auditório', capacidade: 100, recursos: ['Som', 'Projetor'] }
    ],
    reservas: []
  };
}

let dados = carregarDados();
let reservaAtual = null;
let espacoAtual = null;

function salvarDados() {
  try {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(dados));
  } catch (erro) {
    alert('Não foi possível salvar. A alteração foi descartada.');
    dados = carregarDados();
  }
}

function nomeDoEspaco(id) {
  const espaco = dados.espacos.find(function (e) {
    return e.id === id;
  });
  return espaco ? espaco.nome : '(espaço removido)';
}

// ===== Agenda =====
function desenharAgenda() {
  // Preenche o filtro de espaços mantendo a seleção atual
  const selecionado = el.fEsp.value;
  let opcoes = '<option value="">Todos os espaços</option>';
  dados.espacos.forEach(function (e) {
    opcoes += '<option value="' + e.id + '">' + escapar(e.nome) + '</option>';
  });
  el.fEsp.innerHTML = opcoes;
  el.fEsp.value = selecionado;

  // Define quais dias serão mostrados (1 dia ou a semana de segunda a domingo)
  const dataBase = el.data.value || dataParaTexto(new Date());
  let dias = [dataBase];
  if (el.modo.value === 'semana') {
    const diaDaSemana = (new Date(dataBase + 'T12:00').getDay() + 6) % 7; // segunda = 0
    const segunda = somarDias(dataBase, -diaDaSemana);
    dias = [0, 1, 2, 3, 4].map(function (n) {
      return somarDias(segunda, n);
    });
  }

  const nomesDias = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const filtroProfessor = el.fProf.value.trim().toLowerCase();
  const modoSemana = dias.length > 1;
  let html = '';

  dias.forEach(function (dia) {
    const reservasDoDia = dados.reservas
      .filter(function (r) {
        const mesmoDia = r.data === dia;
        const mesmoEspaco = !el.fEsp.value || r.espacoId === el.fEsp.value;
        const mesmoProfessor = !filtroProfessor || r.responsavel.toLowerCase().includes(filtroProfessor);
        return mesmoDia && mesmoEspaco && mesmoProfessor;
      })
      .sort(function (a, b) {
        return a.inicio.localeCompare(b.inicio);
      });

    if (modoSemana) {
      const nomeDia = nomesDias[new Date(dia + 'T12:00').getDay()];
      html += '<h3>' + nomeDia + ', ' + formatarData(dia) + '</h3>';
    }

    if (reservasDoDia.length === 0) {
      html += modoSemana
        ? '<p class="vazio">Sem reservas.</p>'
        : '<p class="vazio">Nenhuma reserva neste dia. Toque em “Nova reserva” para criar uma.</p>';
      return;
    }

    reservasDoDia.forEach(function (r) {
      html += '<button class="card" data-id="' + r.id + '">';
      html += '<b>' + r.inicio + '–' + r.fim + '</b> ' + escapar(nomeDoEspaco(r.espacoId));
      html += '<small>' + escapar(r.responsavel) + ', turma ' + escapar(r.turma) + '</small>';
      if (r.finalidade) {
        html += '<small>' + escapar(r.finalidade) + '</small>';
      }
      html += '</button>';
    });
  });

  el.lista.innerHTML = html;
}

// ===== Reservas =====
function validarReserva(r) {
  if (!r.espacoId) {
    return 'Cadastre e escolha um espaço.';
  }
  if (r.data < dataParaTexto(new Date())) {
    return 'Não é possível reservar datas passadas.';
  }
  const diaDaSemana = new Date(r.data + 'T12:00').getDay();
  if (diaDaSemana === 0 || diaDaSemana === 6) {
    return 'Não é possível reservar aos sábados e domingos.';
  }

  // A reserva deve ficar inteira na manhã OU inteira na tarde
  const naManha = r.inicio >= MANHA_INICIO && r.fim <= MANHA_FIM;
  const naTarde = r.inicio >= TARDE_INICIO && r.fim <= TARDE_FIM;
  if (!naManha && !naTarde) {
    return 'A reserva deve ficar dentro da manhã (' + MANHA_INICIO + ' às ' + MANHA_FIM +
      ') ou da tarde (' + TARDE_INICIO + ' às ' + TARDE_FIM + ').';
  }
  if (r.fim <= r.inicio) {
    return 'O horário de fim deve ser maior que o de início.';
  }

  // Conflito: mesmo espaço, mesmo dia, e os horários se cruzam.
  // 08:00-09:00 e 09:00-10:00 NÃO conflitam.
  const conflito = dados.reservas.find(function (x) {
    return x.id !== r.id &&
      x.espacoId === r.espacoId &&
      x.data === r.data &&
      x.inicio < r.fim &&
      r.inicio < x.fim;
  });
  if (conflito) {
    return 'Conflito: ' + nomeDoEspaco(conflito.espacoId) + ' já está reservado por ' +
      conflito.responsavel + ' das ' + conflito.inicio + ' às ' + conflito.fim + '.';
  }
  return '';
}

function abrirReserva(reserva) {
  reservaAtual = reserva || null;
  el.tRes.textContent = reserva ? 'Editar reserva' : 'Nova reserva';

  let opcoes = '';
  dados.espacos.forEach(function (e) {
    opcoes += '<option value="' + e.id + '">' + escapar(e.nome) + '</option>';
  });
  el.rEsp.innerHTML = opcoes;

  const primeiroEspaco = dados.espacos[0] ? dados.espacos[0].id : '';
  el.rEsp.value = reserva ? reserva.espacoId : (el.fEsp.value || primeiroEspaco);
  el.rData.value = reserva ? reserva.data : (el.data.value || dataParaTexto(new Date()));
  el.rIni.value = reserva ? reserva.inicio : '';
  el.rFim.value = reserva ? reserva.fim : '';
  el.rResp.value = reserva ? reserva.responsavel : '';
  el.rTurma.value = reserva ? reserva.turma : '';
  el.rFin.value = reserva ? reserva.finalidade : '';
  el.rErro.textContent = '';
  el.rDel.hidden = !reserva;
  el.dRes.showModal();
}

el.fRes.addEventListener('submit', function (evento) {
  evento.preventDefault();

  const reserva = {
    id: reservaAtual ? reservaAtual.id : gerarId(),
    espacoId: el.rEsp.value,
    data: el.rData.value,
    inicio: el.rIni.value,
    fim: el.rFim.value,
    responsavel: el.rResp.value.trim(),
    turma: el.rTurma.value.trim(),
    finalidade: el.rFin.value.trim()
  };

  const erro = validarReserva(reserva);
  if (erro) {
    el.rErro.textContent = erro;
    return;
  }

  dados.reservas = dados.reservas
    .filter(function (x) {
      return x.id !== reserva.id;
    })
    .concat(reserva);
  salvarDados();
  el.data.value = reserva.data;
  el.dRes.close();
  desenharAgenda();
});

el.rDel.addEventListener('click', function () {
  if (reservaAtual && confirm('Cancelar esta reserva?')) {
    dados.reservas = dados.reservas.filter(function (x) {
      return x.id !== reservaAtual.id;
    });
    salvarDados();
    el.dRes.close();
    desenharAgenda();
  }
});

// ===== Espaços =====
function desenharEspacos() {
  if (dados.espacos.length === 0) {
    el.listaEsp.innerHTML = '<p class="vazio">Nenhum espaço cadastrado. Toque em “Novo espaço”.</p>';
    return;
  }

  let html = '';
  dados.espacos.forEach(function (e) {
    html += '<button class="card" data-id="' + e.id + '">';
    html += '<b>' + escapar(e.nome) + '</b>';
    html += '<small>' + escapar(e.tipo) + ', ' + e.capacidade + ' lugares</small>';
    if (e.recursos.length > 0) {
      html += '<small>' + escapar(e.recursos.join(', ')) + '</small>';
    }
    html += '</button>';
  });
  el.listaEsp.innerHTML = html;
}

function abrirEspaco(espaco) {
  espacoAtual = espaco || null;
  el.tEsp.textContent = espaco ? 'Editar espaço' : 'Novo espaço';
  el.eNome.value = espaco ? espaco.nome : '';
  el.eTipo.value = espaco ? espaco.tipo : 'Sala de aula';
  el.eCap.value = espaco ? espaco.capacidade : '';
  el.eRec.value = espaco ? espaco.recursos.join(', ') : '';
  el.eDel.hidden = !espaco;
  el.dEsp.showModal();
}

el.fEspForm.addEventListener('submit', function (evento) {
  evento.preventDefault();

  const espaco = {
    id: espacoAtual ? espacoAtual.id : gerarId(),
    nome: el.eNome.value.trim(),
    tipo: el.eTipo.value,
    capacidade: Number(el.eCap.value),
    recursos: el.eRec.value
      .split(',')
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean)
  };

  dados.espacos = dados.espacos
    .filter(function (x) {
      return x.id !== espaco.id;
    })
    .concat(espaco);
  dados.espacos.sort(function (a, b) {
    return a.nome.localeCompare(b.nome);
  });
  salvarDados();
  el.dEsp.close();
  desenharEspacos();
  desenharAgenda();
});

el.eDel.addEventListener('click', function () {
  if (!espacoAtual) {
    return;
  }
  const hoje = dataParaTexto(new Date());
  const futuras = dados.reservas.filter(function (x) {
    return x.espacoId === espacoAtual.id && x.data >= hoje;
  });
  if (futuras.length > 0) {
    alert('Este espaço tem ' + futuras.length + ' reserva(s) futura(s). Cancele-as antes de excluir o espaço.');
    return;
  }
  if (confirm('Excluir este espaço? As reservas antigas dele também serão removidas.')) {
    dados.espacos = dados.espacos.filter(function (x) {
      return x.id !== espacoAtual.id;
    });
    dados.reservas = dados.reservas.filter(function (x) {
      return x.espacoId !== espacoAtual.id;
    });
    salvarDados();
    el.dEsp.close();
    desenharEspacos();
    desenharAgenda();
  }
});

// ===== Eventos gerais =====
el.data.value = dataParaTexto(new Date());

['data', 'modo', 'fEsp'].forEach(function (id) {
  el[id].addEventListener('change', desenharAgenda);
});
el.fProf.addEventListener('input', desenharAgenda);

function mudarData(direcao) {
  const passo = el.modo.value === 'semana' ? 7 : 1;
  const base = el.data.value || dataParaTexto(new Date());
  el.data.value = somarDias(base, direcao * passo);
  desenharAgenda();
}
el.prev.addEventListener('click', function () {
  mudarData(-1);
});
el.next.addEventListener('click', function () {
  mudarData(1);
});

el.fab.addEventListener('click', function () {
  abrirReserva();
});
el.novoEsp.addEventListener('click', function () {
  abrirEspaco();
});

el.lista.addEventListener('click', function (evento) {
  const botao = evento.target.closest('.card');
  if (botao) {
    abrirReserva(dados.reservas.find(function (r) {
      return r.id === botao.dataset.id;
    }));
  }
});

el.listaEsp.addEventListener('click', function (evento) {
  const botao = evento.target.closest('.card');
  if (botao) {
    abrirEspaco(dados.espacos.find(function (e) {
      return e.id === botao.dataset.id;
    }));
  }
});

document.querySelectorAll('.fechar').forEach(function (botao) {
  botao.addEventListener('click', function () {
    botao.closest('dialog').close();
  });
});

// Abas (Agenda / Espaços)
const botoesAba = document.querySelectorAll('nav button');
botoesAba.forEach(function (botao) {
  botao.addEventListener('click', function () {
    botoesAba.forEach(function (outro) {
      outro.classList.toggle('on', outro === botao);
    });
    el.agenda.hidden = botao.dataset.t !== 'agenda';
    el.espacos.hidden = botao.dataset.t !== 'espacos';
    el.fab.hidden = botao.dataset.t !== 'agenda';
  });
});

// ===== Início =====
desenharAgenda();
desenharEspacos();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').catch(function () {
    // sem service worker o app funciona, só não fica offline
  });
}
