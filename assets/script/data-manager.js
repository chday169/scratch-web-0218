/**
 * 數據管理工具 - 用於維護PDF和影片清單
 */

class DataManager {
  constructor() {
    this.manifestURL = './data_scr/manifest.json';
    this.videoListURL = './data_scr/video_list.json';
  }
  
  /**
   * 檢查數據完整性
   */
  async checkDataIntegrity() {
    try {
      const [pdfResponse, videoResponse] = await Promise.all([
        fetch(this.manifestURL),
        fetch(this.videoListURL)
      ]);
      
      const pdfData = await pdfResponse.json();
      const videoData = await videoResponse.json();
      
      return {
        pdfs: {
          count: pdfData.pdfs?.length || 0,
          valid: Array.isArray(pdfData.pdfs),
          errors: this.validatePDFs(pdfData.pdfs)
        },
        videos: {
          count: videoData.videos?.length || 0,
          valid: Array.isArray(videoData.videos),
          errors: this.validateVideos(videoData.videos)
        }
      };
    } catch (error) {
      console.error('數據完整性檢查失敗:', error);
      return null;
    }
  }
  
  /**
   * 驗證PDF數據
   */
  validatePDFs(pdfs) {
    if (!Array.isArray(pdfs)) return ['PDFs不是陣列'];
    
    const errors = [];
    pdfs.forEach((pdf, index) => {
      if (!pdf.id) errors.push(`PDF[${index}]: 缺少id`);
      if (!pdf.title) errors.push(`PDF[${index}]: 缺少標題`);
      if (!pdf.url) errors.push(`PDF[${index}]: 缺少URL`);
      if (!pdf.source) errors.push(`PDF[${index}]: 缺少來源`);
      
      // 檢查URL可訪問性（僅預覽）
      if (pdf.url && !pdf.url.startsWith('http') && !pdf.url.startsWith('./')) {
        errors.push(`PDF[${index}]: URL格式不正確`);
      }
    });
    
    return errors;
  }
  
  /**
   * 驗證影片數據
   */
  validateVideos(videos) {
    if (!Array.isArray(videos)) return ['videos不是陣列'];
    
    const errors = [];
    videos.forEach((video, index) => {
      if (!video.id) errors.push(`Video[${index}]: 缺少id`);
      if (!video.title) errors.push(`Video[${index}]: 缺少標題`);
      if (!video.url && video.status === 'ready') {
        errors.push(`Video[${index}]: 狀態為ready但缺少URL`);
      }
    });
    
    return errors;
  }
  
  /**
   * 添加PDF到清單
   */
  async addPDF(pdfData) {
    try {
      const response = await fetch(this.manifestURL);
      const data = await response.json();
      
      // 檢查重複
      if (data.pdfs.some(pdf => pdf.id === pdfData.id)) {
        throw new Error(`PDF ID "${pdfData.id}" 已存在`);
      }
      
      data.pdfs.push({
        id: pdfData.id,
        title: pdfData.title,
        level: pdfData.level || 'beginner',
        url: pdfData.url,
        source: pdfData.source || 'local',
        github_repo: pdfData.github_repo,
        release_tag: pdfData.release_tag,
        added_date: new Date().toISOString().split('T')[0]
      });
      
      // 這裡應該實際保存到伺服器
      // 本地演示時只顯示訊息
      console.log('PDF已添加（演示模式）:', pdfData);
      return true;
      
    } catch (error) {
      console.error('添加PDF失敗:', error);
      return false;
    }
  }
  
  /**
   * 添加影片到清單
   */
  async addVideo(videoData) {
    try {
      const response = await fetch(this.videoListURL);
      const data = await response.json();
      
      // 檢查重複
      if (data.videos.some(video => video.id === videoData.id)) {
        throw new Error(`影片 ID "${videoData.id}" 已存在`);
      }
      
      data.videos.push({
        id: videoData.id,
        title: videoData.title,
        description: videoData.description || '',
        url: videoData.url,
        source: videoData.source || 'youtube',
        channel: videoData.channel,
        category: videoData.category || 'scratch',
        duration: videoData.duration || '00:00',
        thumbnail: videoData.thumbnail || '',
        published: videoData.published || new Date().toISOString().split('T')[0],
        status: videoData.status || 'ready'
      });
      
      // 這裡應該實際保存到伺服器
      console.log('影片已添加（演示模式）:', videoData);
      return true;
      
    } catch (error) {
      console.error('添加影片失敗:', error);
      return false;
    }
  }
  
  /**
   * 生成GitHub Release URL
   */
  generateGitHubURL(repo, tag, filename) {
    return `https://github.com/${repo}/releases/download/${tag}/${filename}`;
  }
  
  /**
   * 生成YouTube嵌入URL
   */
  generateYouTubeEmbedURL(videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  /**
   * 獲取統計數據
   */
  getStatistics() {
    const stats = {
      pdfs: {
        total: 0,
        bySource: {},
        byLevel: {}
      },
      videos: {
        total: 0,
        bySource: {},
        byCategory: {}
      }
    };
    
    // 從localStorage獲取瀏覽數據
    const pdfViews = Object.keys(localStorage)
      .filter(key => key.startsWith('pdf_views_'))
      .reduce((sum, key) => sum + parseInt(localStorage.getItem(key) || 0), 0);
    
    const videoViews = parseInt(localStorage.getItem('total_video_views') || '0');
    
    return {
      totalPDFViews: pdfViews,
      totalVideoViews: videoViews,
      overallTotal: pdfViews + videoViews
    };
  }
}

// 導出全局使用
window.DataManager = DataManager;