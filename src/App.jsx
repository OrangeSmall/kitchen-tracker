import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ClipboardList, BarChart3, Plus, Save, Download, Trash2, Clock, User, CheckCircle2, AlertCircle, Utensils, Smartphone, Monitor, Image as ImageIcon, Store } from 'lucide-react';

// --- 初始資料定義 ---
const BASELINE_ITEMS = [
  { id: 'b1', category: '便當', name: '純雞', unit: '個' },
  { id: 'b2', category: '便當', name: '雞+魚', unit: '個' },
  { id: 'b3', category: '便當', name: '魚+魚', unit: '個' },
  { id: 'f1', category: '炸物', name: '白身魚', unit: '份' },
  { id: 'f2', category: '炸物', name: '竹筴魚', unit: '份' },
  { id: 'f3', category: '炸物', name: '牛肉餅', unit: '份' },
  { id: 'f4', category: '炸物', name: '炸蝦', unit: '份' },
  { id: 'f5', category: '炸物', name: '厚蝦排', unit: '份' },
  { id: 'f6', category: '炸物', name: '炸牡蠣', unit: '份' },
  { id: 'f7', category: '炸物', name: '蟹味棒', unit: '份' },
  { id: 'g1', category: '烤物', name: '魚肚', unit: '片' },
  { id: 'g2', category: '烤物', name: '魚頭', unit: '個' },
  { id: 'g3', category: '烤物', name: '鯖魚', unit: '片' },
  { id: 'g4', category: '烤物', name: '雞腿排', unit: '隻' },
  { id: 'g5', category: '烤物', name: '烘蛋', unit: '張' },
  { id: 'g6', category: '烤物', name: '母香魚', unit: '隻' },
  { id: 'g7', category: '烤物', name: '烏魚子棒棒', unit: '枝' },
  { id: 'g8', category: '烤物', name: '秋刀魚', unit: '盒' },
  { id: 'g9', category: '烤物', name: '焗烤龍蝦', unit: '盒' },
];

const CATEGORY_COLORS = {
  '便當': '#F59E0B', // Amber
  '炸物': '#EF4444', // Red
  '烤物': '#10B981', // Emerald
  '限定品': '#8B5CF6' // Purple
};

const CHART_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b'];

// --- 產生模擬歷史資料 ---
const generateMockHistory = () => {
  const history = [];
  const today = new Date();
  for (let i = 7; i > 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    const dayRecords = BASELINE_ITEMS.map(item => ({
      ...item,
      qty: Math.floor(Math.random() * 30) + 10, // 隨機產生 10~40 的產能
      time: '12:00'
    }));
    
    history.push({
      date: dateStr,
      store: '四維店',
      records: dayRecords
    });
  }
  return history;
};

export default function App() {
  // --- 狀態管理 ---
  const [activeTab, setActiveTab] = useState('record'); // 'record' 或 'analytics'
  const [recorderName, setRecorderName] = useState('');
  const [storeName, setStoreName] = useState('四維店'); 
  const [batchTime, setBatchTime] = useState('');
  
  // 資料狀態
  const [activeItems, setActiveItems] = useState(BASELINE_ITEMS);
  const [todayBatches, setTodayBatches] = useState([]);
  const [history, setHistory] = useState([]);
  
  // UI 狀態
  const [newItemModalOpen, setNewItemModalOpen] = useState(false);
  const [inputs, setInputs] = useState({}); // 紀錄各品項卡片上的輸入值
  const [newItemData, setNewItemData] = useState({ name: '', category: '限定品', unit: '份' });
  const [chartView, setChartView] = useState('total'); // 'total', '便當', '炸物', '烤物', '限定品'
  const [viewMode, setViewMode] = useState('mobile'); // 預設手機模式：'mobile' 或 'desktop'
  const [isExporting, setIsExporting] = useState(false);

  // 自訂對話框狀態
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });

  // --- 初始化設定 ---
  useEffect(() => {
    // 設定預設時間為現在
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setBatchTime(timeString);

    // 讀取 LocalStorage
    const savedHistory = localStorage.getItem('kitchen_history');
    const savedActiveItems = localStorage.getItem('kitchen_activeItems');
    const savedTodayBatches = localStorage.getItem('kitchen_todayBatches');
    const savedRecorder = localStorage.getItem('kitchen_recorder');
    const savedStore = localStorage.getItem('kitchen_storeName'); 

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    } else {
      // 若無歷史資料，載入模擬資料以供展示圖表
      const mockData = generateMockHistory();
      setHistory(mockData);
      localStorage.setItem('kitchen_history', JSON.stringify(mockData));
    }

    if (savedActiveItems) setActiveItems(JSON.parse(savedActiveItems));
    if (savedTodayBatches) setTodayBatches(JSON.parse(savedTodayBatches));
    if (savedRecorder) setRecorderName(savedRecorder);
    if (savedStore) setStoreName(savedStore);
  }, []);

  // --- 存檔至 LocalStorage ---
  useEffect(() => {
    localStorage.setItem('kitchen_activeItems', JSON.stringify(activeItems));
    localStorage.setItem('kitchen_todayBatches', JSON.stringify(todayBatches));
    localStorage.setItem('kitchen_recorder', recorderName);
    localStorage.setItem('kitchen_storeName', storeName);
  }, [activeItems, todayBatches, recorderName, storeName]);

  // --- 功能函數 ---

  // 處理單品項數量輸入
  const handleInputChange = (id, val) => {
    setInputs(prev => ({ ...prev, [id]: val }));
  };

  // 顯示自訂對話框
  const showAlert = (title, message) => setDialog({ isOpen: true, title, message, type: 'alert', onConfirm: null });
  const showConfirm = (title, message, onConfirm) => setDialog({ isOpen: true, title, message, type: 'confirm', onConfirm });

  // 批量新增出爐批次 (一鍵加入該時段)
  const handleBulkAddBatch = () => {
    if (!recorderName.trim()) {
      showAlert("提示", "請先填寫紀錄人員姓名！");
      return;
    }
    if (!batchTime) {
      showAlert("提示", "請設定出爐時間！");
      return;
    }

    const newBatches = [];
    let hasValidInput = false;

    Object.keys(inputs).forEach(id => {
      const qtyStr = inputs[id];
      const qty = parseInt(qtyStr, 10);
      
      if (qty && qty > 0) {
        hasValidInput = true;
        const item = activeItems.find(i => i.id === id);
        if (item) {
          newBatches.push({
            id: `${Date.now()}-${id}`, 
            itemId: item.id,
            name: item.name,
            category: item.category,
            unit: item.unit,
            time: batchTime,
            qty: qty,
            recorder: recorderName
          });
        }
      }
    });

    if (!hasValidInput) {
      showAlert("提示", "請至少在一個品項中輸入有效的數量！");
      return;
    }

    // 批量寫入狀態並放置最前
    setTodayBatches(prev => [...newBatches, ...prev]);
    // 清空所有輸入框
    setInputs({});
  };

  // 刪除批次
  const handleDeleteBatch = (batchId) => {
    showConfirm("刪除確認", "確定要刪除這筆紀錄嗎？", () => {
      setTodayBatches(prev => prev.filter(b => b.id !== batchId));
    });
  };

  // 新增限定品
  const handleAddNewItem = () => {
    if (!newItemData.name.trim()) return;
    
    const newItem = {
      id: `ltd-${Date.now()}`,
      category: newItemData.category,
      name: newItemData.name,
      unit: newItemData.unit,
      isLimited: true
    };
    
    setActiveItems(prev => [...prev, newItem]);
    setNewItemModalOpen(false);
    setNewItemData({ name: '', category: '限定品', unit: '份' });
  };

  // 每日結算存檔 (啟用 Google Sheets 聯動，傳送「時段明細」)
  const handleDailySettlement = () => {
    if (todayBatches.length === 0) {
      showAlert("提示", "今日尚無時段紀錄可結算！");
      return;
    }

    showConfirm("結算確認", `確定要為「${storeName}」執行當日結算嗎？\n結算後將保留各時段明細，並同步至雲端資料庫。`, async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      
      const recordsArray = todayBatches;

      const dailyRecord = {
        date: todayStr,
        store: storeName,
        records: recordsArray
      };

      // --- [聯動 Google Sheets] ---
      try {
        const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz6IwmqfbSP1m0Xhsw782RqHxk-BGykMZ9XXOGdHPs3FUMReuQ5lb5PSBUdY8qP6nRl/exec';
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            date: todayStr,
            store: storeName,
            recorder: recorderName,
            data: recordsArray
          })
        });
      } catch (error) {
        console.error('上傳 Google Sheets 失敗:', error);
      }
      // ----------------------------

      // 更新本地歷史資料
      const newHistory = history.filter(h => h.date !== todayStr);
      newHistory.push(dailyRecord);
      newHistory.sort((a, b) => new Date(a.date) - new Date(b.date));

      setHistory(newHistory);
      localStorage.setItem('kitchen_history', JSON.stringify(newHistory));

      // 重置狀態 (清空當日時段紀錄)
      setTodayBatches([]);
      setActiveItems(BASELINE_ITEMS); 
      showAlert("成功", "當日結算完成！資料已同步存入 Google Sheets。");
    });
  };

  // 匯出 CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
    csvContent += "日期,店別,出爐時間,類別,品項,數量,單位\n";

    history.forEach(day => {
      const dayStore = day.store || '未指定';
      day.records.forEach(rec => {
        const batchTime = rec.time || '加總紀錄'; 
        csvContent += `${day.date},${dayStore},${batchTime},${rec.category},${rec.name},${rec.qty},${rec.unit}\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `熟食產能紀錄_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 衍生資料 ---

  const groupedItems = useMemo(() => {
    const groups = {};
    activeItems.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [activeItems]);

  const todaySummary = useMemo(() => {
    const summary = {};
    todayBatches.forEach(batch => {
      if (!summary[batch.itemId]) summary[batch.itemId] = { ...batch, qty: 0 };
      summary[batch.itemId].qty += batch.qty;
    });
    return Object.values(summary);
  }, [todayBatches]);

  const groupedTodaySummary = useMemo(() => {
    const groups = {};
    todaySummary.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [todaySummary]);

  const groupedBatchesByTime = useMemo(() => {
    const groups = {};
    todayBatches.forEach(batch => {
      if (!groups[batch.time]) groups[batch.time] = [];
      groups[batch.time].push(batch);
    });
    return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(time => ({
      time,
      records: groups[time]
    }));
  }, [todayBatches]);

  const chartData = useMemo(() => {
    if (chartView === 'total') {
      return history.map(day => {
        const dataPoint = { date: day.date, '便當': 0, '炸物': 0, '烤物': 0, '限定品': 0 };
        day.records.forEach(rec => {
          if (dataPoint[rec.category] !== undefined) {
            dataPoint[rec.category] += rec.qty;
          } else {
             dataPoint['限定品'] += rec.qty;
          }
        });
        return dataPoint;
      });
    } else {
      return history.map(day => {
        const dataPoint = { date: day.date };
        day.records.forEach(rec => {
          if (rec.category === chartView || (chartView === '限定品' && rec.isLimited)) {
            dataPoint[rec.name] = (dataPoint[rec.name] || 0) + rec.qty;
          }
        });
        return dataPoint;
      });
    }
  }, [history, chartView]);

  const chartLines = useMemo(() => {
    if (chartData.length === 0) return [];
    return Object.keys(chartData[0]).filter(k => k !== 'date');
  }, [chartData]);


  // 匯出 PNG (總結)
  const handleExportPNG = async () => {
    if (todayBatches.length === 0) {
      showAlert("提示", "今日尚無紀錄可出圖！");
      return;
    }
    
    showConfirm("出圖確認", "確定要產生並下載今日的「產能總計報表」嗎？", async () => {
      setIsExporting(true);
      try {
        if (!window.html2canvas) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }
        
        const element = document.getElementById('daily-report-template');
        const canvas = await window.html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `熟食產能總計_${new Date().toISOString().split('T')[0]}.png`;
        link.click();
      } catch (err) {
        showAlert("錯誤", "出圖失敗，請稍後再試。");
      } finally {
        setIsExporting(false);
      }
    });
  };

  // 匯出 PNG (時段明細)
  const handleExportBatchPNG = async () => {
    if (todayBatches.length === 0) {
      showAlert("提示", "目前尚無時段紀錄可出圖！");
      return;
    }
    
    showConfirm("出圖確認", "確定要產生並下載「時段出爐明細」嗎？", async () => {
      setIsExporting(true);
      try {
        if (!window.html2canvas) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }
        
        const element = document.getElementById('batch-report-template');
        const canvas = await window.html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `時段出爐明細_${new Date().toISOString().split('T')[0]}.png`;
        link.click();
      } catch (err) {
        showAlert("錯誤", "出圖失敗，請稍後再試。");
      } finally {
        setIsExporting(false);
      }
    });
  };

  // 清空所有歷史紀錄
  const handleClearHistory = () => {
    if (history.length === 0) {
      showAlert("提示", "目前沒有歷史資料可以清除。");
      return;
    }
    showConfirm("⚠️ 嚴重警告", "確定要「去除目前所有紀錄」嗎？\n此動作將清空所有歷史結算資料且無法復原！(包含雲端資料庫)", async () => {
      try {
        const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz6IwmqfbSP1m0Xhsw782RqHxk-BGykMZ9XXOGdHPs3FUMReuQ5lb5PSBUdY8qP6nRl/exec';
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'clear' })
        });
      } catch (error) {
        console.error('清除 Google Sheets 失敗:', error);
      }

      setHistory([]);
      localStorage.removeItem('kitchen_history');
      showAlert("成功", "所有歷史紀錄及雲端資料庫已清空。");
    });
  };

  // --- UI 元件渲染 ---

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <img 
                src="https://raw.githubusercontent.com/OrangeSmall/seafood-menu-app/main/logo.png" 
                alt="Logo" 
                className="h-8 w-auto mr-2 object-contain" 
              />
              <span className="font-bold text-xl tracking-wide text-slate-700">熟食產能追蹤系統</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-4">
              <button
                onClick={() => setActiveTab('record')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'record' ? 'bg-amber-100 text-amber-700' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <ClipboardList className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">現場紀錄</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'analytics' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <BarChart3 className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">數據分析</span>
              </button>
              
              <div className="flex items-center ml-2 sm:ml-4 border-l border-slate-200 pl-2 sm:pl-4 space-x-1 sm:space-x-2">
                 <button onClick={() => setViewMode('mobile')} title="手機模式" className={`p-2 rounded-md transition-colors ${viewMode === 'mobile' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                   <Smartphone className="w-4 h-4" />
                 </button>
                 <button onClick={() => setViewMode('desktop')} title="電腦模式" className={`p-2 rounded-md transition-colors ${viewMode === 'desktop' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                   <Monitor className="w-4 h-4" />
                 </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className={`mx-auto py-6 transition-all duration-300 ${viewMode === 'mobile' ? 'max-w-md px-2 sm:px-4' : 'max-w-7xl px-4 sm:px-6 lg:px-8'}`}>
        {activeTab === 'record' && (
          <div className="space-y-6">
            <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center w-full sm:w-auto">
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-500 mb-1 flex items-center"><Store className="w-3 h-3 mr-1"/>店別</label>
                  <select value={storeName} onChange={(e) => setStoreName(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none w-28 bg-white">
                    <option value="四維店">四維店</option>
                    <option value="北高店">北高店</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-500 mb-1 flex items-center"><User className="w-3 h-3 mr-1"/>紀錄人員</label>
                  <input type="text" value={recorderName} onChange={(e) => setRecorderName(e.target.value)} placeholder="姓名" className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none w-32" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-500 mb-1 flex items-center"><Clock className="w-3 h-3 mr-1"/>出爐時間</label>
                  <input type="time" value={batchTime} onChange={(e) => setBatchTime(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none w-32 bg-amber-50/50" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button onClick={() => setNewItemModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200"><Plus className="w-4 h-4 mr-1" />限定品</button>
                <button onClick={handleExportPNG} disabled={isExporting} className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"><ImageIcon className="w-4 h-4 mr-1" />出圖(PNG)</button>
                <button onClick={handleDailySettlement} className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"><Save className="w-4 h-4 mr-1" />結算存檔</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex justify-between items-center sticky top-[72px] z-10 shadow-sm backdrop-blur-sm bg-blue-50/90">
                  <span className="text-sm font-medium text-blue-800 flex items-center"><Utensils className="w-4 h-4 mr-1"/> 填寫完畢點擊右方按鈕</span>
                  <button onClick={handleBulkAddBatch} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md flex items-center"><Plus className="w-5 h-5 mr-1" />一鍵加入</button>
                </div>
                {Object.keys(groupedItems).map(category => (
                  <div key={category} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b flex items-center">
                      <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: CATEGORY_COLORS[category] || '#94a3b8' }}></span>
                      <h3 className="font-bold text-slate-700">{category}</h3>
                    </div>
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {groupedItems[category].map(item => (
                        <div key={item.id} className="border rounded-lg p-3 bg-white flex flex-col relative">
                          {item.isLimited && <span className="absolute -top-2 -right-2 bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-200">限定</span>}
                          <div className="text-sm font-bold text-slate-800 mb-1 truncate">{item.name}</div>
                          <div className="text-xs text-slate-500 mb-3">單位: {item.unit}</div>
                          <input type="number" placeholder="數量" value={inputs[item.id] || ''} onChange={(e) => handleInputChange(item.id, e.target.value)} className="w-full border rounded-md px-2 py-1.5 text-sm outline-none text-center bg-slate-50 focus:bg-white" onKeyDown={(e) => (e.key === 'Enter' || e.key === '+') && (e.preventDefault(), handleBulkAddBatch())} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border flex flex-col h-80 overflow-hidden">
                  <div className="px-4 py-3 border-b flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-700 flex items-center"><ClipboardList className="w-4 h-4 mr-1.5 text-blue-500"/>時段紀錄</h3>
                    <button onClick={handleExportBatchPNG} disabled={todayBatches.length === 0 || isExporting} className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-medium flex items-center disabled:opacity-50"><ImageIcon className="w-3 h-3.5 mr-1" />出圖</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-4">
                    {groupedBatchesByTime.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">尚未登錄</div> : 
                      groupedBatchesByTime.map((group, idx) => (
                        <div key={idx} className="bg-white border rounded-lg overflow-hidden shadow-sm">
                          <div className="bg-slate-50 px-3 py-2 border-b flex justify-between items-center text-xs font-bold text-slate-700"><Clock className="w-3 h-3 mr-1" />{group.time}</div>
                          <div className="divide-y">
                            {group.records.map(batch => (
                              <div key={batch.id} className="flex items-center justify-between p-2.5 text-sm">
                                <span>{batch.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-emerald-600">+{batch.qty}</span>
                                  <button onClick={() => handleDeleteBatch(batch.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border flex flex-col max-h-80 overflow-hidden">
                   <div className="px-4 py-3 border-b bg-slate-50 font-bold text-slate-700">當日累積總計</div>
                  <div className="flex-1 overflow-y-auto">
                    {todaySummary.length === 0 ? <div className="p-8 text-center text-slate-400 text-sm">無資料</div> : 
                      <table className="w-full text-sm text-left"><tbody className="divide-y">{todaySummary.map((item, idx) => <tr key={idx}><td className="px-4 py-2 font-medium">{item.name}</td><td className="px-4 py-2 text-right font-bold text-emerald-600">{item.qty} {item.unit}</td></tr>)}</tbody></table>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-5 rounded-xl shadow-sm border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-bold">產能趨勢分析</h2>
              <div className="flex flex-wrap gap-2">
                <select value={chartView} onChange={(e) => setChartView(e.target.value)} className="bg-slate-50 border text-sm rounded-lg p-2 outline-none"><option value="total">總體類別</option><option value="便當">便當類</option><option value="炸物">炸物類</option><option value="烤物">烤物類</option><option value="限定品">限定品</option></select>
                <button onClick={handleExportCSV} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium flex items-center"><Download className="w-4 h-4 mr-2" />匯出CSV</button>
                <button onClick={handleClearHistory} className="px-4 py-2 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50 flex items-center"><Trash2 className="w-4 h-4 mr-1" />清空紀錄</button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border h-[400px]">
              {history.length === 0 ? <div className="h-full flex items-center justify-center text-slate-400">尚無資料</div> : 
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} dy={10} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    {chartLines.map((key, index) => <Line key={key} type="monotone" dataKey={key} stroke={chartView === 'total' ? CATEGORY_COLORS[key] : CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={3} dot={{ r: 4 }} />)}
                  </LineChart>
                </ResponsiveContainer>
              }
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
               <div className="px-6 py-4 border-b bg-slate-50 font-bold">歷史結算明細</div>
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-sm text-left"><thead className="text-xs bg-white sticky top-0"><tr><th className="px-6 py-3">日期</th><th className="px-6 py-3">店別</th><th className="px-6 py-3">時段</th><th className="px-6 py-3">品項</th><th className="px-6 py-3">數量</th></tr></thead><tbody className="divide-y">{history.slice().reverse().flatMap((day) => day.records.map((rec, i) => <tr key={i}><td className="px-6 py-3">{i === 0 ? day.date : ''}</td><td className="px-6 py-3">{day.store}</td><td className="px-6 py-3">{rec.time}</td><td className="px-6 py-3">{rec.name}</td><td className="px-6 py-3 font-bold">{rec.qty} {rec.unit}</td></tr>))}</tbody></table>
              </div>
            </div>
          </div>
        )}
      </main>

      {newItemModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
            <h3 className="font-bold text-lg mb-4">新增限定品項</h3>
            <div className="space-y-4">
              <select value={newItemData.category} onChange={(e) => setNewItemData({...newItemData, category: e.target.value})} className="w-full border rounded-lg p-2 outline-none"><option value="限定品">一般限定品</option><option value="便當">便當類</option><option value="炸物">炸物類</option><option value="烤物">烤物類</option></select>
              <input type="text" placeholder="品項名稱" value={newItemData.name} onChange={(e) => setNewItemData({...newItemData, name: e.target.value})} className="w-full border rounded-lg p-2 outline-none" />
              <input type="text" placeholder="單位 (份/個)" value={newItemData.unit} onChange={(e) => setNewItemData({...newItemData, unit: e.target.value})} className="w-full border rounded-lg p-2 outline-none" />
            </div>
            <div className="mt-6 flex justify-end gap-3"><button onClick={() => setNewItemModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">取消</button><button onClick={handleAddNewItem} className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">確定</button></div>
          </div>
        </div>
      )}

      {/* 隱藏版型 */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <div id="daily-report-template" style={{ width: '400px', backgroundColor: '#fff', padding: '24px', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>🍽️ 熟食產能總結 - {storeName}</h2>
          <p style={{ fontSize: '12px', color: '#666' }}>{new Date().toLocaleDateString('zh-TW')} | 紀錄：{recorderName}</p>
          <div style={{ marginTop: '20px' }}>
            {Object.keys(groupedTodaySummary).map(cat => (
              <div key={cat} style={{ marginBottom: '15px' }}>
                <div style={{ fontWeight: 'bold', borderBottom: '1px solid #eee', marginBottom: '5px' }}>{cat}</div>
                {groupedTodaySummary[cat].map(item => <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span>{item.name}</span><span>{item.qty} {item.unit}</span></div>)}
              </div>
            ))}
          </div>
        </div>
        <div id="batch-report-template" style={{ width: '400px', backgroundColor: '#fff', padding: '24px', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>⏱️ 時段出爐明細 - {storeName}</h2>
          <p style={{ fontSize: '12px', color: '#666' }}>{new Date().toLocaleDateString('zh-TW')} | 紀錄：{recorderName}</p>
          {groupedBatchesByTime.map(group => (
            <div key={group.time} style={{ marginTop: '15px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', background: '#f5f5f5', padding: '2px 8px' }}>{group.time}</div>
              {group.records.map(r => <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '2px 0' }}><span>{r.name}</span><span style={{ color: '#059669' }}>+{r.qty}</span></div>)}
            </div>
          ))}
        </div>
      </div>

      {/* 自訂 Modal */}
      {dialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[60] px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-lg mb-2">{dialog.title}</h3>
            <p className="text-slate-600 mb-6">{dialog.message}</p>
            <div className="flex justify-end gap-3">
              {dialog.type === 'confirm' && <button onClick={() => setDialog({...dialog, isOpen: false})} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">取消</button>}
              <button onClick={() => { dialog.onConfirm && dialog.onConfirm(); setDialog({...dialog, isOpen: false}); }} className="px-4 py-2 bg-amber-500 text-white rounded-lg">確定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}