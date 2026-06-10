// === FUNÇÕES DE APOIO ===
function limparParaCalculo(valorString) {
    if (!valorString) return 0;
    let limpo = valorString
        .replace('R$', '')
        .replace('%', '')
        .replace('x', '')
        .replace(/\./g, '')
        .replace(',', '.')
        .trim();
    return parseFloat(limpo) || 0;
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

// === CÁLCULO DE PREVISÃO DA ENTRADA EM TEMPO REAL ===
function preverEntrada() {
    const precoStr = document.getElementById('preco').value;
    const percentualStr = document.getElementById('entrada_pct').value;
    
    const preco = limparParaCalculo(precoStr);
    const percentual = limparParaCalculo(percentualStr);
    
    if (preco > 0 && percentual > 0) {
        const previsao = preco * (percentual / 100);
        document.getElementById('prev_entrada').value = formatarMoeda(previsao);
    } else {
        document.getElementById('prev_entrada').value = "R$ 0,00";
    }
}

document.getElementById('preco').addEventListener('input', preverEntrada);
document.getElementById('entrada_pct').addEventListener('input', preverEntrada);


// === MÁSCARAS AUTOMÁTICAS ===
const inputsMoeda = document.querySelectorAll('.money');
inputsMoeda.forEach(input => {
    input.addEventListener('input', function(e) {
        let valor = e.target.value.replace(/\D/g, '');
        if (valor === '') { e.target.value = ''; preverEntrada(); return; }
        
        valor = (parseInt(valor) / 100).toFixed(2);
        valor = valor.replace('.', ',');
        valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
        
        e.target.value = 'R$ ' + valor;
        preverEntrada();
    });
});

const inputsPercentNoDecimal = document.querySelectorAll('.percent-nodecimal');
inputsPercentNoDecimal.forEach(input => {
    input.addEventListener('input', function(e) {
        let valor = e.target.value.replace(/\D/g, '');
        if (valor === '') { e.target.value = ''; preverEntrada(); return; }
        
        e.target.value = parseInt(valor) + '%';
        preverEntrada();
        
        setTimeout(() => {
            const pos = e.target.value.indexOf('%');
            e.target.setSelectionRange(pos, pos);
        }, 0);
    });
});

const inputsPercentDecimal = document.querySelectorAll('.percent-decimal');
inputsPercentDecimal.forEach(input => {
    input.addEventListener('input', function(e) {
        let valor = e.target.value.replace(/\D/g, '');
        if (valor === '') { e.target.value = ''; return; }
        
        valor = (parseInt(valor) / 100).toFixed(2);
        valor = valor.replace('.', ',');
        
        e.target.value = valor + '%';
        
        setTimeout(() => {
            const pos = e.target.value.indexOf('%');
            e.target.setSelectionRange(pos, pos);
        }, 0);
    });
});

const inputsPrazo = document.querySelectorAll('.number-noxspace');
inputsPrazo.forEach(input => {
    input.addEventListener('input', function(e) {
        let valor = e.target.value.replace(/\D/g, '');
        if (valor === '') { e.target.value = ''; return; }
        
        e.target.value = parseInt(valor) + 'x';
        
        setTimeout(() => {
            const pos = e.target.value.indexOf('x');
            e.target.setSelectionRange(pos, pos);
        }, 0);
    });
});


// === LÓGICA PRINCIPAL ===
function calcular() {
    const modeloInput = document.getElementById('modelo').value.trim();
    const preco = limparParaCalculo(document.getElementById('preco').value);
    const percentualEntrada = limparParaCalculo(document.getElementById('entrada_pct').value);
    const bonus = limparParaCalculo(document.getElementById('bonus').value);
    const taxaMes = limparParaCalculo(document.getElementById('taxa').value);
    const seminovo = limparParaCalculo(document.getElementById('seminovo').value);
    const prazo = parseInt(limparParaCalculo(document.getElementById('prazo').value)) || 0;

    if (preco <= 0 || prazo <= 0) {
        alert("Por favor, preencha corretamente o Preço do Veículo e o Prazo.");
        return;
    }

    const valorEntrada = preco * (percentualEntrada / 100);

    if (seminovo > valorEntrada) {
        alert(`A Avaliação do Seminovo (R$ ${seminovo}) não pode ser maior que a Entrada Exigida (R$ ${valorEntrada}).`);
        return; 
    }

    const entradaRestante = valorEntrada - seminovo;
    let valorFinanciado = preco - valorEntrada - bonus;
    
    if (valorFinanciado < 0) valorFinanciado = 0;

    let valorParcela = 0;
    
    // Tabela Price
    if (taxaMes > 0 && valorFinanciado > 0) {
        const i = taxaMes / 100;
        valorParcela = valorFinanciado * (i * Math.pow(1 + i, prazo)) / (Math.pow(1 + i, prazo) - 1);
    } else if (valorFinanciado > 0) {
        valorParcela = valorFinanciado / prazo;
    }

    const valorTotal = valorEntrada + (valorParcela * prazo);

    // Atualiza Painel Grid Visual
    document.getElementById('res_entrada').innerText = formatarMoeda(valorEntrada);
    document.getElementById('res_dinheiro_extra').innerText = formatarMoeda(entradaRestante);
    document.getElementById('res_financiado').innerText = formatarMoeda(valorFinanciado);
    document.getElementById('res_prazo').innerText = prazo;
    document.getElementById('res_parcela').innerText = formatarMoeda(valorParcela);
    document.getElementById('res_total').innerText = formatarMoeda(valorTotal);

    const painelResultados = document.getElementById('resultados');
    painelResultados.style.display = 'block';

    // Dispara criação da linha no Histórico
    const taxaFormatada = document.getElementById('taxa').value || "0,00%";
    adicionarAoHistorico(modeloInput, preco, valorEntrada, seminovo, entradaRestante, taxaFormatada, valorParcela, prazo, valorTotal);

    // === NOVIDADES: SCROLL AUTOMÁTICO E LIMPEZA DOS CAMPOS ===
    
    // Faz a página rolar suavemente até o painel de resultados
    painelResultados.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Zera os inputs para a próxima simulação
    document.getElementById('modelo').value = '';
    document.getElementById('preco').value = '';
    document.getElementById('entrada_pct').value = '';
    document.getElementById('prev_entrada').value = ''; 
    document.getElementById('seminovo').value = '';
    document.getElementById('bonus').value = '';
    document.getElementById('taxa').value = '';
    document.getElementById('prazo').value = '';
}

function adicionarAoHistorico(modelo, preco, entrada, seminovo, entradaRestante, taxa, parcela, prazo, total) {
    const tabelaBody = document.querySelector('#tabela_historico tbody');
    const secaoHistorico = document.getElementById('historico_secao');
    
    const novaLinha = document.createElement('tr');
    const modeloTexto = modelo ? modelo : "Não informado";
    
    novaLinha.innerHTML = `
        <td><strong>${modeloTexto}</strong></td>
        <td>${formatarMoeda(preco)}</td>
        <td>${formatarMoeda(entrada)}</td>
        <td>${formatarMoeda(seminovo)}</td>
        <td>${formatarMoeda(entradaRestante)}</td>
        <td>${taxa}</td>
        <td><strong>${prazo}x de ${formatarMoeda(parcela)}</strong></td>
        <td style="color: var(--text-dark); font-weight: 700;">${formatarMoeda(total)}</td>
    `;
    
    tabelaBody.insertBefore(novaLinha, tabelaBody.firstChild);
    secaoHistorico.style.display = 'block';
}

// === EXPORTAR PARA CSV (EXCEL) ===
function salvarTabelaCSV() {
    let csv = [];
    let rows = document.querySelectorAll("#tabela_historico tr");
    
    for (let i = 0; i < rows.length; i++) {
        let row = [], cols = rows[i].querySelectorAll("td, th");
        
        for (let j = 0; j < cols.length; j++) {
            let text = cols[j].innerText.replace(/"/g, '""');
            row.push('"' + text + '"');
        }
        csv.push(row.join(";"));
    }

    let csvFile = new Blob(["\ufeff" + csv.join("\n")], {type: "text/csv;charset=utf-8;"});
    
    let downloadLink = document.createElement("a");
    downloadLink.download = "historico_financiamentos.csv";
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}