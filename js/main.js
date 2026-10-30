/**
 * Modern Feature-Rich Calculator
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const displayCurrent = document.getElementById('currentValue');
  const displayPrev = document.getElementById('previousExpression');
  const displayArea = document.getElementById('displayArea');
  const copyFeedback = document.getElementById('copyFeedback');
  const historyToggle = document.getElementById('historyToggle');
  const historyPanel = document.getElementById('historyPanel');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const themeToggle = document.getElementById('themeToggle');

  // Calculator State
  let currentExpression = '0';
  let previousExpression = '';
  let isResultDisplayed = false;
  let history = JSON.parse(localStorage.getItem('calc_history') || '[]');

  // Initialize Theme
  const savedTheme = localStorage.getItem('calc_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Render initial history
  renderHistory();

  // ---------------------------------------------------------------------------
  // Theme Toggle
  // ---------------------------------------------------------------------------
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('calc_theme', newTheme);
  });

  // ---------------------------------------------------------------------------
  // History Drawer Toggle
  // ---------------------------------------------------------------------------
  historyToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = historyPanel.classList.toggle('is-open');
    historyPanel.setAttribute('aria-hidden', (!isOpen).toString());
  });

  // Close history drawer when clicking outside
  document.addEventListener('click', (e) => {
    if (!historyPanel.contains(e.target) && !historyToggle.contains(e.target)) {
      historyPanel.classList.remove('is-open');
      historyPanel.setAttribute('aria-hidden', 'true');
    }
  });

  clearHistoryBtn.addEventListener('click', () => {
    history = [];
    localStorage.removeItem('calc_history');
    renderHistory();
  });

  function renderHistory() {
    if (history.length === 0) {
      historyList.innerHTML = '<p class="history-empty">No calculations yet</p>';
      return;
    }

    historyList.innerHTML = '';
    history.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `
        <span class="history-item-exp">${escapeHtml(item.expression)} =</span>
        <span class="history-item-res">${escapeHtml(item.result)}</span>
      `;
      div.addEventListener('click', () => {
        currentExpression = item.result;
        previousExpression = `${item.expression} =`;
        isResultDisplayed = true;
        updateDisplay();
        historyPanel.classList.remove('is-open');
      });
      historyList.appendChild(div);
    });
  }

  function addHistoryItem(exp, res) {
    history.unshift({ expression: exp, result: res });
    if (history.length > 25) history.pop();
    localStorage.setItem('calc_history', JSON.stringify(history));
    renderHistory();
  }

  // ---------------------------------------------------------------------------
  // Copy to Clipboard
  // ---------------------------------------------------------------------------
  displayArea.addEventListener('click', async () => {
    if (!currentExpression || currentExpression === 'Error' || currentExpression === 'Cannot divide by zero') return;
    try {
      await navigator.clipboard.writeText(currentExpression);
      copyFeedback.classList.add('show');
      setTimeout(() => copyFeedback.classList.remove('show'), 1500);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = currentExpression;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      copyFeedback.classList.add('show');
      setTimeout(() => copyFeedback.classList.remove('show'), 1500);
    }
  });

  // ---------------------------------------------------------------------------
  // Display Update with Font Scaling
  // ---------------------------------------------------------------------------
  function updateDisplay() {
    displayCurrent.textContent = formatForDisplay(currentExpression);
    displayPrev.textContent = previousExpression;

    // Dynamically adjust font size if text is long
    const length = displayCurrent.textContent.length;
    if (length > 15) {
      displayCurrent.style.fontSize = '1.35rem';
    } else if (length > 10) {
      displayCurrent.style.fontSize = '1.75rem';
    } else {
      displayCurrent.style.fontSize = '2.35rem';
    }
  }

  function formatForDisplay(val) {
    if (!val) return '0';
    return val;
  }

  // ---------------------------------------------------------------------------
  // Input Handling
  // ---------------------------------------------------------------------------
  function appendNumber(num) {
    if (isResultDisplayed || currentExpression === '0' || currentExpression === 'Error' || currentExpression === 'Cannot divide by zero') {
      currentExpression = num;
      isResultDisplayed = false;
    } else {
      currentExpression += num;
    }
    updateDisplay();
  }

  function appendDecimal() {
    if (isResultDisplayed || currentExpression === 'Error' || currentExpression === 'Cannot divide by zero') {
      currentExpression = '0.';
      isResultDisplayed = false;
      updateDisplay();
      return;
    }

    // Find the current number token (after the last operator)
    const tokens = currentExpression.split(/[\+\−\×\÷\^]/);
    const lastToken = tokens[tokens.length - 1];

    if (!lastToken.includes('.')) {
      currentExpression += '.';
    }
    updateDisplay();
  }

  function appendOperator(op) {
    if (currentExpression === 'Error' || currentExpression === 'Cannot divide by zero') {
      currentExpression = '0';
    }

    isResultDisplayed = false;

    const lastChar = currentExpression.slice(-1);
    const operators = ['+', '−', '×', '÷', '^'];

    if (operators.includes(lastChar)) {
      // Replace last operator
      currentExpression = currentExpression.slice(0, -1) + op;
    } else {
      currentExpression += op;
    }
    updateDisplay();
  }

  function appendParenthesis(paren) {
    if (currentExpression === '0' || isResultDisplayed || currentExpression === 'Error' || currentExpression === 'Cannot divide by zero') {
      if (paren === '(') {
        currentExpression = '(';
      } else {
        return;
      }
      isResultDisplayed = false;
    } else {
      currentExpression += paren;
    }
    updateDisplay();
  }

  function handleBackspace() {
    if (isResultDisplayed || currentExpression === 'Error' || currentExpression === 'Cannot divide by zero') {
      currentExpression = '0';
      isResultDisplayed = false;
    } else if (currentExpression.length > 1) {
      currentExpression = currentExpression.slice(0, -1);
    } else {
      currentExpression = '0';
    }
    updateDisplay();
  }

  function handleClear() {
    currentExpression = '0';
    previousExpression = '';
    isResultDisplayed = false;
    updateDisplay();
  }

  function handleNegate() {
    if (currentExpression === '0' || currentExpression === 'Error' || currentExpression === 'Cannot divide by zero') return;

    // Check if whole expression can be negated or last number
    try {
      const val = parseFloat(currentExpression);
      if (!isNaN(val) && val.toString() === currentExpression) {
        currentExpression = (-val).toString();
      } else {
        // Toggle negation with parens: -(expression)
        if (currentExpression.startsWith('-(') && currentExpression.endsWith(')')) {
          currentExpression = currentExpression.slice(2, -1);
        } else {
          currentExpression = `-(${currentExpression})`;
        }
      }
    } catch {
      // ignore
    }
    updateDisplay();
  }

  function handlePercent() {
    try {
      const result = evaluateExpression(currentExpression);
      if (result === 'Cannot divide by zero' || result === 'Error') {
        currentExpression = result;
      } else {
        const pct = cleanFloat(parseFloat(result) / 100);
        previousExpression = `${currentExpression} %`;
        currentExpression = pct.toString();
        isResultDisplayed = true;
      }
    } catch {
      currentExpression = 'Error';
    }
    updateDisplay();
  }

  function handleSquare() {
    try {
      const result = evaluateExpression(currentExpression);
      if (result === 'Cannot divide by zero' || result === 'Error') {
        currentExpression = result;
      } else {
        const num = parseFloat(result);
        const sq = cleanFloat(num * num);
        previousExpression = `sqr(${num})`;
        currentExpression = sq.toString();
        isResultDisplayed = true;
        addHistoryItem(previousExpression, currentExpression);
      }
    } catch {
      currentExpression = 'Error';
    }
    updateDisplay();
  }

  function handleSquareRoot() {
    try {
      const result = evaluateExpression(currentExpression);
      if (result === 'Cannot divide by zero' || result === 'Error') {
        currentExpression = result;
      } else {
        const num = parseFloat(result);
        if (num < 0) {
          currentExpression = 'Error';
        } else {
          const sqrt = cleanFloat(Math.sqrt(num));
          previousExpression = `√(${num})`;
          currentExpression = sqrt.toString();
          isResultDisplayed = true;
          addHistoryItem(previousExpression, currentExpression);
        }
      }
    } catch {
      currentExpression = 'Error';
    }
    updateDisplay();
  }

  function handleEquals() {
    if (currentExpression === 'Error' || currentExpression === 'Cannot divide by zero') return;

    const originalExpression = currentExpression;
    const result = evaluateExpression(currentExpression);

    previousExpression = `${originalExpression} =`;
    currentExpression = result.toString();
    isResultDisplayed = true;

    if (result !== 'Error' && result !== 'Cannot divide by zero') {
      addHistoryItem(originalExpression, currentExpression);
    }
    updateDisplay();
  }

  // ---------------------------------------------------------------------------
  // Safe Expression Evaluator (Shunting-Yard + RPN or Token Parser)
  // ---------------------------------------------------------------------------
  function evaluateExpression(expr) {
    if (!expr || expr.trim() === '') return '0';

    // Normalize characters
    let sanitized = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/\s+/g, '');

    // Check for trailing operator
    if (/[+\-*/^]$/.test(sanitized)) {
      sanitized = sanitized.slice(0, -1);
    }

    try {
      const tokens = tokenize(sanitized);
      if (!tokens || tokens.length === 0) return '0';
      const rpn = shuntingYard(tokens);
      const res = evaluateRPN(rpn);
      if (res === 'Cannot divide by zero') return res;
      return cleanFloat(res).toString();
    } catch (e) {
      return 'Error';
    }
  }

  function tokenize(str) {
    const tokens = [];
    let i = 0;

    while (i < str.length) {
      const char = str[i];

      if (char === ' ') {
        i++;
        continue;
      }

      // Check numbers (including decimals)
      if (/\d/.test(char) || char === '.') {
        let numStr = '';
        while (i < str.length && (/[\d.]/.test(str[i]))) {
          numStr += str[i];
          i++;
        }
        tokens.push({ type: 'number', value: parseFloat(numStr) });
        continue;
      }

      // Unary minus vs binary minus
      if (char === '-') {
        const prev = tokens[tokens.length - 1];
        if (!prev || (prev.type !== 'number' && prev.type !== 'paren_close')) {
          // Unary minus: represented as negation operator ~
          tokens.push({ type: 'unary_minus', value: '~' });
          i++;
          continue;
        }
      }

      if (char === '+') {
        const prev = tokens[tokens.length - 1];
        if (!prev || (prev.type !== 'number' && prev.type !== 'paren_close')) {
          // Unary plus - ignore
          i++;
          continue;
        }
        tokens.push({ type: 'operator', value: '+' });
        i++;
        continue;
      }

      if (['-', '*', '/', '^', '%'].includes(char)) {
        tokens.push({ type: 'operator', value: char });
        i++;
        continue;
      }

      if (char === '(') {
        tokens.push({ type: 'paren_open', value: '(' });
        i++;
        continue;
      }

      if (char === ')') {
        tokens.push({ type: 'paren_close', value: ')' });
        i++;
        continue;
      }

      throw new Error(`Unexpected token: ${char}`);
    }

    return tokens;
  }

  function shuntingYard(tokens) {
    const outputQueue = [];
    const operatorStack = [];

    const precedence = {
      '+': 1,
      '-': 1,
      '*': 2,
      '/': 2,
      '%': 2,
      '^': 3,
      '~': 4 // unary minus
    };

    const rightAssociative = {
      '^': true,
      '~': true
    };

    for (const token of tokens) {
      if (token.type === 'number') {
        outputQueue.push(token);
      } else if (token.type === 'operator' || token.type === 'unary_minus') {
        const o1 = token.value;
        while (operatorStack.length > 0) {
          const top = operatorStack[operatorStack.length - 1];
          if (top.type === 'paren_open') break;

          const o2 = top.value;
          const p1 = precedence[o1] || 0;
          const p2 = precedence[o2] || 0;

          if (p2 > p1 || (p2 === p1 && !rightAssociative[o1])) {
            outputQueue.push(operatorStack.pop());
          } else {
            break;
          }
        }
        operatorStack.push(token);
      } else if (token.type === 'paren_open') {
        operatorStack.push(token);
      } else if (token.type === 'paren_close') {
        let foundOpen = false;
        while (operatorStack.length > 0) {
          const top = operatorStack.pop();
          if (top.type === 'paren_open') {
            foundOpen = true;
            break;
          }
          outputQueue.push(top);
        }
        if (!foundOpen) throw new Error('Mismatched parentheses');
      }
    }

    while (operatorStack.length > 0) {
      const top = operatorStack.pop();
      if (top.type === 'paren_open' || top.type === 'paren_close') {
        throw new Error('Mismatched parentheses');
      }
      outputQueue.push(top);
    }

    return outputQueue;
  }

  function evaluateRPN(rpnQueue) {
    const stack = [];

    for (const token of rpnQueue) {
      if (token.type === 'number') {
        stack.push(token.value);
      } else if (token.type === 'unary_minus') {
        if (stack.length < 1) throw new Error('Invalid expression');
        const val = stack.pop();
        stack.push(-val);
      } else if (token.type === 'operator') {
        if (stack.length < 2) throw new Error('Invalid expression');
        const b = stack.pop();
        const a = stack.pop();

        switch (token.value) {
          case '+':
            stack.push(a + b);
            break;
          case '-':
            stack.push(a - b);
            break;
          case '*':
            stack.push(a * b);
            break;
          case '/':
            if (b === 0) return 'Cannot divide by zero';
            stack.push(a / b);
            break;
          case '%':
            if (b === 0) return 'Cannot divide by zero';
            stack.push(a % b);
            break;
          case '^':
            stack.push(Math.pow(a, b));
            break;
          default:
            throw new Error(`Unknown operator: ${token.value}`);
        }
      }
    }

    if (stack.length !== 1) throw new Error('Invalid calculation');
    const finalVal = stack[0];
    if (isNaN(finalVal) || !isFinite(finalVal)) return 'Error';
    return finalVal;
  }

  function cleanFloat(num) {
    if (typeof num !== 'number') return num;
    // Fix precision issues e.g. 0.1 + 0.2 = 0.30000000000000004
    return parseFloat(num.toPrecision(12));
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ---------------------------------------------------------------------------
  // Button Click Events
  // ---------------------------------------------------------------------------
  document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const value = btn.dataset.value;

      if (!action && value !== undefined) {
        appendNumber(value);
      } else {
        switch (action) {
          case 'operator':
            appendOperator(value);
            break;
          case 'decimal':
            appendDecimal();
            break;
          case 'clear':
            handleClear();
            break;
          case 'backspace':
            handleBackspace();
            break;
          case 'equals':
            handleEquals();
            break;
          case 'negate':
            handleNegate();
            break;
          case 'percent':
            handlePercent();
            break;
          case 'square':
            handleSquare();
            break;
          case 'square-root':
            handleSquareRoot();
            break;
          case 'power':
            appendOperator('^');
            break;
          case 'parenthesis-open':
            appendParenthesis('(');
            break;
          case 'parenthesis-close':
            appendParenthesis(')');
            break;
        }
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Support
  // ---------------------------------------------------------------------------
  document.addEventListener('keydown', (e) => {
    // Prevent default scroll on Space or other keys if needed
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key;

    // Digits
    if (/^[0-9]$/.test(key)) {
      highlightButtonByValue(key);
      appendNumber(key);
      return;
    }

    // Decimal
    if (key === '.' || key === ',') {
      highlightButtonByAction('decimal');
      appendDecimal();
      return;
    }

    // Operators
    if (key === '+') {
      highlightButtonByValue('+');
      appendOperator('+');
      return;
    }
    if (key === '-') {
      highlightButtonByValue('−');
      appendOperator('−');
      return;
    }
    if (key === '*' || key.toLowerCase() === 'x') {
      highlightButtonByValue('×');
      appendOperator('×');
      return;
    }
    if (key === '/') {
      e.preventDefault();
      highlightButtonByValue('÷');
      appendOperator('÷');
      return;
    }
    if (key === '%') {
      highlightButtonByAction('percent');
      handlePercent();
      return;
    }
    if (key === '^') {
      highlightButtonByAction('power');
      appendOperator('^');
      return;
    }
    if (key === '(') {
      highlightButtonByAction('parenthesis-open');
      appendParenthesis('(');
      return;
    }
    if (key === ')') {
      highlightButtonByAction('parenthesis-close');
      appendParenthesis(')');
      return;
    }

    // Equals / Enter
    if (key === 'Enter' || key === '=') {
      e.preventDefault();
      highlightButtonByAction('equals');
      handleEquals();
      return;
    }

    // Backspace
    if (key === 'Backspace') {
      highlightButtonByAction('backspace');
      handleBackspace();
      return;
    }

    // Escape / Clear
    if (key === 'Escape' || key.toLowerCase() === 'c') {
      highlightButtonByAction('clear');
      handleClear();
      return;
    }

    // History Toggle shortcut (H)
    if (key.toLowerCase() === 'h') {
      historyToggle.click();
      return;
    }

    // Theme Toggle shortcut (T)
    if (key.toLowerCase() === 't') {
      themeToggle.click();
      return;
    }
  });

  function highlightButtonByValue(val) {
    const btn = document.querySelector(`.btn[data-value="${val}"]`);
    flashButton(btn);
  }

  function highlightButtonByAction(act) {
    const btn = document.querySelector(`.btn[data-action="${act}"]`);
    flashButton(btn);
  }

  function flashButton(btn) {
    if (!btn) return;
    btn.classList.add('is-active');
    setTimeout(() => {
      btn.classList.remove('is-active');
    }, 120);
  }
});

