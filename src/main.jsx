import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowRight, Check, ChevronRight, Info, RotateCcw, Spade } from 'lucide-react'
import './styles.css'

const positions = [
  { id: 'UTG', label: 'Under the Gun' },
  { id: 'HJ', label: 'Hijack' },
  { id: 'CO', label: 'Cutoff' },
  { id: 'BTN', label: 'Button' },
  { id: 'SB', label: 'Small Blind' },
  { id: 'BB', label: 'Big Blind' },
]
const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']
const suits = [
  { id: 's', symbol: '♠', name: 'espadas', color: 'dark' },
  { id: 'h', symbol: '♥', name: 'copas', color: 'red' },
  { id: 'd', symbol: '♦', name: 'ouros', color: 'blue' },
  { id: 'c', symbol: '♣', name: 'paus', color: 'green' },
]

const positionIndex = Object.fromEntries(positions.map((p, i) => [p.id, i]))
const premium = new Set(['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo'])
const rangeByPosition = {
  UTG: new Set(['TT', '99', 'AQs', 'AJs', 'ATs', 'KQs', 'AQo']),
  HJ: new Set(['88', '77', 'A9s', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'AJo']),
  CO: new Set(['66', '55', '44', 'A8s', 'A7s', 'A5s', 'K9s', 'Q9s', 'J9s', 'T9s', '98s', 'ATo', 'KQo']),
  BTN: new Set(['33', '22', 'A6s', 'A4s', 'A3s', 'A2s', 'K8s', 'K7s', 'Q8s', 'J8s', 'T8s', '97s', '87s', '76s', '65s', 'A9o', 'KJo', 'QJo', 'JTo']),
  SB: new Set(['A5s', 'A4s', 'K9s', 'Q9s', 'J9s', 'T9s', '98s', '87s', 'ATo', 'KQo']),
  BB: new Set(['A5s', 'KTs', 'QTs', 'JTs', 'T9s', '98s', 'AJo', 'KQo']),
}

function handCode(cards) {
  if (cards.length !== 2) return ''
  const sorted = [...cards].sort((a, b) => ranks.indexOf(a.rank) - ranks.indexOf(b.rank))
  if (sorted[0].rank === sorted[1].rank) return sorted[0].rank + sorted[1].rank
  return sorted[0].rank + sorted[1].rank + (sorted[0].suit === sorted[1].suit ? 's' : 'o')
}

function App() {
  const [position, setPosition] = useState('CO')
  const [cards, setCards] = useState([{ rank: 'A', suit: 's' }, { rank: 'K', suit: 's' }])
  const code = handCode(cards)
  const isRaise = useMemo(() => {
    if (!code) return null
    const current = positionIndex[position]
    if (premium.has(code)) return true
    return positions.slice(0, current + 1).some((p) => rangeByPosition[p.id].has(code))
  }, [code, position])

  const selectCard = (rank, suit) => {
    const card = { rank, suit }
    if (cards.some((c) => c.rank === rank && c.suit === suit)) {
      setCards(cards.filter((c) => c.rank !== rank || c.suit !== suit))
    } else if (cards.length < 2) setCards([...cards, card])
    else setCards([cards[1], card])
  }

  const nextRound = () => {
    setPosition(positions[(positionIndex[position] + 1) % positions.length].id)
    setCards([])
  }

  return <div className="app-shell">
    <header>
      <a className="brand" href="#top"><span className="brand-mark"><Spade size={19} fill="currentColor" /></span><span>MESA <b>CERTA</b></span></a>
      <div className="header-tag"><span>●</span> GUIA PRÉ-FLOP · 6-MAX</div>
      <button className="icon-button" aria-label="Informações"><Info size={19}/></button>
    </header>

    <main id="top">
      <section className="hero-copy">
        <div className="eyebrow"><span></span> DECISÕES MAIS RÁPIDAS. JOGO MAIS SÓLIDO.</div>
        <h1>Sua jogada,<br/><em>na posição certa.</em></h1>
        <p>Selecione onde você está na mesa, escolha suas cartas<br className="desktop"/> e receba uma orientação pré-flop instantânea.</p>
      </section>

      <section className="workspace">
        <aside className="position-panel">
          <div className="step-title"><span>01</span><div><small>SUA POSIÇÃO</small><strong>Onde você está?</strong></div></div>
          <div className="positions">
            {positions.map((p) => <button key={p.id} onClick={() => setPosition(p.id)} className={position === p.id ? 'active' : ''}>
              <span className="position-code">{p.id}</span><span>{p.label}</span>{position === p.id && <Check size={16}/>} 
            </button>)}
          </div>
          <div className="tip"><Info size={15}/><p>Sua posição avança automaticamente a cada nova rodada.</p></div>
        </aside>

        <div className="hand-panel">
          <div className="step-title"><span>02</span><div><small>SUA MÃO</small><strong>Quais são suas cartas?</strong></div><button onClick={() => setCards([])} className="clear"><RotateCcw size={13}/> LIMPAR</button></div>
          <div className="card-grid" aria-label="Seletor de cartas">
            {ranks.map((rank) => <div className="rank-row" key={rank}>
              {suits.map((suit) => {
                const selected = cards.some((c) => c.rank === rank && c.suit === suit.id)
                return <button aria-label={`${rank} de ${suit.name}`} aria-pressed={selected} disabled={!selected && cards.length >= 2} onClick={() => selectCard(rank, suit.id)} key={suit.id} className={`playing-card ${suit.color} ${selected ? 'selected' : ''}`}>
                  <b>{rank}</b><span>{suit.symbol}</span>
                </button>
              })}
            </div>)}
          </div>
        </div>

        <aside className="result-panel">
          <div className="step-title light"><span>03</span><div><small>ORIENTAÇÃO</small><strong>Sua melhor ação</strong></div></div>
          <div className="context"><span>POSIÇÃO <b>{position}</b></span><i></i><span>MÃO <b>{code || '—'}</b></span></div>
          <div className={`action ${isRaise === false ? 'fold' : ''}`}>
            <small>AÇÃO RECOMENDADA</small>
            <strong>{isRaise === null ? 'ESCOLHA 2 CARTAS' : isRaise ? 'RAISE' : 'FOLD'}</strong>
            {isRaise !== null && <div className="size"><span>↗</span><p>{isRaise ? <>Abra com <b>2.5 BB</b></> : <>Espere uma situação melhor</>}</p></div>}
          </div>
          <div className="reason"><small>POR QUÊ?</small><p>{isRaise === null ? 'Selecione duas cartas para visualizar a recomendação.' : isRaise ? <><b>{code}</b> está dentro do range recomendado para abrir de <b>{position}</b>.</> : <><b>{code}</b> está fora do range recomendado para abrir de <b>{position}</b>.</>}</p></div>
          <button className="next" onClick={nextRound}><span>PRÓXIMA RODADA<small>Você estará em {positions[(positionIndex[position] + 1) % positions.length].id}</small></span><ChevronRight/></button>
          <p className="disclaimer">Orientação baseada em estratégia GTO simplificada.<br/>Adapte ao perfil da sua mesa.</p>
        </aside>
      </section>
    </main>
    <footer><span>© 2026 MESA CERTA</span><p><i></i> JOGUE COM RESPONSABILIDADE</p><a href="#top">COMO FUNCIONA <ArrowRight size={13}/></a></footer>
  </div>
}

createRoot(document.getElementById('root')).render(<App />)
