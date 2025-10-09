import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface ChatMessageProps {
  id: string;
  content: string;
  sender: {
    name: string;
    avatar?: string;
  };
  timestamp: Date;
  isCurrentUser: boolean;
  type?: 'text' | 'sticker' | 'image';
  imageUrl?: string;
  stickerId?: string;
}

export function ChatMessage({ 
  content, 
  sender, 
  timestamp, 
  isCurrentUser, 
  type = 'text',
  imageUrl,
  stickerId 
}: ChatMessageProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Provide default values if sender is undefined
  const senderName = sender?.name || 'ไม่ทราบชื่อ';
  const senderAvatar = sender?.avatar;

  // สติกเกอร์แมป
  const stickerMap: { [key: string]: string } = {
    'thumbs-up': '👍',
    'ok': '👌',
    'heart': '❤️',
    'smile': '😊',
    'laugh': '😂',
    'wink': '😉',
    'think': '🤔',
    'love': '🥰',
    'cool': '😎',
    'sad': '😢',
    'angry': '😠',
    'surprised': '😲'
  };

  const renderMessageContent = () => {
    switch (type) {
      case 'sticker':
        return (
          <div className="text-4xl p-2">
            {stickerMap[stickerId || ''] || '😊'}
          </div>
        );
      case 'image':
        return (
          <div className="relative">
            <img 
              src={imageUrl} 
              alt="แชทรูปภาพ"
              className="max-w-64 max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(imageUrl, '_blank')}
            />
            {content && (
              <div className={`mt-2 rounded-lg px-3 py-2 ${
                isCurrentUser 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                <p className="break-words">{content}</p>
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className={`rounded-lg px-3 py-2 ${
            isCurrentUser 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground'
          }`}>
            <p className="break-words">{content}</p>
          </div>
        );
    }
  };

  return (
    <div className={`flex gap-3 p-4 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar className="size-8 flex-shrink-0">
        <AvatarImage src={senderAvatar} alt={senderName} />
        <AvatarFallback>{senderName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      
      <div className={`flex flex-col max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        {/* แสดงชื่อแอดมินเหนือข้อความ */}
        {isCurrentUser && (
          <span className="text-xs text-muted-foreground mb-1">
            {senderName}
          </span>
        )}
        
        {renderMessageContent()}
        
        <span className="text-xs text-muted-foreground mt-1">
          {isCurrentUser ? formatTime(timestamp) : `${senderName} • ${formatTime(timestamp)}`}
        </span>
      </div>
    </div>
  );
}