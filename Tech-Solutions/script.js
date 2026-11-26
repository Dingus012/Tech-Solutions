const NOMES_TIPO = { novo: "Novo recurso", correcao: "Correção", melhoria: "Melhoria" };

const STATUS = ["a-fazer", "andamento", "concluida", "cancelada"];

function dataEmDias(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function tarefasIniciais() {
  return [
    { id: 1, titulo: "Criar tela de login", descricao: "Login com e-mail e senha", tipo: "novo", vencimento: dataEmDias(1), status: "andamento", comentarios: ["Luana: o cliente quer login social também."] },
    { id: 2, titulo: "Corrigir erro no relatório", descricao: "Total aparece errado", tipo: "correcao", vencimento: dataEmDias(6), status: "a-fazer", comentarios: [] },
    { id: 3, titulo: "Melhorar tempo de carregamento", descricao: "Reduzir imagens da home", tipo: "melhoria", vencimento: dataEmDias(-2), status: "concluida", comentarios: [] }
  ];
}

function carregarTarefas() {
  const salvo = localStorage.getItem("tarefas");
  if (salvo) {
    return JSON.parse(salvo);
  }
  return tarefasIniciais();
}

function salvarTarefas() {
  localStorage.setItem("tarefas", JSON.stringify(tarefas));
}

let tarefas = carregarTarefas();
let tarefaAberta = null;

function formatarData(data) {
  return data.split("-").reverse().join("/");
}

function diasRestantes(data) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(data + "T00:00:00");
  return Math.round((venc - hoje) / 86400000);
}

function escapar(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

function proximoId() {
  let maior = 0;
  for (const t of tarefas) {
    if (t.id > maior) maior = t.id;
  }
  return maior + 1;
}

function desenharQuadro() {
  for (const status of STATUS) {
    const lista = document.getElementById("lista-" + status);
    const contador = document.getElementById("cont-" + status);
    lista.innerHTML = "";

    const daColuna = tarefas.filter(t => t.status === status);
    contador.textContent = daColuna.length;

    for (const tarefa of daColuna) {
      lista.appendChild(criarCartao(tarefa));
    }
  }
}

function criarCartao(tarefa) {
  const cartao = document.createElement("div");
  cartao.className = "cartao";

  const dias = diasRestantes(tarefa.vencimento);
  if (tarefa.status === "concluida") {
    cartao.classList.add("concluida");
  } else if (tarefa.status === "cancelada") {
    cartao.classList.add("cancelada");
  } else if (dias <= 2) {
    cartao.classList.add("prazo");
  }

  let textoPrazo = "Vence em " + formatarData(tarefa.vencimento);
  if (tarefa.status !== "concluida" && tarefa.status !== "cancelada" && dias < 0) {
    textoPrazo = "Atrasada desde " + formatarData(tarefa.vencimento);
  }

  cartao.innerHTML =
    '<span class="codigo">TS-' + tarefa.id + "</span>" +
    '<span class="etiqueta ' + tarefa.tipo + '">' + NOMES_TIPO[tarefa.tipo] + "</span>" +
    "<h3>" + escapar(tarefa.titulo) + "</h3>" +
    "<p>" + textoPrazo + "</p>";

  if (tarefa.status !== "concluida" && tarefa.status !== "cancelada") {
    const botao = document.createElement("button");
    botao.textContent = "Concluir";
    botao.addEventListener("click", function (evento) {
      evento.stopPropagation();
      tarefa.status = "concluida";
      salvarTarefas();
      desenharQuadro();
    });
    cartao.appendChild(botao);
  }

  cartao.addEventListener("click", function () {
    abrirDetalhes(tarefa);
  });

  return cartao;
}

document.getElementById("form-nova").addEventListener("submit", function (evento) {
  evento.preventDefault();

  const novaTarefa = {
    id: proximoId(),
    titulo: document.getElementById("titulo").value,
    descricao: document.getElementById("descricao").value,
    tipo: document.getElementById("tipo").value,
    vencimento: document.getElementById("vencimento").value,
    status: "a-fazer",
    comentarios: []
  };

  tarefas.push(novaTarefa);
  salvarTarefas();
  desenharQuadro();
  this.reset();
});

const janela = document.getElementById("detalhes");

function abrirDetalhes(tarefa) {
  tarefaAberta = tarefa;
  document.getElementById("det-titulo").textContent = tarefa.titulo;
  document.getElementById("det-codigo").textContent = "TS-" + tarefa.id;
  document.getElementById("det-descricao").textContent = tarefa.descricao;
  document.getElementById("det-status").value = tarefa.status;
  document.getElementById("det-vencimento").value = tarefa.vencimento;
  desenharComentarios();
  janela.showModal();
}

function desenharComentarios() {
  const ul = document.getElementById("det-comentarios");
  ul.innerHTML = "";
  for (const texto of tarefaAberta.comentarios) {
    const li = document.createElement("li");
    li.textContent = texto;
    ul.appendChild(li);
  }
}

document.getElementById("btn-comentar").addEventListener("click", function () {
  const campo = document.getElementById("novo-comentario");
  if (campo.value.trim() === "") return;
  tarefaAberta.comentarios.push(campo.value);
  campo.value = "";
  salvarTarefas();
  desenharComentarios();
});

document.getElementById("btn-salvar").addEventListener("click", function () {
  tarefaAberta.status = document.getElementById("det-status").value;
  tarefaAberta.vencimento = document.getElementById("det-vencimento").value;
  salvarTarefas();
  desenharQuadro();
  janela.close();
});

document.getElementById("btn-fechar").addEventListener("click", function () {
  janela.close();
});

document.getElementById("btn-excluir").addEventListener("click", function () {
  if (tarefaAberta.status !== "concluida" && tarefaAberta.status !== "cancelada") {
    alert("Só é possível excluir tarefas concluídas ou canceladas.");
    return;
  }
  if (confirm("Excluir esta tarefa?")) {
    tarefas = tarefas.filter(t => t.id !== tarefaAberta.id);
    salvarTarefas();
    desenharQuadro();
    janela.close();
  }
});

const botaoTema = document.getElementById("btn-tema");

botaoTema.addEventListener("click", function () {
  const escuro = document.body.classList.toggle("escuro");
  localStorage.setItem("tema", escuro ? "escuro" : "claro");
  botaoTema.textContent = escuro ? "Modo claro" : "Modo escuro";
});

if (localStorage.getItem("tema") === "escuro") {
  document.body.classList.add("escuro");
  botaoTema.textContent = "Modo claro";
}

desenharQuadro();
