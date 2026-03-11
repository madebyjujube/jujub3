// ==========================================
// WINDOW MANAGER - Fixed for iframe interaction
// ==========================================

class WindowManager {
  constructor() {
    this.currentZIndex = 100;
    this.windows = new Map();
    this.isDragging = false;
    this.isResizing = false;
    this.activeWindow = null;
    this.dragData = null;
    this.resizeData = null;
    
    this.init();
  }

  init() {
    document.querySelectorAll('.windows').forEach(windowEl => {
      const windowClass = this.getWindowClass(windowEl);
      if (windowClass) {
        this.setupWindow(windowEl, windowClass);
      }
    });
  }

  getWindowClass(windowEl) {
    const classes = ['jujube', 'design', 'intangible', 'purple', 'orange', 'wcontact', 'wwaves'];
    return classes.find(c => windowEl.classList.contains(c));
  }

  setupWindow(windowEl, windowClass) {
    windowEl.style.display = 'none';
    
    this.windows.set(windowClass, {
      element: windowEl,
      windowClass: windowClass
    });

    // Use pointer events instead of mouse events for better capture
    windowEl.addEventListener('pointerdown', (e) => this.handlePointerDown(e, windowClass));
    
    // Setup resizers
    const prefixMap = {
      'jujube': 'ju', 'design': 'de', 'intangible': 'in',
      'purple': 'ur', 'orange': 'or', 'wcontact': 'co', 'wwaves': 'wa'
    };
    
    const prefix = prefixMap[windowClass];
    const seResizer = windowEl.querySelector(`.resizer.${prefix}se`);
    const swResizer = windowEl.querySelector(`.resizer.${prefix}sw`);
    
    if (seResizer) this.setupResize(seResizer, windowClass, 'se');
    if (swResizer) this.setupResize(swResizer, windowClass, 'sw');
  }

  handlePointerDown(e, windowClass) {
    // Don't drag if clicking resizer
    if (e.target.classList.contains('resizer')) return;
    
    // Capture pointer to ensure we get events even if mouse goes over iframe
    e.target.setPointerCapture(e.pointerId);
    
    this.bringToFront(windowClass);
    this.startDrag(e, windowClass);
  }

  bringToFront(windowClass) {
    const windowData = this.windows.get(windowClass);
    if (!windowData) return;
    this.currentZIndex++;
    windowData.element.style.zIndex = this.currentZIndex;
  }

  startDrag(e, windowClass) {
    this.isDragging = true;
    this.activeWindow = windowClass;
    const el = this.windows.get(windowClass).element;
    
    this.dragData = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: el.offsetLeft,
      startTop: el.offsetTop,
      pointerId: e.pointerId
    };

    // Use pointer events with capture
    el.addEventListener('pointermove', this.onPointerMove);
    el.addEventListener('pointerup', this.onPointerUp);
    el.addEventListener('pointercancel', this.onPointerUp);
    
    // Backup: also listen on window in case pointer capture fails
    window.addEventListener('mousemove', this.onMouseMoveBackup);
    window.addEventListener('mouseup', this.onMouseUpBackup);
  }

  onPointerMove = (e) => {
    if (!this.isDragging || !this.dragData) return;
    
    const dx = e.clientX - this.dragData.startX;
    const dy = e.clientY - this.dragData.startY;
    
    const el = this.windows.get(this.activeWindow).element;
    el.style.left = `${this.dragData.startLeft + dx}px`;
    el.style.top = `${this.dragData.startTop + dy}px`;
  }

  onPointerUp = (e) => {
    this.stopDrag();
  }

  // Backup handlers for when pointer events fail (iframes)
  onMouseMoveBackup = (e) => {
    if (!this.isDragging || !this.dragData) return;
    
    const dx = e.clientX - this.dragData.startX;
    const dy = e.clientY - this.dragData.startY;
    
    const el = this.windows.get(this.activeWindow).element;
    el.style.left = `${this.dragData.startLeft + dx}px`;
    el.style.top = `${this.dragData.startTop + dy}px`;
  }

  onMouseUpBackup = (e) => {
    this.stopDrag();
  }

  stopDrag() {
    if (!this.isDragging) return;
    
    const el = this.windows.get(this.activeWindow)?.element;
    if (el) {
      el.removeEventListener('pointermove', this.onPointerMove);
      el.removeEventListener('pointerup', this.onPointerUp);
      el.removeEventListener('pointercancel', this.onPointerUp);
      
      // Release pointer capture if it exists
      try {
        el.releasePointerCapture(this.dragData?.pointerId);
      } catch(e) {
        // Ignore if no capture exists
      }
    }
    
    // Remove backup listeners
    window.removeEventListener('mousemove', this.onMouseMoveBackup);
    window.removeEventListener('mouseup', this.onMouseUpBackup);
    
    this.isDragging = false;
    this.activeWindow = null;
    this.dragData = null;
  }

  // ==========================================
  // RESIZE FUNCTIONALITY (Also fixed)
  // ==========================================

  setupResize(resizerEl, windowClass, direction) {
    resizerEl.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      e.target.setPointerCapture(e.pointerId);
      this.startResize(e, windowClass, direction);
    });
  }

  startResize(e, windowClass, direction) {
    this.isResizing = true;
    this.activeWindow = windowClass;
    const el = this.windows.get(windowClass).element;
    
    const rect = el.getBoundingClientRect();
    this.resizeData = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
      startLeft: rect.left,
      direction: direction,
      pointerId: e.pointerId
    };

    el.addEventListener('pointermove', this.onResizeMove);
    el.addEventListener('pointerup', this.onResizeUp);
    el.addEventListener('pointercancel', this.onResizeUp);
    
    // Backup listeners
    window.addEventListener('mousemove', this.onResizeMoveBackup);
    window.addEventListener('mouseup', this.onResizeUpBackup);
  }

  onResizeMove = (e) => {
    if (!this.isResizing || !this.resizeData) return;
    
    const el = this.windows.get(this.activeWindow).element;
    const dx = e.clientX - this.resizeData.startX;
    const dy = e.clientY - this.resizeData.startY;

    if (this.resizeData.direction === 'se') {
      el.style.width = `${this.resizeData.startWidth + dx}px`;
      el.style.height = `${this.resizeData.startHeight + dy}px`;
    } else if (this.resizeData.direction === 'sw') {
      el.style.width = `${this.resizeData.startWidth - dx}px`;
      el.style.height = `${this.resizeData.startHeight + dy}px`;
      el.style.left = `${this.resizeData.startLeft + dx}px`;
    }
  }

  onResizeUp = (e) => {
    this.stopResize();
  }

  onResizeMoveBackup = (e) => {
    if (!this.isResizing || !this.resizeData) return;
    
    const el = this.windows.get(this.activeWindow).element;
    const dx = e.clientX - this.resizeData.startX;
    const dy = e.clientY - this.resizeData.startY;

    if (this.resizeData.direction === 'se') {
      el.style.width = `${this.resizeData.startWidth + dx}px`;
      el.style.height = `${this.resizeData.startHeight + dy}px`;
    } else if (this.resizeData.direction === 'sw') {
      el.style.width = `${this.resizeData.startWidth - dx}px`;
      el.style.height = `${this.resizeData.startHeight + dy}px`;
      el.style.left = `${this.resizeData.startLeft + dx}px`;
    }
  }

  onResizeUpBackup = (e) => {
    this.stopResize();
  }

  stopResize() {
    if (!this.isResizing) return;
    
    const el = this.windows.get(this.activeWindow)?.element;
    if (el) {
      el.removeEventListener('pointermove', this.onResizeMove);
      el.removeEventListener('pointerup', this.onResizeUp);
      el.removeEventListener('pointercancel', this.onResizeUp);
      
      try {
        el.releasePointerCapture(this.resizeData?.pointerId);
      } catch(e) {}
    }
    
    window.removeEventListener('mousemove', this.onResizeMoveBackup);
    window.removeEventListener('mouseup', this.onResizeUpBackup);
    
    this.isResizing = false;
    this.activeWindow = null;
    this.resizeData = null;
  }

  // ==========================================
  // OPEN/CLOSE FUNCTIONALITY
  // ==========================================

  openWindow(windowClass) {
    const windowData = this.windows.get(windowClass);
    if (!windowData) {
      console.error(`Window ${windowClass} not found`);
      return;
    }
    
    windowData.element.style.display = 'block';
    this.bringToFront(windowClass);
  }

  closeWindow(windowClass) {
    const windowData = this.windows.get(windowClass);
    if (!windowData) return;
    
    windowData.element.style.display = 'none';
  }

  toggleWindow(windowClass) {
    const el = this.windows.get(windowClass)?.element;
    if (!el) return;
    
    const isOpen = el.style.display === 'block';
    if (isOpen) {
      this.closeWindow(windowClass);
    } else {
      this.openWindow(windowClass);
    }
  }

  closeAll() {
    this.windows.forEach((data, windowClass) => {
      this.closeWindow(windowClass);
    });
  }
}

// ==========================================
// INITIALIZE
// ==========================================

const manager = new WindowManager();

// Global functions for HTML onclick handlers
function openJujube() { manager.toggleWindow('jujube'); }
function openDesign() { manager.toggleWindow('design'); }
function openIntangible() { manager.toggleWindow('intangible'); }
function openPurple() { manager.toggleWindow('purple'); }
function openOrange() { manager.toggleWindow('orange'); }
function openContact() { manager.toggleWindow('wcontact'); }
function openWaves() { manager.toggleWindow('wwaves'); }
function closeAll() { manager.closeAll(); }