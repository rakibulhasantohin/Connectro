import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../lib/utils';

interface StoryCardProps {
  story: {
    id: string | number;
    name: string;
    avatar: string;
    image: string;
    isUser?: boolean;
  };
  onClick?: () => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({ story, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="relative w-28 h-48 rounded-xl shrink-0 overflow-hidden shadow-sm border border-gray-200 cursor-pointer group transition-all hover:shadow-md"
    >
      {story.image ? (
        <img 
          src={story.image} 
          alt={story.name} 
          className={cn(
            "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110",
            story.isUser && "h-[70%]"
          )}
        />
      ) : (
        <div className={cn(
          "w-full h-full bg-gray-100 flex items-center justify-center",
          story.isUser && "h-[70%]"
        )}>
          <Plus className="w-8 h-8 text-gray-300" />
        </div>
      )}
      {story.isUser ? (
        <div className="absolute bottom-0 w-full h-[30%] bg-white flex flex-col items-center justify-end pb-2">
          <div className="absolute -top-4 bg-[#1877F2] rounded-full p-1 border-4 border-white shadow-sm transition-transform group-hover:scale-110">
            <Plus className="w-6 h-6 text-white" strokeWidth={3} />
          </div>
          <span className="text-[11px] font-bold text-gray-900 mt-2">Create story</span>
        </div>
      ) : (
        <>
          <div className="absolute top-3 left-3 w-9 h-9 rounded-full border-4 border-[#1877F2] overflow-hidden shadow-lg z-10 bg-white">
            {story.avatar ? (
              <img src={story.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <Plus className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 group-hover:from-black/30 transition-colors" />
          <div className="absolute bottom-2 left-2 right-2 z-10">
            <span className="text-[11px] font-bold text-white drop-shadow-lg leading-tight block truncate">
              {story.name}
            </span>
          </div>
        </>
      )}
    </div>
  );
};
