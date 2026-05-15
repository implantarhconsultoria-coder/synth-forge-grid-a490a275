import React, { useState, useEffect } from 'react';

interface PointingData {
  cpf: string;
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  photo: string | null;
  mobile: string;
}

interface Ticket {
  id: string;
  title: string;
  status: string;
  itemsUsed: string[];
  client: string;
  location: string;
  history: string[];
  conclusion?: string;
}

const App: React.FC = () => {
  // Estados para ponto
  const [cpf, setCpf] = useState('');
  const [mobile, setMobile] = useState('');
  const [location, setLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  // Estados para chamados
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [conclusionInput, setConclusionInput] = useState('');

  useEffect(() => {
    // Pede permissão e obtém localização do usuário
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        () => {
          setMessage('Não foi possível obter localização.');
        }
      );
    } else {
      setMessage('Geolocalização não suportada.');
    }

    // Carregar chamados (mock ou fetch real)
    async function fetchTickets() {
      try {
        // Exemplo: const response = await fetch('/api/tickets');
        // const data = await response.json();
        // Usando mock para demonstração:
        const data: Ticket[] = [
          {
            id: '1',
            title: 'Manutenção ar condicionado',
            status: 'Aberto',
            itemsUsed: ['Filtro', 'Motor'],
            client: 'Empresa A',
            location: 'Edifício Central',
            history: ['Chamado aberto em 01/05', 'Técnico designado'],
          },
          {
            id: '2',
            title: 'Reparo iluminação',
            status: 'Em andamento',
            itemsUsed: ['Lâmpada LED'],
            client: 'Empresa B',
            location: 'Filial Zona Sul',
            history: ['Chamado aberto em 05/05', 'Peças solicitadas'],
          }
        ];
        setTickets(data);
      } catch {
        setMessage('Erro ao carregar chamados.');
      }
    }

    fetchTickets();
  }, []);

  const handlePhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitPointing = async () => {
    if (!cpf || !mobile) {
      setMessage('Preencha CPF e telefone móvel.');
      return;
    }
    const pointingData: PointingData = {
      cpf,
      timestamp: new Date().toISOString(),
      location,
      photo,
      mobile
    };
    try {
      // Supondo API que recebe batida
      const response = await fetch('/api/pointing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pointingData)
      });
      if (response.ok) {
        setMessage('Ponto registrado com sucesso.');
        setPhoto(null);
        setLocation(null);
        setCpf('');
        setMobile('');
      } else {
        setMessage('Erro ao registrar ponto.');
      }
    } catch (error) {
      setMessage('Falha na conexão.');
    }
  };

  // Atualiza conclusão do chamado selecionado
  const handleConclusionUpdate = () => {
    if (!selectedTicketId) return;
    setTickets(prev => prev.map(t => {
      if (t.id === selectedTicketId) {
        return {...t, conclusion: conclusionInput, status: 'Concluído', history: [...t.history, `Conclusão: ${conclusionInput}`]};
      }
      return t;
    }));
    setConclusionInput('');
    setMessage('Conclusão atualizada com sucesso.');
  };

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null;

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>Registre seu ponto</h1>
      <label>
        CPF:<br />
        <input
          type="text"
          value={cpf}
          onChange={e => setCpf(e.target.value)}
          placeholder="Digite seu CPF"
          maxLength={14}
          pattern="\d{3}\.\d{3}\.\d{3}-\d{2}"
          required
        />
      </label>
      <br /><br />
      <label>
        Telefone móvel:<br />
        <input
          type="tel"
          value={mobile}
          onChange={e => setMobile(e.target.value)}
          placeholder="(00) 00000-0000"
          pattern="\([0-9]{2}\) [0-9]{4,5}-[0-9]{4}"
          required
        />
      </label>
      <br /><br />
      <label>
        Foto (selfie):<br />
        <input type="file" accept="image/*" capture="user" onChange={handlePhoto} />
      </label>
      {photo && <div><img src={photo} alt="Foto capturada" style={{ marginTop: '10px', maxWidth: '100%' }} /></div>}
      <br />
      <div>
        Localização: {location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : 'Não capturada'}
      </div>
      <br />
      <button onClick={handleSubmitPointing} style={{ padding: '10px 20px', cursor: 'pointer' }}>
        Registrar ponto
      </button>

      <hr style={{ margin: '40px 0' }}/>

      <h2>Chamados Operacionais</h2>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1, maxHeight: '400px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
          <h3>Lista de Chamados</h3>
          {tickets.length === 0 && <p>Nenhum chamado disponível.</p>}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {tickets.map(ticket => (
              <li key={ticket.id} style={{ marginBottom: '10px', cursor: 'pointer', backgroundColor: ticket.id === selectedTicketId ? '#eef' : 'transparent', padding: '5px', borderRadius: '4px' }} onClick={() => setSelectedTicketId(ticket.id)}>
                <strong>{ticket.title}</strong> <br />
                Status: {ticket.status} <br />
                Cliente: {ticket.client}
              </li>
            ))}
          </ul>
        </div>

        {selectedTicket && (
          <div style={{ flex: 2, border: '1px solid #ccc', padding: '10px', borderRadius: '4px' }}>
            <h3>Detalhes do Chamado</h3>
            <p><strong>Título:</strong> {selectedTicket.title}</p>
            <p><strong>Status:</strong> {selectedTicket.status}</p>
            <p><strong>Cliente / Local:</strong> {selectedTicket.client} / {selectedTicket.location}</p>
            <p><strong>Itens usados:</strong></p>
            <ul>
              {selectedTicket.itemsUsed.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
            <p><strong>Histórico:</strong></p>
            <ul style={{ maxHeight: '150px', overflowY: 'auto', backgroundColor: '#f9f9f9', padding: '5px', borderRadius: '4px' }}>
              {selectedTicket.history.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
            <br />
            <label>
              Conclusão:<br />
              <textarea
                value={conclusionInput}
                onChange={e => setConclusionInput(e.target.value)}
                rows={3}
                style={{ width: '100%' }}
                placeholder="Descreva a conclusão do chamado"
              />
            </label>
            <br /><br />
            <button onClick={handleConclusionUpdate} style={{ padding: '10px 20px', cursor: 'pointer' }}>Atualizar Conclusão</button>
          </div>
        )}
      </div>
      <p style={{ color: 'red' }}>{message}</p>
    </div>
  );
};

export default App;
