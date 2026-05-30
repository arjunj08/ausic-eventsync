import React from 'react';
import { CheckCircle2, Play, Circle, Trash2, Edit } from 'lucide-react';

export default function TaskCard({ task, isAdmin, currentUserId, onUpdateStatus, onEdit, onDelete }) {
  
  const getStatusIcon = () => {
    switch (task.status) {
      case 'done':
        return <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />;
      case 'in_progress':
        return (
          <div className="h-5 w-5 border-2 border-t-transparent border-[#00BFFF] rounded-full animate-spin flex-shrink-0"></div>
        );
      default:
        return <Circle className="h-5 w-5 text-gray-500 flex-shrink-0" />;
    }
  };

  const getStatusBadge = () => {
    switch (task.status) {
      case 'done':
        return <span className="bg-green-500/20 border border-green-500/40 text-green-500 text-[10px] font-semibold px-2 py-0.5 rounded-full">Done</span>;
      case 'in_progress':
        return <span className="bg-[#00BFFF]/20 border border-[#00BFFF]/40 text-[#00BFFF] text-[10px] font-semibold px-2 py-0.5 rounded-full">In Progress</span>;
      default:
        return <span className="bg-gray-800 border border-gray-700 text-gray-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">To Do</span>;
    }
  };

  const isAssignedToMe = task.assignedTo && (task.assignedTo._id === currentUserId || task.assignedTo === currentUserId);

  return (
    <div className={`bg-[#111111] hover:bg-[#151515] border border-gray-800 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between ${task.status === 'done' ? 'opacity-70' : ''}`}>
      
      {/* Upper Section */}
      <div>
        <div className="flex items-start justify-between space-x-3 mb-2">
          {/* Title with status icon */}
          <div className="flex items-start space-x-2.5">
            <span className="mt-0.5">{getStatusIcon()}</span>
            <h4 className={`text-base font-bold text-white leading-snug ${task.status === 'done' ? 'line-through text-gray-500' : ''}`}>
              {task.title}
            </h4>
          </div>
          {getStatusBadge()}
        </div>

        {/* Description */}
        <p className={`text-sm text-gray-400 mb-4 leading-relaxed line-clamp-3 ${task.status === 'done' ? 'text-gray-600' : ''}`}>
          {task.description}
        </p>
      </div>

      {/* Footer Section */}
      <div>
        {/* Team indicator */}
        <div className="flex items-center space-x-2 mb-4">
          <span 
            className="h-3 w-3 rounded-full border border-black/20"
            style={{ backgroundColor: task.teamId?.color || '#7C3AED' }}
          ></span>
          <span className="text-xs text-gray-400 font-medium">
            {task.teamId?.name || 'Assigned Team'}
          </span>
          {task.eventId?.title && (
            <span className="text-[10px] text-gray-600 block truncate max-w-[120px]">
              • {task.eventId.title}
            </span>
          )}
        </div>

        <div className="border-t border-gray-850 pt-3 flex items-center justify-between">
          {/* Assignee Avatar */}
          <div className="flex items-center space-x-2">
            <img
              src={task.assignedTo?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(task.assignedTo?.name || 'Unassigned')}&backgroundColor=7c3aed`}
              alt={task.assignedTo?.name || 'Unassigned'}
              className="h-6 w-6 rounded-full border border-gray-850 bg-[#7C3AED]"
            />
            <span className="text-xs text-gray-400 truncate max-w-[80px]">
              {task.assignedTo?.name || 'Unassigned'}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-1">
            {/* Status toggle for members (if assigned or admin) */}
            {(isAssignedToMe || isAdmin) && (
              <>
                {task.status !== 'in_progress' && task.status !== 'done' && (
                  <button
                    onClick={() => onUpdateStatus(task._id, 'in_progress')}
                    className="p-1.5 text-[#00BFFF] hover:bg-[#00BFFF]/10 rounded-md transition-colors"
                    title="Mark In Progress"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                )}
                {task.status !== 'done' && (
                  <button
                    onClick={() => onUpdateStatus(task._id, 'done')}
                    className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-md transition-colors"
                    title="Mark Completed"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                )}
                {task.status === 'done' && (
                  <button
                    onClick={() => onUpdateStatus(task._id, 'todo')}
                    className="p-1.5 text-gray-500 hover:bg-gray-500/10 rounded-md transition-colors"
                    title="Re-open Task"
                  >
                    <Circle className="h-4 w-4" />
                  </button>
                )}
              </>
            )}

            {/* Admin edit/delete buttons */}
            {isAdmin && (
              <>
                <button
                  onClick={() => onEdit(task)}
                  className="p-1.5 text-[#00BFFF] hover:bg-gray-800 rounded-md transition-colors"
                  title="Edit Task"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDelete(task._id)}
                  className="p-1.5 text-red-500 hover:bg-gray-800 rounded-md transition-colors"
                  title="Delete Task"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
