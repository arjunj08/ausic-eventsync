import React from 'react';
import { Calendar, Trash2, Edit, Check, Globe } from 'lucide-react';

export default function EventCard({ event, isAdmin, onOpenDetails, onEdit, onDelete, onPublish }) {
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-[#111111] hover:bg-[#151515] border border-gray-800 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:border-gray-700 flex flex-col group">
      
      {/* Banner Image */}
      <div className="h-44 w-full overflow-hidden relative">
        <img 
          src={event.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'} 
          alt={event.title} 
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3 flex items-center space-x-2">
          {event.status === 'draft' ? (
            <span className="bg-[#EAB308]/20 border border-[#EAB308]/40 text-[#EAB308] text-xs font-semibold px-2.5 py-1 rounded-full">
              Draft
            </span>
          ) : (
            <span className="bg-[#22C55E]/20 border border-[#22C55E]/40 text-[#22C55E] text-xs font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1">
              <Globe className="h-3 w-3" />
              <span>Published</span>
            </span>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center text-[#00BFFF] text-xs font-medium space-x-1.5 mb-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(event.date)}</span>
          </div>

          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#00BFFF] transition-colors">
            {event.title}
          </h3>

          <p className="text-gray-400 text-sm line-clamp-3 mb-4 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Action Controls */}
        <div className="border-t border-gray-850 pt-4 flex items-center justify-between">
          <button
            onClick={() => onOpenDetails(event._id)}
            className="text-xs text-white hover:text-[#00BFFF] bg-[#1a1a1a] hover:bg-[#202020] border border-gray-800 hover:border-gray-700 px-4 py-2 rounded-lg font-medium transition-all cursor-pointer"
          >
            Details
          </button>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="flex items-center space-x-2">
              {event.status === 'draft' && (
                <button
                  onClick={() => onPublish(event._id)}
                  className="p-2 text-green-500 hover:text-white bg-green-500/10 hover:bg-green-500 rounded-lg transition-colors border border-green-500/25"
                  title="Publish Event"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => onEdit(event)}
                className="p-2 text-[#00BFFF] hover:text-white bg-[#00BFFF]/10 hover:bg-[#00BFFF] rounded-lg transition-colors border border-[#00BFFF]/25"
                title="Edit Event"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(event._id)}
                className="p-2 text-red-500 hover:text-white bg-red-500/10 hover:bg-red-500 rounded-lg transition-colors border border-red-500/25"
                title="Delete Event"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
