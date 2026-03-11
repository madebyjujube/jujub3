// ==========================================
// P5.JS DRAWING BOARD WITH SAVE & EMAIL
// ==========================================

let buffer;
let canvas;
let isDrawing = false;
let bufferReady = false;
let lastX, lastY; // Manual tracking of last mouse position

function setup() {
    canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent(document.body);
    
    createBuffer();
    createUI();
    
    noLoop();
}

function createBuffer() {
    let w = max(windowWidth, 1);
    let h = max(windowHeight, 1);
    buffer = createGraphics(w, h);
    buffer.background(222);
    bufferReady = true;
}

function draw() {
    if (!bufferReady || !buffer) return;
    image(buffer, 0, 0, width, height);
}

// ==========================================
// DRAWING LOGIC (Fixed with manual position tracking)
// ==========================================

function mousePressed() {
    if (!bufferReady) return;
    isDrawing = true;
    
    // Draw initial point and set last position
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
    
    // Only draw if we have a valid last position
    if (lastX !== null && lastY !== null) {
        buffer.stroke(0);
        buffer.strokeWeight(3);
        buffer.line(lastX, lastY, mouseX, mouseY);
    }
    
    // Update last position for next frame
    lastX = mouseX;
    lastY = mouseY;
    
    redraw();
    return false;
}

function keyPressed() {
    if (!bufferReady) return;
    if (key === 'Backspace' || key === 'Delete') {
        buffer.background(222);
        redraw();
    }
}

// ==========================================
// RESIZE HANDLING
// ==========================================

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
    
    redraw();
}

// ==========================================
// UI CREATION
// ==========================================

function createUI() {
    let btnContainer = createDiv('');
    btnContainer.addClass('ui-container');
    
    let sendBtn = createButton('💌 Send Drawing');
    sendBtn.addClass('btn-send');
    sendBtn.parent(btnContainer);
    sendBtn.mousePressed(showSaveOptions);
    
    let clearBtn = createButton('🗑 Clear');
    clearBtn.addClass('btn-clear');
    clearBtn.parent(btnContainer);
    clearBtn.mousePressed(() => {
        if (bufferReady && buffer) {
            buffer.background(222);
            redraw();
        }
    });
}

// ==========================================
// SAVE MODAL
// ==========================================

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