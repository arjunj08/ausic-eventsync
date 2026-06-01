import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { 
  Image as ImageIcon, 
  Trash2, 
  Heart, 
  Upload, 
  Loader2, 
  Maximize2,
  Plus,
  Tag,
  Star,
  AlertTriangle,
  Download,
  X,
  Users,
  FolderOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function EventGallery({ eventId, user }) {
  const { socket } = useContext(SocketContext);
  
  // Gallery, Albums & Filtering
  const [photos, setPhotos] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState('All'); // 'All' or album name
  const [loading, setLoading] = useState(true);

  // Upload States
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [caption, setCaption] = useState('');
  const [uploadAlbum, setUploadAlbum] = useState(''); // Target album during upload
  const [uploading, setUploading] = useState(false);

  // Custom Detail Modal / Lightbox Overlay
  const [viewingPhoto, setViewingPhoto] = useState(null); // Detailed photo object
  const [taggingMode, setTaggingMode] = useState(false);
  const [tempTagCoords, setTempTagCoords] = useState(null); // { x, y }
  const [members, setMembers] = useState([]); // List of users to tag
  const [selectedMemberToTag, setSelectedMemberToTag] = useState('');

  // Create Album Modal States
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [creatingAlbum, setCreatingAlbum] = useState(false);

  // Watermark Settings
  const [applyWatermark, setApplyWatermark] = useState(true);

  const imageRef = useRef(null);

  const isAdmin = user?.role === 'admin';

  // Load photos, albums & member list
  const loadGalleryData = async () => {
    try {
      setLoading(true);
      const [photosRes, albumsRes, membersRes] = await Promise.all([
        axios.get(`/api/photos/event/${eventId}`),
        axios.get(`/api/photo-albums/event/${eventId}`),
        axios.get('/api/auth/members')
      ]);
      setPhotos(photosRes.data);
      setAlbums(albumsRes.data);
      setMembers(membersRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load media gallery data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGalleryData();
  }, [eventId]);

  // Handle uploading photos
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 20) {
      toast.error('You can upload up to 20 files at once.');
      return;
    }
    const invalidFile = files.find(f => f.size > 10 * 1024 * 1024);
    if (invalidFile) {
      toast.error('Max file size is 10MB per photo.');
      return;
    }
    setSelectedFiles(files);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    setUploading(true);
    const loadingToast = toast.loading('Uploading photo gallery slides...');
    try {
      const formData = new FormData();
      formData.append('eventId', eventId);
      formData.append('album', uploadAlbum);

      if (selectedFiles.length === 1) {
        // Single upload
        formData.append('photo', selectedFiles[0]);
        formData.append('caption', caption);
        await axios.post('/api/photos/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Bulk upload
        selectedFiles.forEach((file) => {
          formData.append('photos', file);
        });
        await axios.post('/api/photos/bulk-upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      toast.success('Media successfully added to gallery! 📸', { id: loadingToast });
      setCaption('');
      setSelectedFiles([]);
      setUploadAlbum('');
      const fileInput = document.getElementById('gallery-files-input');
      if (fileInput) fileInput.value = '';

      loadGalleryData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to upload media.', { id: loadingToast });
    } finally {
      setUploading(false);
    }
  };

  // Create new Photo Album
  const handleCreateAlbumSubmit = async (e) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;

    setCreatingAlbum(true);
    try {
      await axios.post('/api/photo-albums', {
        eventId,
        name: newAlbumName.trim()
      });
      toast.success(`Album "${newAlbumName}" created! 📂`);
      setNewAlbumName('');
      setShowCreateAlbum(false);
      
      // Refresh albums
      const res = await axios.get(`/api/photo-albums/event/${eventId}`);
      setAlbums(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create photo album.');
    } finally {
      setCreatingAlbum(false);
    }
  };

  // Like Photo
  const handleToggleLike = async (photoId) => {
    try {
      const res = await axios.post(`/api/photos/${photoId}/like`);
      // Update state
      setPhotos(prev => prev.map(p => p._id === photoId ? { ...p, likes: res.data.likes } : p));
      if (viewingPhoto && viewingPhoto._id === photoId) {
        setViewingPhoto(prev => ({ ...prev, likes: res.data.likes }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Feature Cover Photo
  const handleSetFeatured = async (photoId) => {
    try {
      const res = await axios.patch(`/api/photos/${photoId}/feature`);
      toast.success('Photo set as featured event cover! ⭐️');
      // Set all other featured to false
      setPhotos(prev => prev.map(p => ({ ...p, isFeatured: p._id === photoId })));
      if (viewingPhoto && viewingPhoto._id === photoId) {
        setViewingPhoto(prev => ({ ...prev, isFeatured: true }));
      }
    } catch (err) {
      toast.error('Failed to set featured cover.');
    }
  };

  // Report Photo
  const handleReportPhoto = async (photoId) => {
    if (!window.confirm('Are you sure you want to flag this photo as inappropriate?')) return;
    try {
      await axios.post(`/api/photos/${photoId}/report`);
      toast.success('Photo reported for admin review. ⚠️');
      if (viewingPhoto && viewingPhoto._id === photoId) {
        setViewingPhoto(prev => ({ ...prev, isReported: true }));
      }
    } catch (err) {
      toast.error('Failed to flag photo.');
    }
  };

  // Delete Photo
  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Permanently delete this photo from the event?')) return;
    try {
      await axios.delete(`/api/photos/${photoId}`);
      toast.success('Photo deleted.');
      setPhotos(prev => prev.filter(p => p._id !== photoId));
      if (viewingPhoto && viewingPhoto._id === photoId) {
        setViewingPhoto(null);
      }
    } catch (err) {
      toast.error('Failed to delete photo.');
    }
  };

  // Tag click handlers
  const handleImageClick = (e) => {
    if (!taggingMode) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setTempTagCoords({ x: Math.round(x), y: Math.round(y) });
  };

  const handleTagSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMemberToTag || !tempTagCoords) return;

    try {
      const res = await axios.post(`/api/photos/${viewingPhoto._id}/tag`, {
        userId: selectedMemberToTag,
        x: tempTagCoords.x,
        y: tempTagCoords.y
      });

      toast.success('Member tagged in photo! 🏷️');
      
      // Update viewing and local list
      const taggedMemberObj = members.find(m => String(m._id || m.id) === String(selectedMemberToTag));
      const newTag = { userId: taggedMemberObj, x: tempTagCoords.x, y: tempTagCoords.y };
      
      setViewingPhoto(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag]
      }));

      setPhotos(prev => prev.map(p => p._id === viewingPhoto._id ? {
        ...p,
        tags: [...(p.tags || []), newTag]
      } : p));

      setTaggingMode(false);
      setTempTagCoords(null);
      setSelectedMemberToTag('');
    } catch (err) {
      toast.error('Failed to tag member.');
    }
  };

  // Local Watermark Download generator
  const downloadWithWatermark = (url, filename) => {
    const img = new Image();
    // Enable CORS to read image data on canvas
    img.crossOrigin = 'anonymous';
    img.src = axios.defaults.baseURL + url;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      
      // Draw image
      ctx.drawImage(img, 0, 0);
      
      if (applyWatermark) {
        // Overlay styling
        const fontSize = Math.max(16, Math.round(canvas.width * 0.035));
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 4;
        
        const text = 'AUISC EventSync';
        const textWidth = ctx.measureText(text).width;
        
        // Render bottom-right
        ctx.fillText(text, canvas.width - textWidth - (canvas.width * 0.04), canvas.height - (canvas.height * 0.04));
      }
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename || 'download.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, 'image/png');
    };
    
    img.onerror = () => {
      // Fallback standard download if canvas fails
      window.open(axios.defaults.baseURL + url, '_blank');
    };
  };

  // ZIP download trigger
  const triggerZipDownload = () => {
    window.open(`${axios.defaults.baseURL}/api/photos/download-all/${eventId}`, '_blank');
  };

  // Filter photos based on album selected
  const filteredPhotos = selectedAlbum === 'All'
    ? photos
    : photos.filter(p => p.album === selectedAlbum);

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="h-8 w-8 text-[#00BFFF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left relative">
      
      {/* Upload Media Card */}
      <form onSubmit={handleUploadSubmit} className="bg-[#161616] border border-gray-850 p-5 rounded-xl space-y-4 shadow-xl">
        <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#00BFFF] flex items-center gap-1.5 border-b border-gray-800 pb-2">
          <Upload className="h-4 w-4" />
          Add Media Photos
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Select Photos (Max 20 files, Max 10MB each)
            </label>
            <input
              type="file"
              id="gallery-files-input"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="w-full bg-[#1A1A1A] text-gray-400 border border-gray-800 file:bg-[#2A2A2A] file:border-none file:text-white file:text-xs file:font-semibold file:px-3 file:py-1.5 file:rounded-md text-xs cursor-pointer h-[38px] flex items-center px-2 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Target Folder / Album Selection
            </label>
            <select
              value={uploadAlbum}
              onChange={(e) => setUploadAlbum(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#00BFFF] h-[38px]"
            >
              <option value="">General (No Album)</option>
              {albums.map(a => (
                <option key={a._id} value={a.name}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Single Caption (Optional)
            </label>
            <input
              type="text"
              placeholder="Enter photo caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={selectedFiles.length > 1}
              className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#00BFFF] h-[38px] disabled:opacity-50"
            />
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="text-[10px] text-gray-400 font-semibold">
            {selectedFiles.length} photo(s) selected for upload.
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

      {/* Album Filters & ZIP controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-850 pb-4">
        
        {/* Album Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedAlbum('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide cursor-pointer transition-all border ${
              selectedAlbum === 'All'
                ? 'bg-[#00BFFF]/10 border-[#00BFFF]/30 text-[#00BFFF]'
                : 'bg-[#111111] border-gray-850 text-gray-400 hover:text-white'
            }`}
          >
            All Photos
          </button>
          
          {albums.map(alb => (
            <button
              key={alb._id}
              onClick={() => setSelectedAlbum(alb.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide cursor-pointer transition-all border ${
                selectedAlbum === alb.name
                  ? 'bg-[#00BFFF]/10 border-[#00BFFF]/30 text-[#00BFFF]'
                  : 'bg-[#111111] border-gray-850 text-gray-400 hover:text-white'
              }`}
            >
              📂 {alb.name}
            </button>
          ))}

          {isAdmin && (
            <button
              onClick={() => setShowCreateAlbum(true)}
              className="px-2 py-1 text-[10px] border border-dashed border-gray-700 text-gray-400 hover:text-white hover:border-gray-550 rounded flex items-center gap-1 cursor-pointer ml-2"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Folder
            </button>
          )}
        </div>

        {/* Bulk ZIP export */}
        {photos.length > 0 && (
          <button
            onClick={triggerZipDownload}
            className="text-gray-400 hover:text-[#00BFFF] border border-gray-850 bg-[#111111] px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Download ZIP
          </button>
        )}
      </div>

      {/* Album Folder Creation Popup */}
      <AnimatePresence>
        {showCreateAlbum && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0a0a0a]/85 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-[#111111] border border-gray-850 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4"
            >
              <h3 className="font-extrabold text-white text-base">Create Custom Album Folder</h3>
              <input 
                type="text"
                placeholder="e.g. Stage Performances, Registrations"
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-gray-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00BFFF]"
              />
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowCreateAlbum(false)}
                  className="flex-1 bg-gray-850 hover:bg-gray-800 text-white rounded-lg py-2 text-xs font-bold uppercase transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateAlbumSubmit}
                  disabled={creatingAlbum || !newAlbumName.trim()}
                  className="flex-1 bg-[#00BFFF] hover:bg-[#00D4FF] text-black rounded-lg py-2 text-xs font-bold uppercase transition-colors flex items-center justify-center"
                >
                  {creatingAlbum ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : 'Create'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gallery Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-16 text-gray-500 italic text-xs bg-[#111111] border border-dashed border-gray-850 rounded-xl">
          <ImageIcon className="h-10 w-10 text-gray-600 mx-auto mb-2" />
          No photos found. Upload some above.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredPhotos.map((item) => {
            const absoluteUrl = axios.defaults.baseURL + item.url;

            return (
              <div 
                key={item._id} 
                className="bg-[#111111] border border-gray-850 rounded-xl overflow-hidden shadow-md group relative flex flex-col justify-between"
              >
                <div 
                  className="h-44 bg-[#161616] relative flex items-center justify-center overflow-hidden cursor-pointer"
                  onClick={() => setViewingPhoto(item)}
                >
                  <img 
                    src={absoluteUrl} 
                    alt={item.caption} 
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Overlay featured cover badge */}
                  {item.isFeatured && (
                    <span className="absolute top-2 left-2 bg-yellow-500/90 border border-yellow-400/30 text-black text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-black" />
                      Featured Cover
                    </span>
                  )}
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="h-7 w-7 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
         {/* Detailed Photo Lightbox / Inspector Dialog */}
      <AnimatePresence>
        {viewingPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-none"
          >
            
            <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
              
              {/* Watermark toggle */}
              <label className="flex items-center space-x-2 text-xs font-bold text-gray-400 select-none cursor-pointer">
                <input 
                  type="checkbox"
                  checked={applyWatermark}
                  onChange={() => setApplyWatermark(!applyWatermark)}
                  className="rounded accent-[#00BFFF] h-3.5 w-3.5 bg-black border-gray-800"
                />
                <span>Watermark Overlay</span>
              </label>
  
              <button
                onClick={() => {
                  setViewingPhoto(null);
                  setTaggingMode(false);
                  setTempTagCoords(null);
                }}
                className="bg-gray-850 hover:bg-gray-800 text-white p-2 rounded-full border border-gray-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
  
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="flex flex-col lg:flex-row bg-[#111111] border border-gray-850 max-w-5xl w-full rounded-2xl overflow-hidden max-h-[85vh] shadow-2xl relative"
            >
              
              {/* Left: Image Canvas */}
              <div className="flex-1 bg-black flex items-center justify-center relative min-h-[300px]">
                <img 
                  ref={imageRef}
                  src={axios.defaults.baseURL + viewingPhoto.url} 
                  alt="" 
                  onClick={handleImageClick}
                  className={`max-h-[55vh] lg:max-h-[75vh] max-w-full object-contain cursor-default select-none ${
                    taggingMode ? 'cursor-crosshair' : ''
                  }`}
                />
  
                {/* Tag Overlays */}
                {viewingPhoto.tags && viewingPhoto.tags.map((t, idx) => (
                  <div 
                    key={idx}
                    className="absolute group/tag"
                    style={{ top: `${t.y}%`, left: `${t.x}%` }}
                  >
                    {/* Interactive dot */}
                    <span className="relative flex h-3.5 w-3.5 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00BFFF] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#00BFFF] border border-white"></span>
                    </span>
                    {/* Tag label hover banner */}
                    <span className="absolute bg-[#111111] text-white border border-[#00BFFF]/40 font-bold text-[10px] px-2 py-1 rounded-md transform -translate-x-1/2 -translate-y-9 opacity-0 group-hover/tag:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                      🏷️ {t.userId?.name || 'Club Member'}
                    </span>
                  </div>
                ))}
  
                {/* Temporary Placement Pointer */}
                {tempTagCoords && (
                  <div 
                    className="absolute flex flex-col items-center"
                    style={{ top: `${tempTagCoords.y}%`, left: `${tempTagCoords.x}%` }}
                  >
                    <span className="h-3 w-3 rounded-full bg-yellow-500 border border-white transform -translate-x-1/2 -translate-y-1/2"></span>
                    <div className="bg-[#1a1a1a] border border-gray-800 p-2.5 rounded-lg absolute transform -translate-y-12 z-20 shadow-xl">
                      <form onSubmit={handleTagSubmit} className="space-y-1.5 flex flex-col">
                        <span className="text-[9px] text-gray-500 font-bold uppercase">Assign Coordinator</span>
                        <select
                          value={selectedMemberToTag}
                          onChange={(e) => setSelectedMemberToTag(e.target.value)}
                          required
                          className="bg-black border border-gray-850 text-white rounded text-[10px] px-2 py-1 outline-none"
                        >
                          <option value="">Choose User...</option>
                          {members.map(m => (
                            <option key={m._id || m.id} value={m._id || m.id}>{m.name}</option>
                          ))}
                        </select>
                        <div className="flex gap-1.5 justify-end">
                          <button 
                            type="button" 
                            onClick={() => setTempTagCoords(null)}
                            className="px-2 py-0.5 bg-gray-800 text-white text-[9px] rounded"
                          >
                            ✕
                          </button>
                          <button 
                            type="submit"
                            className="px-2 py-0.5 bg-[#00BFFF] text-black text-[9px] font-bold rounded"
                          >
                            Confirm
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
  
              {/* Right: Info & Detail Sidebar Controls */}
              <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-850 p-6 flex flex-col justify-between space-y-6">
                <div className="space-y-5">
                  
                  {/* Uploader profile */}
                  <div className="flex items-center gap-3 border-b border-gray-850 pb-4">
                    <img 
                      src={viewingPhoto.uploadedBy?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${viewingPhoto.uploadedBy?.name}`} 
                      alt="" 
                      className="h-9 w-9 rounded-full bg-[#7C3AED] object-cover"
                    />
                    <div>
                      <h4 className="text-sm font-semibold text-white">Uploaded by</h4>
                      <p className="text-gray-500 text-xs">{viewingPhoto.uploadedBy?.name || 'Coordinator'}</p>
                    </div>
                  </div>
  
                  {/* Folder album display */}
                  {viewingPhoto.album && (
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                      <FolderOpen className="h-4 w-4 text-[#00BFFF]" />
                      <span>Album: <span className="text-white uppercase">{viewingPhoto.album}</span></span>
                    </div>
                  )}
  
                  {/* Caption / Description */}
                  {viewingPhoto.caption && (
                    <div className="space-y-1.5">
                      <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Caption</h5>
                      <p className="text-gray-300 text-xs leading-relaxed">{viewingPhoto.caption}</p>
                    </div>
                  )}
  
                  {/* Tags breakdown list */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      Tagged Members ({viewingPhoto.tags?.length || 0})
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {viewingPhoto.tags && viewingPhoto.tags.map((t, idx) => (
                        <span key={idx} className="bg-gray-850 text-gray-300 border border-gray-800 rounded px-2.5 py-0.5 text-[9px] font-semibold uppercase">
                          @{t.userId?.name || 'Member'}
                        </span>
                      ))}
                    </div>
                  </div>
  
                </div>
  
                {/* Bottom Interactive actions */}
                <div className="space-y-3 border-t border-gray-850 pt-4">
                  
                  {/* Likes count & Heart button */}
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-xs text-gray-400 font-medium">Liked by {viewingPhoto.likes?.length || 0} members</span>
                    <button 
                      onClick={() => handleToggleLike(viewingPhoto._id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        viewingPhoto.likes?.includes(user.id || user._id)
                          ? 'bg-red-500/10 border-red-500/30 text-red-400'
                          : 'bg-transparent border-gray-855 text-gray-400 hover:text-red-400'
                      }`}
                    >
                      <Heart className={`h-4.5 w-4.5 ${viewingPhoto.likes?.includes(user.id || user._id) ? 'fill-red-400' : ''}`} />
                      Like
                    </button>
                  </div>
  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    
                    {/* Toggle Tag Mode */}
                    <button
                      onClick={() => setTaggingMode(!taggingMode)}
                      className={`w-full py-2.5 rounded-lg border font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        taggingMode 
                          ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 animate-pulse'
                          : 'bg-[#1a1a1a] border-gray-855 text-gray-400 hover:text-white'
                      }`}
                    >
                      <Tag className="h-4 w-4" />
                      {taggingMode ? 'Click Image' : 'Tag Member'}
                    </button>
  
                    {/* Watermarked Download */}
                    <button
                      onClick={() => downloadWithWatermark(viewingPhoto.url, `event-photo-${viewingPhoto._id}.png`)}
                      className="w-full bg-[#1a1a1a] hover:bg-gray-855 text-white border border-gray-855 py-2.5 rounded-lg font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  </div>
  
                  {/* Admin controls */}
                  <div className="space-y-2 pt-2 border-t border-gray-850/50">
                    {isAdmin && (
                      <button
                        onClick={() => handleSetFeatured(viewingPhoto._id)}
                        disabled={viewingPhoto.isFeatured}
                        className="w-full bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 hover:from-yellow-500/20 hover:to-yellow-600/20 text-yellow-500 border border-yellow-500/30 py-2.5 rounded-lg font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer text-xs"
                      >
                        <Star className="h-4 w-4" />
                        Set as Cover Photo
                      </button>
                    )}
  
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReportPhoto(viewingPhoto._id)}
                        disabled={viewingPhoto.isReported}
                        className="flex-1 bg-red-500/5 hover:bg-red-500/10 text-red-400 border border-red-500/20 py-2.5 rounded-lg font-semibold uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors text-[10px]"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {viewingPhoto.isReported ? 'Reported' : 'Report Flag'}
                      </button>
  
                      {/* Delete photo (if admin or uploader) */}
                      {(isAdmin || String(viewingPhoto.uploadedBy?._id || viewingPhoto.uploadedBy) === String(user.id || user._id)) && (
                        <button
                          onClick={() => handleDeletePhoto(viewingPhoto._id)}
                          className="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/30 py-2.5 rounded-lg font-semibold uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors text-[10px]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
  
                </div>
  
              </div>
  
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        </div>
      )}

    </div>
  );
}
