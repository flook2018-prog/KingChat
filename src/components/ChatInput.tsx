import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Send, Image, Smile, X } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onSendSticker: (stickerId: string) => void;
  onSendImage: (imageFile: File) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, onSendSticker, onSendImage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // สติกเกอร์ตัวอย่าง
  const stickers = [
    { id: 'thumbs-up', emoji: '👍', name: 'ถูกต้อง' },
    { id: 'ok', emoji: '👌', name: 'โอเค' },
    { id: 'heart', emoji: '❤️', name: 'หัวใจ' },
    { id: 'smile', emoji: '😊', name: 'ยิ้ม' },
    { id: 'laugh', emoji: '😂', name: 'หัวเราะ' },
    { id: 'wink', emoji: '😉', name: 'ขยิบตา' },
    { id: 'think', emoji: '🤔', name: 'คิด' },
    { id: 'love', emoji: '🥰', name: 'รัก' },
    { id: 'cool', emoji: '😎', name: 'เท่' },
    { id: 'sad', emoji: '😢', name: 'เศร้า' },
    { id: 'angry', emoji: '😠', name: 'โกรธ' },
    { id: 'surprised', emoji: '😲', name: 'ตกใจ' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedImage) {
      onSendImage(selectedImage);
      clearImageSelection();
    } else if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleStickerSelect = (stickerId: string) => {
    onSendSticker(stickerId);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImageSelection = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="border-t bg-background">
      {/* Image Preview */}
      {imagePreview && (
        <div className="p-3 border-b bg-muted/30">
          <div className="relative inline-block">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="max-w-32 max-h-32 rounded-lg object-cover"
            />
            <Button
              size="sm"
              variant="destructive"
              className="absolute -top-2 -right-2 size-6 rounded-full p-0"
              onClick={clearImageSelection}
            >
              <X className="size-3" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">กดส่งเพื่อส่งรูปภาพ</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2 p-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        
        {/* Sticker Button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" disabled={disabled}>
              <Smile className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2">
            <div className="grid grid-cols-4 gap-2">
              {stickers.map((sticker) => (
                <Button
                  key={sticker.id}
                  variant="ghost"
                  className="h-12 text-xl hover:bg-muted"
                  onClick={() => handleStickerSelect(sticker.id)}
                >
                  {sticker.emoji}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Image Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={triggerFileInput}
          disabled={disabled}
          type="button"
        >
          <Image className="size-4" />
        </Button>

        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={selectedImage ? "เพิ่มข้อความ (ไม่บังคับ)" : "พิมพ์ข้อความ..."}
          disabled={disabled}
          className="flex-1"
        />
        
        <Button 
          type="submit" 
          disabled={(!message.trim() && !selectedImage) || disabled}
          size="icon"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}