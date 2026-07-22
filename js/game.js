document.addEventListener('DOMContentLoaded', () => {
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const rankValues = { 'A': 1, 'J': 11, 'Q': 12, 'K': 13 };
    for (let i = 2; i <= 10; i++) rankValues[i.toString()] = i;

    let deck = [], piles = Array.from({ length: 10 }, () => []);
    let dragData = null, history = [], initialGameState = null;
    let currentDifficulty = 1, score = 500, moves = 0;

    const [tableauEl, dragLayer, deckArea, foundationArea, undoBtn] = 
        ['tableau', 'drag-layer', 'deck-area', 'foundation', 'undo-btn'].map(id => document.getElementById(id));
    
    const [modalLayer, pauseContent, winContent] = 
        ['modal-layer', 'pause-content', 'win-content'].map(id => document.getElementById(id));

    document.getElementById('start-btn').addEventListener('click', () => {
        const diffInput = document.querySelector('input[name="diff"]:checked');
        if (diffInput) currentDifficulty = parseInt(diffInput.value);

        document.getElementById('error-screen').classList.add('hidden');
        setTimeout(() => {
            document.getElementById('game-screen').classList.remove('hidden');
            startGame();
        }, 400);
    });

    const startGame = () => {
        history = []; undoBtn.disabled = true;
        score = 500; moves = 0;
        foundationArea.innerHTML = '';
        clearConfetti();

        const suits = currentDifficulty === 4 ? ['♠', '♥', '♣', '♦'] : currentDifficulty === 2 ? ['♠', '♥'] : ['♠'];

        deck = Array.from({ length: 104 }, (_, i) => {
            const suit = suits[Math.floor(i / 13) % suits.length];
            const rank = ranks[i % 13];
            return { rank, suit, color: (suit === '♥' || suit === '♦') ? 'red' : 'black', value: rankValues[rank], isFaceUp: false };
        }).sort(() => Math.random() - 0.5);

        piles = Array.from({ length: 10 }, () => []);
        for (let i = 0; i < 54; i++) piles[i % 10].push(deck.pop());
        piles.forEach(p => p.length && (p[p.length - 1].isFaceUp = true));
        
        initialGameState = { piles: clone(piles), deck: clone(deck) };
        saveState(); renderBoard(); renderDeck();
    };

    const clone = obj => JSON.parse(JSON.stringify(obj));

    const saveState = () => {
        history.push({ piles: clone(piles), deck: clone(deck), score, moves, foundationHTML: foundationArea.innerHTML });
        if (history.length > 1) undoBtn.disabled = false;
    };

        undoBtn.addEventListener('click', () => {
        if (history.length <= 1) return;
        history.pop();
        const state = history[history.length - 1];
          
        piles = clone(state.piles);
        deck = clone(state.deck);
        score = state.score;
        moves = state.moves;
        
        foundationArea.innerHTML = state.foundationHTML;
        undoBtn.disabled = history.length === 1;
        renderBoard(); renderDeck();
    });

    const renderBoard = () => {
        tableauEl.innerHTML = '';
        piles.forEach((pile, pIndex) => {
            const pileEl = document.createElement('div');
            pileEl.className = 'pile';
            pileEl.dataset.pile = pIndex;
            pile.forEach((card, cIndex) => {
                const cardEl = createCardElement(card);
                Object.assign(cardEl.dataset, { pile: pIndex, index: cIndex });
                cardEl.style.top = `${cIndex * 3.5}vh`;
                pileEl.appendChild(cardEl);
            });
            tableauEl.appendChild(pileEl);
        });
        document.getElementById('score').innerText = score;
        document.getElementById('moves').innerText = moves;
    };

    const createCardElement = ({ isFaceUp, rank, suit, color }) => {
        const el = document.createElement('div');
        el.className = `card ${isFaceUp ? color : 'card-back'}`;
        if (isFaceUp) el.innerHTML = `<span>${rank}${suit}</span><span style="align-self:flex-end; transform:rotate(180deg)">${rank}${suit}</span>`;
        return el;
    };

    const renderDeck = () => {
        deckArea.innerHTML = '';
        for (let i = 0; i < deck.length / 10; i++) {
            const el = document.createElement('div');
            el.className = 'deck-stack';
            el.addEventListener('click', dealRow);
            deckArea.appendChild(el);
        }
    };

    const dealRow = () => {
        if (deck.length < 10) return;
        if (piles.some(p => !p.length)) return alert("Нельзя сдать карты, пока есть пустые стопки.");
        saveState();
        for (let i = 0; i < 10; i++) piles[i].push({ ...deck.pop(), isFaceUp: true });
        moves++; renderBoard(); renderDeck(); checkForWins();
    };

    document.addEventListener('pointerdown', e => {
        if (e.target.closest('.top-bar, .bottom-bar') || !modalLayer.classList.contains('hidden')) return;
        const cardEl = e.target.closest('.card:not(.card-back)');
        if (!cardEl) return;

        const pIndex = +cardEl.dataset.pile, cIndex = +cardEl.dataset.index;
        if (!isValidSequence(piles[pIndex], cIndex)) return;

        const rect = cardEl.getBoundingClientRect();
        dragData = { sourcePile: pIndex, cards: piles[pIndex].splice(cIndex), offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top, els: [] };

        dragData.cards.forEach((card, i) => {
            const el = createCardElement(card);
            el.className = 'card dragging';
            Object.assign(el.style, { left: `${e.clientX - dragData.offsetX}px`, top: `${e.clientY - dragData.offsetY + i * window.innerHeight * 0.035}px`, width: `${rect.width}px`, height: `${rect.height}px` });
            dragLayer.appendChild(el);
            dragData.els.push(el);
        });
        renderBoard();
    });

    document.addEventListener('pointermove', e => {
        if (!dragData) return;
        dragData.els.forEach((el, i) => {
            el.style.left = `${e.clientX - dragData.offsetX}px`;
            el.style.top = `${e.clientY - dragData.offsetY + i * window.innerHeight * 0.035}px`;
        });
    });

    document.addEventListener('pointerup', e => {
        if (!dragData) return;
        const targetPileEl = document.elementFromPoint(e.clientX, e.clientY)?.closest('.pile');
        let validDrop = false;

        if (targetPileEl) {
            const targetPileIndex = +targetPileEl.dataset.pile, targetPile = piles[targetPileIndex];
            if (!targetPile.length || targetPile[targetPile.length - 1].value === dragData.cards[0].value + 1) {
                piles[dragData.sourcePile].push(...dragData.cards);
                saveState();
                piles[dragData.sourcePile].length -= dragData.cards.length;
                piles[targetPileIndex].push(...dragData.cards);
                validDrop = true; moves++; score--;
                if (piles[dragData.sourcePile].length) piles[dragData.sourcePile][piles[dragData.sourcePile].length - 1].isFaceUp = true;
            }
        }

        if (!validDrop) piles[dragData.sourcePile].push(...dragData.cards);
        dragLayer.innerHTML = ''; dragData = null;
        if (validDrop) checkForWins();
        renderBoard();
    });

    const isValidSequence = (pile, start) => pile.slice(start, -1).every((c, i) => c.value === pile[start + i + 1].value + 1 && c.suit === pile[start + i + 1].suit);

    const checkForWins = () => {
        let winFound = false;
        piles.forEach(pile => {
            if (pile.length < 13) return;
            const targetSuit = pile[pile.length - 1].suit;
            const seq = pile.slice(-13);
            if (seq.every((c, i) => c.isFaceUp && c.suit === targetSuit && c.value === 13 - i)) {
                if (!winFound) saveState();
                winFound = true;
                pile.length -= 13; score += 100;
                const winCard = document.createElement('div');
                winCard.className = `win-stack ${['♥', '♦'].includes(targetSuit) ? 'red' : 'black'}`;
                winCard.innerHTML = `K<br>${targetSuit}`;
                foundationArea.appendChild(winCard);
                if (pile.length) pile[pile.length - 1].isFaceUp = true;
            }
        });
        if (winFound) {
            renderBoard();
            if (foundationArea.children.length === 8) triggerWinCelebration();
        }
    };

    const showModal = el => { modalLayer.classList.remove('hidden'); [pauseContent, winContent].forEach(c => c.classList.add('hidden')); el.classList.remove('hidden'); };
    const hideModal = () => modalLayer.classList.add('hidden');
    const clearConfetti = () => document.querySelectorAll('.confetti').forEach(el => el.remove());

    const restartCurrentGame = () => {
        if (!initialGameState) return;
        piles = clone(initialGameState.piles); deck = clone(initialGameState.deck);
        score = 500; moves = 0; history = []; foundationArea.innerHTML = '';
        clearConfetti(); saveState(); renderBoard(); renderDeck(); hideModal();
    };

    const triggerWinCelebration = () => {
        const colors = ['#d00', '#000', '#007a33', '#ffd700', '#fff'];
        for (let i = 0; i < 120; i++) {
            const conf = document.createElement('div');
            conf.className = 'confetti';
            Object.assign(conf.style, { left: `${Math.random() * 100}vw`, animationDuration: `${Math.random() * 2 + 2}s`, animationDelay: `${Math.random() * 1.5}s`, backgroundColor: colors[Math.floor(Math.random() * colors.length)] });
            document.body.appendChild(conf);
        }
        setTimeout(() => showModal(winContent), 2000);
    };

    const goBackToMenu = () => { hideModal(); clearConfetti(); document.getElementById('game-screen').classList.add('hidden'); document.getElementById('error-screen').classList.remove('hidden'); };

    ['resume-btn'].forEach(id => document.getElementById(id).addEventListener('click', hideModal));
    document.getElementById('menu-btn').addEventListener('click', () => showModal(pauseContent));
    ['restart-btn', 'win-restart-btn'].forEach(id => document.getElementById(id).addEventListener('click', restartCurrentGame));
    ['new-game-btn', 'win-new-btn'].forEach(id => document.getElementById(id).addEventListener('click', goBackToMenu));
});
