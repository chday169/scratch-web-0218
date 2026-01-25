// PDF 管理器 - 混合模式載入
class PDFManager {
  constructor() {
    this.manifest = null;
    this.currentPDF = null;
  }

  // 載入 manifest
  async loadManifest() {
    try {
      const response = await fetch('./data/manifest.json');
      this.manifest = await response.json();
      return this.manifest.pdfs;
    } catch (error) {
      console.error('載入 manifest.json 失敗:', error);
      return [];
    }
  }

  // 建立 PDF 項目
  createPDFItem(pdf) {
    const li = document.createElement('li');
    li.className = `pdf-item ${pdf.category} ${pdf.embedded ? 'embedded' : 'download-only'}`;
    li.dataset.id = pdf.id;

    // 標題
    const title = document.createElement('div');
    title.className = 'pdf-title';
    title.textContent = pdf.title;
    li.appendChild(title);

    // 描述
    if (pdf.description) {
      const desc = document.createElement('div');
      desc.className = 'pdf-description';
      desc.textContent = pdf.description;
      li.appendChild(desc);
    }

    // 狀態標籤
    const status = document.createElement('div');
    status.className = 'pdf-status';
    status.innerHTML = pdf.embedded ? 
      '<span class="status-badge embedded">🔍 預嵌</span>' : 
      '<span class="status-badge download">⬇️ 下載</span>';
    li.appendChild(status);

    // 點擊事件
    li.addEventListener('click', (e) => {
      if (!e.target.classList.contains('action-btn')) {
        this.handlePDFClick(pdf);
      }
    });

    // 下載按鈕（非預嵌的才顯示）
    if (!pdf.embedded && pdf.githubRelease) {
      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'action-btn download-btn';
      downloadBtn.textContent = '直接下載';
      downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.open(pdf.githubRelease, '_blank');
      });
      li.appendChild(downloadBtn);
    }

    // 統計信息
    const stats = document.createElement('div');
    stats.className = 'pdf-stats';
    stats.innerHTML = `
      👁️ ${pdf.views || 0} 次 | 👍 ${pdf.likes || 0}
    `;
    li.appendChild(stats);

    return li;
  }

  // 處理 PDF 點擊
  handlePDFClick(pdf) {
    // 記錄瀏覽次數
    this.recordView(pdf.id);
    
    if (pdf.embedded) {
      // 預嵌模式：顯示在內嵌檢視器中
      this.showEmbeddedPDF(pdf);
    } else {
      // 下載模式：詢問是否下載
      if (pdf.githubRelease && confirm('此 PDF 需要從 GitHub 下載，是否繼續？')) {
        window.open(pdf.githubRelease, '_blank');
      }
    }
  }

  // 顯示預嵌 PDF
  showEmbeddedPDF(pdf) {
    const viewer = document.getElementById('pdf-viewer');
    if (!viewer) return;

    viewer.innerHTML = `
      <div class="pdf-viewer-header">
        <h3>${pdf.title}</h3>
        <button class="close-viewer">✕</button>
      </div>
      <div class="pdf-viewer-content">
        <iframe src="${pdf.url}" title="${pdf.title}"></iframe>
        <div class="pdf-info">
          <p>${pdf.description || '暫無描述'}</p>
          <div class="view-count">👁️ ${pdf.views || 0} 次瀏覽</div>
          ${pdf.githubRelease ? `<a href="${pdf.githubRelease}" target="_blank" class="btn download-link">⬇️ 從 GitHub 下載</a>` : ''}
        </div>
      </div>
    `;

    // 關閉按鈕事件
    viewer.querySelector('.close-viewer').addEventListener('click', () => {
      viewer.innerHTML = '';
    });

    // 顯示檢視器
    viewer.style.display = 'block';
  }

  // 記錄瀏覽次數
  recordView(pdfId) {
    let pdfs = JSON.parse(localStorage.getItem('scratch_pdfs') || '{}');
    
    if (!pdfs[pdfId]) {
      pdfs[pdfId] = { views: 0, likes: 0 };
    }
    
    pdfs[pdfId].views++;
    localStorage.setItem('scratch_pdfs', JSON.stringify(pdfs));
    
    // 更新 manifest 中的 views
    if (this.manifest && this.manifest.pdfs) {
      const pdf = this.manifest.pdfs.find(p => p.id === pdfId);
      if (pdf) {
        pdf.views = pdfs[pdfId].views;
      }
    }
  }

  // 篩選 PDF
  filterPDFs(category) {
    const items = document.querySelectorAll('.pdf-item');
    items.forEach(item => {
      if (category === 'all' || item.classList.contains(category)) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  }

  // 初始化
  async init() {
    const pdfs = await this.loadManifest();
    const container = document.getElementById('pdf-list');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    // 載入本地儲存的統計數據
    const savedStats = JSON.parse(localStorage.getItem('scratch_pdfs') || '{}');
    
    pdfs.forEach(pdf => {
      // 更新統計數據
      if (savedStats[pdf.id]) {
        pdf.views = savedStats[pdf.id].views;
        pdf.likes = savedStats[pdf.id].likes;
      }
      
      const item = this.createPDFItem(pdf);
      container.appendChild(item);
    });

    // 初始化篩選器
    this.initFilter();
    
    // 更新總計數
    this.updateStats(pdfs.length);
  }

  // 初始化篩選器
  initFilter() {
    const filter = document.getElementById('category-filter');
    if (filter) {
      filter.addEventListener('change', (e) => {
        this.filterPDFs(e.target.value);
      });
    }
  }

  // 更新統計
  updateStats(count) {
    const countElement = document.getElementById('pdf-count');
    if (countElement) {
      countElement.textContent = count;
    }
    
    // 儲存到 localStorage
    localStorage.setItem('pdf_total_count', count.toString());
  }
}

// 全局 PDF 管理器實例
window.PDFManager = new PDFManager();