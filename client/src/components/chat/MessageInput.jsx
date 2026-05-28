import { useState, useRef, useCallback } from 'react';
import { Send, ImagePlus, Loader2 } from 'lucide-react';
import { useChat } from '../../context/ChatContext.jsx';

/** Redimensiona a imagem no navegador antes de enviar (max 1280px, JPEG). */
function fileToDataUrl(file, max = 1280) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > max || height > max) {
          const ratio = Math.min(max / width, max / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(type, 0.82));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Campo de envio. Dispara typing:start ao digitar e typing:stop
 * depois de 1.5s sem teclar (ou ao enviar). Suporta envio de imagem.
 */
export default function MessageInput({ roomId }) {
  const { sendMessage, sendImage, startTyping, stopTyping } = useChat();
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const typingRef = useRef(false);
  const timerRef = useRef(null);
  const fileRef = useRef(null);

  const stop = useCallback(() => {
    if (typingRef.current) {
      typingRef.current = false;
      stopTyping(roomId);
    }
    clearTimeout(timerRef.current);
  }, [roomId, stopTyping]);

  const handleChange = (e) => {
    setText(e.target.value);
    if (!typingRef.current) {
      typingRef.current = true;
      startTyping(roomId);
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(stop, 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setText('');
    stop();
    try {
      await sendMessage(value);
    } catch (err) {
      console.error(err);
      setText(value);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      await sendImage(dataUrl);
    } catch (err) {
      console.error(err);
      alert('Nao consegui enviar a imagem: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFile}
      />
      <button
        type="button"
        className="icon-btn composer__attach"
        aria-label="Enviar imagem"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? <Loader2 size={22} className="spin" /> : <ImagePlus size={22} />}
      </button>
      <input
        className="composer__input"
        type="text"
        value={text}
        onChange={handleChange}
        onBlur={stop}
        placeholder="Escreva uma mensagem quentinha..."
        autoComplete="off"
      />
      <button
        type="submit"
        className="composer__send"
        disabled={!text.trim()}
        aria-label="Enviar"
      >
        <Send size={20} />
      </button>
    </form>
  );
}
