import React, { useState, useEffect } from 'react';

interface Item {
  id: number;
  descricao: string;
  saldo: number;
}

interface Movimentacao {
  id: number;
  itemId: number;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  data: string;
  funcionario?: string;
}

interface Retirada {
  id: number;
  itemId: number;
  funcionario: string;
  quantidade: number;
  data: string;
}

const Almoxarifado: React.FC = () => {
  const [itens, setItens] = useState<Item[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [retiradas, setRetiradas] = useState<Retirada[]>([]);
  const [descricao, setDescricao] = useState('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [tipoMovimentacao, setTipoMovimentacao] = useState<'entrada' | 'saida'>('entrada');
  const [funcionario, setFuncionario] = useState('');
  const [itemSelecionado, setItemSelecionado] = useState<number | null>(null);
  const [dataMovimentacao, setDataMovimentacao] = useState<string>(new Date().toISOString().substr(0, 10));

  useEffect(() => {
    // Carregar dados iniciais de localStorage ou API (mock)
    const dadosItens = localStorage.getItem('almoxarifado_itens');
    const dadosMovs = localStorage.getItem('almoxarifado_movimentacoes');
    const dadosRetiradas = localStorage.getItem('almoxarifado_retiradas');
    if (dadosItens) setItens(JSON.parse(dadosItens));
    if (dadosMovs) setMovimentacoes(JSON.parse(dadosMovs));
    if (dadosRetiradas) setRetiradas(JSON.parse(dadosRetiradas));
  }, []);

  useEffect(() => {
    localStorage.setItem('almoxarifado_itens', JSON.stringify(itens));
  }, [itens]);

  useEffect(() => {
    localStorage.setItem('almoxarifado_movimentacoes', JSON.stringify(movimentacoes));
  }, [movimentacoes]);

  useEffect(() => {
    localStorage.setItem('almoxarifado_retiradas', JSON.stringify(retiradas));
  }, [retiradas]);

  const adicionarItem = () => {
    if (!descricao.trim()) return alert('Informe a descrição do item');

    const novoItem: Item = {
      id: itens.length > 0 ? itens[itens.length - 1].id + 1 : 1,
      descricao: descricao.trim(),
      saldo: 0
    };
    setItens([...itens, novoItem]);
    setDescricao('');
  };

  const registrarMovimentacao = () => {
    if (itemSelecionado === null) return alert('Selecione um item para movimentar');
    if (quantidade < 1) return alert('Quantidade deve ser maior que zero');

    const item = itens.find(i => i.id === itemSelecionado);
    if (!item) return alert('Item não encontrado');

    if (tipoMovimentacao === 'saida' && quantidade > item.saldo) {
      return alert('Quantidade de saída maior que saldo disponível');
    }

    const novaMovimentacao: Movimentacao = {
      id: movimentacoes.length > 0 ? movimentacoes[movimentacoes.length - 1].id + 1 : 1,
      itemId: itemSelecionado,
      tipo: tipoMovimentacao,
      quantidade,
      data: dataMovimentacao,
      funcionario: tipoMovimentacao === 'saida' ? funcionario : undefined
    };

    setMovimentacoes([...movimentacoes, novaMovimentacao]);

    // Atualiza saldo
    const itensAtualizados = itens.map(i => {
      if (i.id === itemSelecionado) {
        return {
          ...i,
          saldo: tipoMovimentacao === 'entrada' ? i.saldo + quantidade : i.saldo - quantidade
        };
      }
      return i;
    });
    setItens(itensAtualizados);

    if (tipoMovimentacao === 'saida' && funcionario.trim()) {
      const novaRetirada: Retirada = {
        id: retiradas.length > 0 ? retiradas[retiradas.length - 1].id + 1 : 1,
        itemId: itemSelecionado,
        funcionario: funcionario.trim(),
        quantidade,
        data: dataMovimentacao
      };
      setRetiradas([...retiradas, novaRetirada]);
    }

    setQuantidade(1);
    setFuncionario('');
  };

  const fichaDiaria = () => {
    const hoje = new Date().toISOString().substr(0, 10);
    const movHoje = movimentacoes.filter(m => m.data === hoje);
    return movHoje;
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Almoxarifado</h2>

      <section>
        <h3>Cadastro de Itens</h3>
        <input
          type="text"
          placeholder="Descrição do item"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          aria-label="Descrição do item"
        />
        <button onClick={adicionarItem}>Adicionar Item</button>
      </section>

      <section style={{ marginTop: 20 }}>
        <h3>Lista de Itens</h3>
        <ul>
          {itens.map(item => (
            <li key={item.id}>
              <button
                style={{ fontWeight: itemSelecionado === item.id ? 'bold' : 'normal' }}
                onClick={() => setItemSelecionado(item.id)}
              >
                {item.descricao} - Saldo: {item.saldo}
              </button>
            </li>
          ))}
          {itens.length === 0 && <li>Nenhum item cadastrado</li>}
        </ul>
      </section>

      <section style={{ marginTop: 20 }}>
        <h3>Movimentação de Estoque</h3>
        <div>
          <label>Tipo:</label>
          <select
            value={tipoMovimentacao}
            onChange={e => setTipoMovimentacao(e.target.value as 'entrada' | 'saida')}
          >
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </div>
        <div>
          <label>Quantidade:</label>
          <input
            type="number"
            min={1}
            value={quantidade}
            onChange={e => setQuantidade(Number(e.target.value))}
          />
        </div>
        <div>
          <label>Funcionário (para saída):</label>
          <input
            type="text"
            disabled={tipoMovimentacao === 'entrada'}
            value={funcionario}
            onChange={e => setFuncionario(e.target.value)}
          />
        </div>
        <div>
          <label>Data:</label>
          <input type="date" value={dataMovimentacao} onChange={e => setDataMovimentacao(e.target.value)} />
        </div>
        <button onClick={registrarMovimentacao}>Registrar</button>
      </section>

      <section style={{ marginTop: 20 }}>
        <h3>Ficha Diária ({new Date().toISOString().substr(0, 10)})</h3>
        <table border={1} cellPadding={5} cellSpacing={0}>
          <thead>
            <tr>
              <th>Item</th>
              <th>Tipo</th>
              <th>Quantidade</th>
              <th>Funcionário</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {fichaDiaria().map(mov => {
              const item = itens.find(i => i.id === mov.itemId);
              return (
                <tr key={mov.id}>
                  <td>{item ? item.descricao : 'Item não encontrado'}</td>
                  <td>{mov.tipo}</td>
                  <td>{mov.quantidade}</td>
                  <td>{mov.funcionario || '-'}</td>
                  <td>{mov.data}</td>
                </tr>
              );
            })}
            {fichaDiaria().length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>Nenhuma movimentação para a data de hoje.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: 20 }}>
        <h3>Retirada por Funcionário</h3>
        <table border={1} cellPadding={5} cellSpacing={0}>
          <thead>
            <tr>
              <th>Funcionário</th>
              <th>Item</th>
              <th>Quantidade</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {retiradas.map(r => {
              const item = itens.find(i => i.id === r.itemId);
              return (
                <tr key={r.id}>
                  <td>{r.funcionario}</td>
                  <td>{item ? item.descricao : 'Item não encontrado'}</td>
                  <td>{r.quantidade}</td>
                  <td>{r.data}</td>
                </tr>
              );
            })}
            {retiradas.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center' }}>Nenhuma retirada registrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default Almoxarifado;
