const API_URL = 'https://script.google.com/macros/s/AKfycbzgdOU1isjQmVv_L1cFGe95yBicYlWJbxA_wN3-SyMEne7qdHyuFtm4cjzUUqd2DDsKhg/exec';

// 設定今天日期為預設值
document.getElementById('date').valueAsDate = new Date();

// 讀取所有資料並顯示
function loadTransactions() {
  return new Promise((resolve) => {
    const callbackName = 'callback_' + Date.now();
    const script = document.createElement('script');
    script.src = API_URL + '?callback=' + callbackName;
    window[callbackName] = function(data) {
      delete window[callbackName];
      document.body.removeChild(script);
      renderList(data);
      renderSummary(data);
      resolve(data);
    };
    script.onerror = function() {
      document.getElementById('tx-list').innerText = '讀取失敗，請檢查設定';
      resolve([]);
    };
    document.body.appendChild(script);
  });
}

// 新增一筆資料
async function addTransaction() {
  const type = document.getElementById('type').value;
  const amount = parseFloat(document.getElementById('amount').value);
  const date = document.getElementById('date').value;
  const note = document.getElementById('note').value;

  if (!amount || !date) {
    alert('請填寫金額和日期！');
    return;
  }

  const btn = document.querySelector('button');
  btn.innerText = '新增中...';
  btn.disabled = true;

  try {
    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ type, amount, date, note }),
    });
    document.getElementById('amount').value = '';
    document.getElementById('note').value = '';
    await loadTransactions();
  } catch (err) {
    alert('新增失敗，請再試一次');
  }

  btn.innerText = '新增';
  btn.disabled = false;
}

// 顯示交易列表
function renderList(data) {
  const list = document.getElementById('tx-list');
  if (data.length === 0) {
    list.innerHTML = '<p style="color:#aaa;text-align:center">還沒有任何紀錄</p>';
    return;
  }
  // 最新的排在前面
  const sorted = [...data].reverse();
  list.innerHTML = sorted.map(tx => `
    <div class="tx-item">
      <div>
        <div style="font-weight:bold">${tx.note || '（無備註）'}</div>
        <div style="font-size:13px;color:#aaa">${tx.date}</div>
      </div>
      <div style="font-weight:bold;color:${tx.type === '收入' ? '#2ecc71' : '#e74c3c'}">
        ${tx.type === '收入' ? '+' : '-'}$${Number(tx.amount).toLocaleString()}
      </div>
    </div>
  `).join('');
}

// 顯示收支總覽
function renderSummary(data) {
  const income = data.filter(t => t.type === '收入').reduce((s, t) => s + Number(t.amount), 0);
  const expense = data.filter(t => t.type === '支出').reduce((s, t) => s + Number(t.amount), 0);
  document.getElementById('total-income').innerText = '$' + income.toLocaleString();
  document.getElementById('total-expense').innerText = '$' + expense.toLocaleString();
  document.getElementById('balance').innerText = '$' + (income - expense).toLocaleString();
}

// 頁面載入時自動讀取資料
loadTransactions();