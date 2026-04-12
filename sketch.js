// ==========================================
// P5.JS DRAWING BOARD WITH SAVE & EMAIL + MULTI-UNDO
// ==========================================

let buffer;
let canvas;
let isDrawing = false;
let bufferReady = false;
let lastX, lastY;

// UNDO SYSTEM
let history = [];
const MAX_HISTORY = 20;
let isUndoing = false;
let lastUndoTime = 0;
const UNDO_COOLDOWN = 150;

// Track modifier key states
let metaKeyDown = false;
let ctrlKeyDown = false;

function setup() {
    canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent(document.body);
    
    createBuffer();
    createUI();

    noLoop();
    setupUndoKeyHandler();
}

function setupUndoKeyHandler() {
    // Track when Cmd/Ctrl are pressed/released
    window.addEventListener('keydown', function(e) {
        if (e.key === 'Meta' || e.code === 'MetaLeft' || e.code === 'MetaRight') {
            metaKeyDown = true;
        }
        if (e.key === 'Control' || e.code === 'ControlLeft' || e.code === 'ControlRight') {
            ctrlKeyDown = true;
        }
        // Check for Z while Cmd/ctrl is held
        if ((e.key === 'z' || e.key === 'Z') && (metaKeyDown || ctrlKeyDown || e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            e.stopPropagation();
            let now = Date.now();
            if (now - lastUndoTime >= UNDO_COOLDOWN) {
                lastUndoTime = now;
                undo();
            }
            return false;
        }
    }, true);
    window.addEventListener('keyup', function(e) {
        if (e.key === 'Meta' || e.code === 'MetaLeft' || e.code === 'MetaRight') {
            metaKeyDown = false;
        }
        if (e.key === 'Control' || e.code === 'ControlLeft' || e.code === 'ControlRight') {
            ctrlKeyDown = false;
        }
    }, true);
}

function createBuffer() {
    let w = max(windowWidth, 1);
    let h = max(windowHeight, 1);
    buffer = createGraphics(w, h);
    buffer.background(222);
    bufferReady = true;
}

function saveToHistory() {
    if (!bufferReady || !buffer) return;
    if (isUndoing) return;
    
    let snapshot = buffer.get();
    history.push(snapshot);
    
    if (history.length > MAX_HISTORY) {
        history.shift();
    }
}

function undo() {
    if (history.length === 0) {
        return;
    }
    
    isUndoing = true;
    
    let previousState = history.pop();
    
    buffer.background(222);
    buffer.image(previousState, 0, 0);
    
    redraw();
    
    setTimeout(() => {
        isUndoing = false;
    }, 50);
}

function draw() {
    if (!bufferReady || !buffer) return;
    image(buffer, 0, 0, width, height);
}

function mousePressed() {
    if (!bufferReady) return;
    if (isUndoing) return;
    
    if (event && event.target && event.target.closest('.ui-container')) {
        return;
    }
    
    saveToHistory();
    
    isDrawing = true;
    lastX = mouseX;
    lastY = mouseY;
    
    buffer.stroke(0);
    buffer.strokeWeight(3);
    buffer.point(lastX, lastY);
    
    redraw();
}

function mouseReleased() {
    isDrawing = false;
    lastX = null;
    lastY = null;
}

function mouseDragged() {
    if (!bufferReady || !isDrawing) return false;
    
    if (lastX !== null && lastY !== null) {
        buffer.stroke(0);
        buffer.strokeWeight(3);
        buffer.line(lastX, lastY, mouseX, mouseY);
    }
    
    lastX = mouseX;
    lastY = mouseY;
    
    redraw();
    return false;
}

function keyPressed() {
    if (!bufferReady) return;
    
    // Only handle clear here - undo is handled by native listener
    if (key === 'Backspace' || key === 'Delete') {
        saveToHistory();
        buffer.background(222);
        redraw();
    }
}

function windowResized() {
    if (!bufferReady || !buffer) return;
    
    let oldBuffer = buffer;
    let newW = max(windowWidth, 1);
    let newH = max(windowHeight, 1);
    
    resizeCanvas(newW, newH);
    
    buffer = createGraphics(newW, newH);
    buffer.background(222);
    
    if (oldBuffer.width > 0 && oldBuffer.height > 0) {
        buffer.image(oldBuffer, 0, 0);
    }
    
    history = [];
    redraw();
}

function createUI() {
    let btnContainer = createDiv('');
    btnContainer.addClass('ui-container');
    btnContainer.style('pointer-events', 'auto');
    
    let sendBtn = createButton('💌 Send Drawing');
    sendBtn.addClass('btn-send');
    sendBtn.parent(btnContainer);
    sendBtn.mousePressed((e) => {
        if (e) e.stopPropagation();
        showSaveOptions();
    });
    
    let undoBtn = createButton('↩️ Undo');
    undoBtn.addClass('btn-undo');
    undoBtn.parent(btnContainer);
    undoBtn.mousePressed((e) => {
        if (e) e.stopPropagation();
        undo();
    });
    
    let clearBtn = createButton('🗑 Clear');
    clearBtn.addClass('btn-clear');
    clearBtn.parent(btnContainer);
    clearBtn.mousePressed((e) => {
        if (e) e.stopPropagation();
        if (bufferReady && buffer) {
            saveToHistory();
            buffer.background(222);
            redraw();
        }
    });
}

function showSaveOptions() {
    if (!bufferReady || !buffer) return;
    
    let modal = createDiv('');
    modal.addClass('modal-overlay');
    modal.id('saveModal');
    
    let content = createDiv('');
    content.addClass('modal-content');
    content.parent(modal);
    
    let title = createElement('h2', 'Send Your Drawing');
    title.parent(content);
    
    let previewW = min(200, buffer.width);
    let preview = createImg(buffer.canvas.toDataURL('image/png'));
    preview.addClass('drawing-preview');
    preview.parent(content);
    
    let instructions = createP('Add a message and send via email:');
    instructions.parent(content);
    
    let messageInput = createElement('textarea');
    messageInput.addClass('message-input');
    messageInput.attribute('placeholder', 'Write a message to jujube...');
    messageInput.parent(content);
    
    let btnDiv = createDiv('');
    btnDiv.addClass('modal-buttons');
    btnDiv.parent(content);
    
    let downloadBtn = createButton('💾 Download');
    downloadBtn.addClass('btn-download');
    downloadBtn.parent(btnDiv);
    downloadBtn.mousePressed(() => {
        save(buffer, 'drawing-for-jujube.png');
    });
    
    let emailBtn = createButton('📧 Open Email');
    emailBtn.addClass('btn-email');
    emailBtn.parent(btnDiv);
    emailBtn.mousePressed(() => {
        generateEmail(messageInput.value());
    });
    
    let closeBtn = createButton('✕');
    closeBtn.addClass('btn-close');
    closeBtn.parent(content);
    closeBtn.mousePressed(() => modal.remove());
    
    modal.mousePressed((e) => {
        if (e.target === modal.elt) modal.remove();
    });
}

function generateEmail(message) {
    let subject = 'Drawing from jujube website';
    let body = `Hi jujube,\n\nI made you a drawing!\n\n${message ? 'Message: ' + message + '\n\n' : ''}See attached image (download and attach manually).`;
    
    let gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=madebyjujube@gmail.com&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    let mailtoUrl = `mailto:madebyjujube@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    let popup = createDiv('');
    popup.addClass('email-popup');
    
    let msg = createP('Choose how to send:');
    msg.parent(popup);
    
    let gmailBtn = createButton('Open Gmail');
    gmailBtn.addClass('popup-btn');
    gmailBtn.parent(popup);
    gmailBtn.mousePressed(() => {
        window.open(gmailUrl, '_blank');
        closePopup();
    });
    
    let mailBtn = createButton('Use Default Email App');
    mailBtn.addClass('popup-btn');
    mailBtn.parent(popup);
    mailBtn.mousePressed(() => {
        window.location.href = mailtoUrl;
        closePopup();
    });
    
    let copyBtn = createButton('Copy Image to Paste');
    copyBtn.addClass('popup-btn');
    copyBtn.parent(popup);
    copyBtn.mousePressed(() => {
        if (!navigator.clipboard || !navigator.clipboard.write) {
            alert('Clipboard API not supported. Please download the image instead.');
            return;
        }
        
        buffer.canvas.toBlob((blob) => {
            if (!blob) {
                alert('Failed to create image blob');
                return;
            }
            
            navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]).then(() => {
                alert('Image copied! Paste into your email with Ctrl+V');
                closePopup();
            }).catch(err => {
                console.error('Clipboard error:', err);
                alert('Could not copy to clipboard. Please download instead.');
            });
        });
    });
    
    let close = createButton('Cancel');
    close.addClass('btn-cancel');
    close.parent(popup);
    close.mousePressed(() => popup.remove());
    
    function closePopup() {
        popup.remove();
        let modal = select('#saveModal');
        if (modal) modal.remove();
    }
}