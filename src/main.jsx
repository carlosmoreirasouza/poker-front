import { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowRight, Check, ChevronDown, ChevronRight, Info, RotateCcw, Spade, TrendingUp, Users } from 'lucide-react'
import './styles.css'

const basePositions = [
  { id: 'UTG', label: 'Under the Gun' },
  { id: 'HJ', label: 'Hijack' },
  { id: 'CO', label: 'Cutoff' },
  { id: 'BTN', label: 'Button' },
  { id: 'SB', label: 'Small Blind' },
  { id: 'BB', label: 'Big Blind' },
]
const positionSets = {
  2: [{ id: 'BTN', label: 'Button / Small Blind' }, basePositions[5]],
  3: basePositions.slice(3),
  4: basePositions.slice(2),
  5: basePositions.slice(1),
  6: basePositions,
  7: [basePositions[0], { id: 'UTG+1', label: 'Under the Gun +1', rangeKey: 'UTG' }, ...basePositions.slice(1)],
  8: [basePositions[0], { id: 'UTG+1', label: 'Under the Gun +1', rangeKey: 'UTG' }, { id: 'MP', label: 'Middle Position', rangeKey: 'HJ' }, ...basePositions.slice(1)],
  9: [basePositions[0], { id: 'UTG+1', label: 'Under the Gun +1', rangeKey: 'UTG' }, { id: 'MP', label: 'Middle Position', rangeKey: 'HJ' }, { id: 'MP+1', label: 'Middle Position +1', rangeKey: 'HJ' }, ...basePositions.slice(1)],
}
const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']
const displayRanks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const suits = [
  { id: 's', symbol: '♠', name: 'espadas', color: 'dark' },
  { id: 'h', symbol: '♥', name: 'copas', color: 'red' },
  { id: 'd', symbol: '♦', name: 'ouros', color: 'blue' },
  { id: 'c', symbol: '♣', name: 'paus', color: 'green' },
]

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

const rankValue = Object.fromEntries(ranks.map((rank, index) => [rank, 14 - index]))
const rankNames = {
  14: 'Ás', 13: 'Rei', 12: 'Dama', 11: 'Valete', 10: 'Dez',
  9: 'Nove', 8: 'Oito', 7: 'Sete', 6: 'Seis', 5: 'Cinco', 4: 'Quatro', 3: 'Três', 2: 'Dois',
}
const handNames = ['Carta alta', 'Um par', 'Dois pares', 'Trinca', 'Sequência', 'Flush', 'Full house', 'Quadra', 'Straight flush']

function evaluateFive(cards) {
  const values = cards.map((card) => rankValue[card.rank]).sort((a, b) => b - a)
  const countsByValue = values.reduce((acc, value) => {
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})
  const counts = Object.entries(countsByValue)
    .map(([value, count]) => ({ value: Number(value), count }))
    .sort((a, b) => b.count - a.count || b.value - a.value)
  const flush = cards.every((card) => card.suit === cards[0].suit)
  const unique = [...new Set(values)]
  if (unique[0] === 14) unique.push(1)
  let straightHigh = 0
  for (let index = 0; index <= unique.length - 5; index += 1) {
    if (unique[index] - unique[index + 4] === 4) {
      straightHigh = unique[index]
      break
    }
  }
  if (flush && straightHigh) return [8, straightHigh]
  if (counts[0].count === 4) return [7, counts[0].value, counts[1].value]
  if (counts[0].count === 3 && counts[1].count === 2) return [6, counts[0].value, counts[1].value]
  if (flush) return [5, ...values]
  if (straightHigh) return [4, straightHigh]
  if (counts[0].count === 3) return [3, counts[0].value, ...counts.slice(1).map(({ value }) => value).sort((a, b) => b - a)]
  if (counts[0].count === 2 && counts[1].count === 2) {
    const pairs = [counts[0].value, counts[1].value].sort((a, b) => b - a)
    return [2, ...pairs, counts[2].value]
  }
  if (counts[0].count === 2) return [1, counts[0].value, ...counts.slice(1).map(({ value }) => value).sort((a, b) => b - a)]
  return [0, ...values]
}

function evaluateHand(cards) {
  let best = null
  for (let a = 0; a < cards.length - 4; a += 1) {
    for (let b = a + 1; b < cards.length - 3; b += 1) {
      for (let c = b + 1; c < cards.length - 2; c += 1) {
        for (let d = c + 1; d < cards.length - 1; d += 1) {
          for (let e = d + 1; e < cards.length; e += 1) {
            const score = evaluateFive([cards[a], cards[b], cards[c], cards[d], cards[e]])
            if (!best || compareScores(score, best) > 0) best = score
          }
        }
      }
    }
  }
  return best
}

function compareScores(a, b) {
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    if ((a[index] || 0) !== (b[index] || 0)) return (a[index] || 0) - (b[index] || 0)
  }
  return 0
}

function describeScore(score) {
  if (!score) return ''
  const category = score[0]
  if (category === 0) return `Carta alta, ${rankNames[score[1]]}`
  if (category === 1) return `Um par de ${rankNames[score[1]]}`
  if (category === 2) return `Dois pares, ${rankNames[score[1]]} e ${rankNames[score[2]]}`
  if (category === 3) return `Trinca de ${rankNames[score[1]]}`
  if (category === 4) return `Sequência até ${rankNames[score[1]]}`
  if (category === 5) return `Flush com ${rankNames[score[1]]}`
  if (category === 6) return `Full house, ${rankNames[score[1]]} com ${rankNames[score[2]]}`
  if (category === 7) return `Quadra de ${rankNames[score[1]]}`
  return `Straight flush até ${rankNames[score[1]]}`
}

function calculateHandInsights(hero, board) {
  if (hero.length !== 2 || board.length < 3) return null
  const knownCards = [...hero, ...board]
  const currentScore = evaluateHand(knownCards)
  const used = new Set(knownCards.map((card) => `${card.rank}${card.suit}`))
  const availableCards = ranks.flatMap((rank) => suits.map((suit) => ({ rank, suit: suit.id })))
    .filter((card) => !used.has(`${card.rank}${card.suit}`))

  if (board.length === 5) return { current: describeScore(currentScore), draws: [] }

  const improvements = new Map()
  availableCards.forEach((card) => {
    const nextScore = evaluateHand([...knownCards, card])
    if (nextScore[0] <= currentScore[0]) return
    const category = nextScore[0]
    if (!improvements.has(category)) improvements.set(category, [])
    improvements.get(category).push(card)
  })

  const draws = [...improvements.entries()]
    .sort(([first], [second]) => second - first)
    .map(([category, outs]) => ({
      name: handNames[category],
      cards: outs.map(cardLabel),
      outs: outs.length,
      probability: Math.round((outs.length / availableCards.length) * 1000) / 10,
    }))

  return { current: describeScore(currentScore), draws }
}

function seededRandom(seed) {
  let value = seed || 1
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 4294967296
  }
}

function calculateEquity(hero, board) {
  if (hero.length !== 2 || board.length < 3) return null
  const used = new Set([...hero, ...board].map((card) => `${card.rank}${card.suit}`))
  const deck = ranks.flatMap((rank) => suits.map((suit) => ({ rank, suit: suit.id })))
    .filter((card) => !used.has(`${card.rank}${card.suit}`))
  const seed = [...used].sort().join('').split('').reduce((total, char) => total + char.charCodeAt(0), 0)
  const random = seededRandom(seed)
  const simulations = 3000
  let wins = 0
  let ties = 0

  const scoreRound = (opponent, runout) => {
    const fullBoard = [...board, ...runout]
    const result = compareScores(evaluateHand([...hero, ...fullBoard]), evaluateHand([...opponent, ...fullBoard]))
    if (result > 0) wins += 1
    else if (result === 0) ties += 1
  }

  if (board.length === 5) {
    for (let first = 0; first < deck.length - 1; first += 1) {
      for (let second = first + 1; second < deck.length; second += 1) scoreRound([deck[first], deck[second]], [])
    }
  } else {
    for (let simulation = 0; simulation < simulations; simulation += 1) {
      const shuffled = [...deck]
      for (let index = 0; index < 2 + (5 - board.length); index += 1) {
        const target = index + Math.floor(random() * (shuffled.length - index))
        ;[shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]]
      }
      scoreRound(shuffled.slice(0, 2), shuffled.slice(2, 2 + (5 - board.length)))
    }
  }
  const total = board.length === 5 ? deck.length * (deck.length - 1) / 2 : simulations
  return Math.round(((wins + ties / 2) / total) * 1000) / 10
}

function cardLabel(card) {
  return `${card.rank}${suits.find((suit) => suit.id === card.suit)?.symbol}`
}

function App() {
  const [playerCount, setPlayerCount] = useState(6)
  const [position, setPosition] = useState('CO')
  const [cards, setCards] = useState([{ rank: 'A', suit: 's' }, { rank: 'K', suit: 's' }])
  const [board, setBoard] = useState([{ rank: 'Q', suit: 's' }, { rank: 'J', suit: 'd' }, { rank: '7', suit: 'h' }])
  const [selection, setSelection] = useState('hand')
  const positions = positionSets[playerCount]
  const currentPositionIndex = positions.findIndex((item) => item.id === position)
  const code = handCode(cards)
  const isRaise = useMemo(() => {
    if (!code) return null
    const current = positions.findIndex((item) => item.id === position)
    if (premium.has(code)) return true
    return positions.slice(0, current + 1).some((item) => rangeByPosition[item.rangeKey || item.id]?.has(code))
  }, [code, position, positions])
  const equity = useMemo(() => calculateEquity(cards, board), [cards, board])
  const handInsights = useMemo(() => calculateHandInsights(cards, board), [cards, board])
  const street = board.length >= 5 ? 'RIVER' : board.length === 4 ? 'TURN' : board.length >= 3 ? 'FLOP' : 'PRÉ-FLOP'

  const selectCard = (rank, suit) => {
    const card = { rank, suit }
    const inHand = cards.some((c) => c.rank === rank && c.suit === suit)
    const onBoard = board.some((c) => c.rank === rank && c.suit === suit)
    if (selection === 'hand') {
      if (inHand) setCards(cards.filter((c) => c.rank !== rank || c.suit !== suit))
      else if (!onBoard && cards.length < 2) setCards([...cards, card])
      else if (!onBoard) setCards([cards[1], card])
    } else if (onBoard) setBoard(board.filter((c) => c.rank !== rank || c.suit !== suit))
    else if (!inHand && board.length < 5) setBoard([...board, card])
  }

  const nextRound = () => {
    setPosition(positions[(currentPositionIndex + 1) % positions.length].id)
    setCards([])
    setBoard([])
    setSelection('hand')
  }

  const changePlayerCount = (event) => {
    const count = Number(event.target.value)
    const availablePositions = positionSets[count]
    setPlayerCount(count)
    if (!availablePositions.some((item) => item.id === position)) setPosition(availablePositions[0].id)
  }

  return <div className="app-shell">
    <header>
      <a className="brand" href="#top"><span className="brand-mark"><Spade size={19} fill="currentColor" /></span><span>MESA <b>CERTA</b></span></a>
      <div className="header-tag"><span>●</span> GUIA DE JOGO · {playerCount === 6 ? '6-MAX' : `${playerCount} JOGADORES`}</div>
      <button className="icon-button" aria-label="Informações"><Info size={19}/></button>
    </header>

    <main id="top">
      <section className="hero-copy">
        <div className="eyebrow"><span></span> DECISÕES MAIS RÁPIDAS. JOGO MAIS SÓLIDO.</div>
        <h1>Sua jogada,<br/><em>na posição certa.</em></h1>
        <p>Escolha suas cartas, monte o board e acompanhe<br className="desktop"/> sua orientação e equidade em cada etapa da mão.</p>
      </section>

      <section className="workspace">
        <aside className="position-panel">
          <div className="step-title"><span>01</span><div><small>SUA POSIÇÃO</small><strong>Onde você está?</strong></div></div>
          <label className="player-count">
            <span><Users size={14}/> JOGADORES NA MESA</span>
            <div><select value={playerCount} onChange={changePlayerCount} aria-label="Quantidade de jogadores na mesa">
              {Object.keys(positionSets).map((count) => <option value={count} key={count}>{count} jogadores</option>)}
            </select><ChevronDown size={15}/></div>
          </label>
          <div className="positions">
            {positions.map((p) => <button key={p.id} onClick={() => setPosition(p.id)} className={position === p.id ? 'active' : ''}>
              <span className="position-code">{p.id}</span><span>{p.label}</span>{position === p.id && <Check size={16}/>} 
            </button>)}
          </div>
          <div className="tip"><Info size={15}/><p>Sua posição avança automaticamente a cada nova rodada.</p></div>
        </aside>

        <div className="hand-panel">
          <div className="step-title"><span>02</span><div><small>CARTAS DA JOGADA</small><strong>Monte sua mão e a mesa</strong></div><button onClick={() => selection === 'hand' ? setCards([]) : setBoard([])} className="clear"><RotateCcw size={13}/> LIMPAR</button></div>
          <div className="card-targets" role="tablist" aria-label="Cartas a selecionar">
            <button role="tab" aria-selected={selection === 'hand'} className={selection === 'hand' ? 'active' : ''} onClick={() => setSelection('hand')}><small>SUA MÃO</small><span>{cards.length ? cards.map(cardLabel).join('  ') : 'Escolha 2 cartas'}</span></button>
            <button role="tab" aria-selected={selection === 'board'} className={selection === 'board' ? 'active' : ''} onClick={() => setSelection('board')}><small>MESA · {street}</small><span>{board.length ? board.map(cardLabel).join('  ') : 'Adicione o flop'}</span></button>
          </div>
          <div className="card-grid" aria-label="Seletor de cartas">
            {suits.map((suit) => <div className="suit-row" key={suit.id}>
              {displayRanks.map((rank) => {
                const inHand = cards.some((c) => c.rank === rank && c.suit === suit.id)
                const onBoard = board.some((c) => c.rank === rank && c.suit === suit.id)
                const selected = selection === 'hand' ? inHand : onBoard
                const unavailable = selection === 'hand' ? onBoard : inHand
                const full = selection === 'hand' ? cards.length >= 2 : board.length >= 5
                return <button aria-label={`${rank} de ${suit.name}`} aria-pressed={selected} disabled={unavailable || (!selected && full)} onClick={() => selectCard(rank, suit.id)} key={suit.id} className={`playing-card ${suit.color} ${selected ? 'selected' : ''} ${unavailable ? 'unavailable' : ''}`}>
                  <b>{rank}</b><span>{suit.symbol}</span>
                </button>
              })}
            </div>)}
          </div>
        </div>

        <aside className="result-panel">
          <div className="step-title light"><span>03</span><div><small>ORIENTAÇÃO</small><strong>Sua melhor ação</strong></div></div>
          <div className="context"><span>POSIÇÃO <b>{position}</b></span><i></i><span>MÃO <b>{code || '—'}</b></span></div>
          {equity !== null && <div className="equity-card">
            <div className="equity-heading"><span><TrendingUp size={14}/> PROBABILIDADE NO {street}</span><strong>{equity}%</strong></div>
            <div className="equity-track"><i style={{ width: `${equity}%` }}></i></div>
            <p>Equidade estimada contra <b>1 mão aleatória</b></p>
            {handInsights && <div className="hand-insights">
              <div className="made-hand"><small>JOGO ATUAL</small><strong>{handInsights.current}</strong></div>
              {board.length < 5 && <div className="draws">
                <small>O QUE A PRÓXIMA CARTA PODE FORMAR</small>
                {handInsights.draws.length ? handInsights.draws.map((draw) => <div className="draw-row" key={draw.name}>
                  <div><strong>{draw.name}</strong><span>{draw.outs} {draw.outs === 1 ? 'carta' : 'cartas'} · {draw.probability}%</span></div>
                  <p>{draw.cards.join('  ')}</p>
                </div>) : <p className="no-draw">Nenhuma carta melhora a categoria da sua mão agora.</p>}
              </div>}
            </div>}
          </div>}
          <div className={`action ${isRaise === false ? 'fold' : ''}`}>
            <small>AÇÃO RECOMENDADA</small>
            <strong>{isRaise === null ? 'ESCOLHA 2 CARTAS' : isRaise ? 'RAISE' : 'FOLD'}</strong>
            {isRaise !== null && <div className="size"><span>↗</span><p>{isRaise ? <>Abra com <b>2.5 BB</b></> : <>Espere uma situação melhor</>}</p></div>}
          </div>
          <div className="reason"><small>POR QUÊ?</small><p>{isRaise === null ? 'Selecione duas cartas para visualizar a recomendação.' : isRaise ? <><b>{code}</b> está dentro do range recomendado para abrir de <b>{position}</b>.</> : <><b>{code}</b> está fora do range recomendado para abrir de <b>{position}</b>.</>}</p></div>
          <button className="next" onClick={nextRound}><span>PRÓXIMA RODADA<small>Você estará em {positions[(currentPositionIndex + 1) % positions.length].id}</small></span><ChevronRight/></button>
          <p className="disclaimer">Orientação baseada em estratégia GTO simplificada.<br/>Adapte ao perfil da sua mesa.</p>
        </aside>
      </section>
    </main>
    <footer><span>© 2026 MESA CERTA</span><p><i></i> JOGUE COM RESPONSABILIDADE</p><a href="#top">COMO FUNCIONA <ArrowRight size={13}/></a></footer>
  </div>
}

createRoot(document.getElementById('root')).render(<App />)
