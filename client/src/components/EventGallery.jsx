import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { 
  Image as ImageIcon, 
  Trash2, 
  Heart, 
  Upload, 
  Loader2, 
  Play, 
  Maximize2,
  Video as VideoIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

export default function EventGallery({ eventId, user }) {
  const { socket } = useContext(SocketContext);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload States
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  // Lightbox States
  const [isOpen, setIsOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/media/event/${eventId}`);
      setGallery(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load media gallery.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, [eventId]);

  // Socket triggers
  useEffect(() => {
    if (socket) {
      const addChannel = `event_${eventId}_gallery_add`;
      const updateChannel = `event_${eventId}_media_update`;
      const deleteChannel = `event_${eventId}_media_deleted`;

      socket.on(addChannel, (newEntries) => {
        setGallery(prev => {
          // Filter duplicates
          const filtered = newEntries.filter(entry => !prev.some(p => p._id === entry._id));
          return [...filtered, ...prev];
        });
      });

      socket.on(updateChannel, (updatedItem) => {
        setGallery(prev => prev.map(item => item._id === updatedItem._id ? {
          ...updatedItem,
          uploadedBy: item.uploadedBy // Preserve populated fields
        } : item));
      });

      socket.on(deleteChannel, (data) => {
        setGallery(prev => prev.filter(item => item._id !== data.id));
      });

      return () => {
        socket.off(addChannel);
        socket.off(updateChannel);
        socket.off(deleteChannel);
      };
    }
  }, [socket, eventId]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      toast.error('You can upload up to 10 files at once.');
      return;
    }
    
    // Check sizes
    const invalidFile = files.find(f => f.size > 10 * 1024 * 1024);
    if (invalidFile) {
      toast.error('Max file size is 10MB per image/video.');
      return;
    }

    setSelectedFiles(files);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one image or video.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('eventId', eventId);
    formData.append('caption', caption);
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const res = await axios.post('/api/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message || 'Media uploaded!');
      setCaption('');
      setSelectedFiles([]);
      
      // Clear input
      const fileInput = document.getElementById('gallery-files-input');
      if (fileInput) fileInput.value = '';

      fetchGallery();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to upload media.');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleLike = async (id) => {
    try {
      await axios.patch(`/api/media/${id}/like`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this media item?')) return;
    try {
      await axios.delete(`/api/media/${id}`);
      toast.success('Media deleted.');
      setGallery(prev => prev.filter(item => item._id !== id));
    } catch (err) {
      toast.error('Failed to delete media item.');
    }
  };

  // Filter only images for the lightbox viewer
  const imageSlides = gallery
    .filter(item => item.fileType === 'image')
    .map(item => ({
      src: axios.defaults.baseURL + item.fileUrl,
      alt: item.caption
    }));

  const handleOpenLightbox = (itemId) => {
    const imagesOnly = gallery.filter(item => item.fileType === 'image');
    const index = imagesOnly.findIndex(item => item._id === itemId);
    if (index > -1) {
      setPhotoIndex(index);
      setIsOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="h-8 w-8 text-[#00BFFF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      
      {/* Upload Media Card */}
      <form onSubmit={handleUploadSubmit} className="bg-[#161616] border border-gray-850 p-5 rounded-xl space-y-4">
        <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#00BFFF] flex items-center gap-1.5">
          <Upload className="h-4 w-4" />
          Upload Media Gallery Slides
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Select Images/Videos (Max 10 files, Max 10MB each)
            </label>
            <input
              type="file"
              id="gallery-files-input"
              multiple
              accept="image/*,video/mp4,video/quicktime"
              onChange={handleFileChange}
              className="w-full bg-[#1A1A1A] text-gray-400 border border-gray-800 file:bg-[#2A2A2A] file:border-none file:text-white file:text-xs file:font-semibold file:px-3 file:py-1 file:rounded-md text-xs cursor-pointer h-[38px] flex items-center px-2 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              General Caption (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Cultural dance highlights"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#00BFFF] h-[38px]"
            />
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="text-[10px] text-gray-400 font-semibold">
            {selectedFiles.length} file(s) selected for upload.
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || selectedFiles.length === 0}
          className="bg-[#00BFFF] hover:bg-[#00D4FF] disabled:bg-gray-850 text-black font-extrabold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#00BFFF]/5"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-black" />
              <span>Uploading Media...</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 text-black" />
              <span>Upload to Gallery</span>
            </>
          )}
        </button>
      </form>

      {/* Media Grid */}
      {gallery.length === 0 ? (
        <div className="text-center py-12 text-gray-500 italic text-xs bg-[#111111] border border-gray-850 rounded-xl">
          <ImageIcon className="h-10 w-10 text-gray-600 mx-auto mb-2" />
          No media records submitted for this event gallery.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {gallery.map((item) => {
            const absoluteUrl = axios.defaults.baseURL + item.fileUrl;
            const userLiked = item.likes?.includes(user.id || user._id);
            const isUploader = String(item.uploadedBy?._id || item.uploadedBy) === String(user.id || user._id);
            const canDelete = user?.role === 'admin' || isUploader;

            return (
              <div 
                key={item._id} 
                className="bg-[#111111] border border-gray-850 rounded-xl overflow-hidden shadow-md group relative flex flex-col justify-between"
              >
                
                {/* Media Thumbnail Container */}
                <div className="h-40 bg-[#161616] relative flex items-center justify-center overflow-hidden">
                  {item.fileType === 'video' ? (
                    <>
                      <video 
                        src={absoluteUrl} 
                        className="h-full w-full object-cover"
                        preload="metadata"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <VideoIcon className="h-8 w-8 text-white/80" />
                      </div>
                      <button 
                        onClick={() => window.open(absoluteUrl, '_blank')}
                        className="absolute bottom-2 right-2 bg-black/75 hover:bg-black p-1.5 rounded-full text-white/90 border border-gray-800 text-[10px]"
                        title="Watch Fullscreen"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <img 
                        src={absoluteUrl} 
                        alt={item.caption} 
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onClick={() => handleOpenLightbox(item._id)}
                      />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenLightbox(item._id)}
                          className="bg-black/70 hover:bg-black/90 p-1.5 rounded-full text-white border border-gray-850"
                        >
                          <Maximize2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Caption & Likes Detail Bar */}
                <div className="p-3 space-y-2">
                  {item.caption && (
                    <p className="text-[10px] text-gray-300 font-medium leading-tight truncate">
                      {item.caption}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center text-[9px] text-gray-500">
                    <span className="truncate max-w-[80px]">By {item.uploadedBy?.name || 'User'}</span>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Like button */}
                      <button
                        onClick={() => handleToggleLike(item._id)}
                        className={`flex items-center gap-0.5 cursor-pointer transition-colors ${
                          userLiked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
                        }`}
                      >
                        <Heart className={`h-3 w-3 ${userLiked ? 'fill-red-400' : ''}`} />
                        <span>{item.likes?.length || 0}</span>
                      </button>

                      {/* Delete button */}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {isOpen && (
        <Lightbox
          open={isOpen}
          close={() => setIsOpen(false)}
          slides={imageSlides}
          index={photoIndex}
        />
      )}

    </div>
  );
}
