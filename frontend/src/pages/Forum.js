import React, { useEffect, useState } from 'react';
import api from '../api';
import './Forum.css';

function CreatePostModal({ isOpen, onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const post = await api.createPost({ title, body });
      onCreate(post);
      setTitle('');
      setBody('');
      onClose();
    } catch (err) {
      alert('Failed to create post');
    }
    setLoading(false);
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New Post</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={submit} className="modal-form">
          <div className="form-group">
            <label>Title</label>
            <input 
              placeholder="What's on your mind?" 
              value={title} 
              onChange={e=>setTitle(e.target.value)} 
              required 
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea 
              placeholder="Share your thoughts, ask questions, or start a discussion..." 
              value={body} 
              onChange={e=>setBody(e.target.value)} 
              required 
              className="form-textarea"
              rows="5"
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Posting...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PostCard({ post }) {
  const authorName = post.authorId?.name || post.author?.name || 'Anonymous';
  const replyCount = post.replies?.length || post.comments?.length || 0;
  const avatar = authorName.charAt(0).toUpperCase();
  
  return (
    <div className="modern-post-card">
      <div className="post-avatar-section">
        <div className="post-avatar">{avatar}</div>
      </div>
      
      <div className="post-content-section">
        <div className="post-top-row">
          <div className="post-author-info">
            <span className="post-author-name">{authorName}</span>
            <span className="post-timestamp">
              {new Date(post.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
        
        <h3 className="post-title">{post.title}</h3>
        <p className="post-body-text">{post.body}</p>
        
        <div className="post-engagement-bar">
          <button className="engagement-btn">
            <span className="engagement-icon">💬</span>
            {replyCount} {replyCount === 1 ? 'Reply' : 'Replies'}
          </button>
          <button className="engagement-btn">
            <span className="engagement-icon">👍</span>
            Like
          </button>
          <button className="engagement-btn">
            <span className="engagement-icon">🔖</span>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Forum() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.getPosts()
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  function handlePostCreated(newPost) {
    setPosts(prev => [newPost, ...prev]);
  }

  
  const filteredPosts = posts.filter(post => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return post.title.toLowerCase().includes(query) ||
           post.body.toLowerCase().includes(query);
  });


  const stats = {
    totalPosts: posts.length,
    totalReplies: posts.reduce((sum, post) => sum + (post.replies?.length || post.comments?.length || 0), 0),
    activeUsers: new Set(posts.map(p => p.authorId?._id || p.author?._id).filter(Boolean)).size
  };

  if (loading) {
    return (
      <div className="modern-forum-page">
        <div className="loading-spinner">Loading forum...</div>
      </div>
    );
  }

  return (
    <div className="modern-forum-page">
      {/* Page Header */}
      <div className="forum-page-header">
        <div className="header-content">
          <h1>💬 Community Forum</h1>
          <p className="page-description">
            Connect with fellow traders, share insights, and grow together
          </p>
        </div>
        <button 
          className="btn-new-post" 
          onClick={() => setModalOpen(true)}
        >
          <span className="btn-icon">+</span>
          New Post
        </button>
      </div>

      {/* Stats Section */}
      {posts.length > 0 && (
        <div className="forum-stats-grid">
          <div className="forum-stat-card">
            <div className="stat-icon-wrapper stat-primary">
              <span>📝</span>
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Posts</span>
              <span className="stat-value">{stats.totalPosts}</span>
            </div>
          </div>
          
          <div className="forum-stat-card">
            <div className="stat-icon-wrapper stat-success">
              <span>💬</span>
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Replies</span>
              <span className="stat-value">{stats.totalReplies}</span>
            </div>
          </div>
          
          <div className="forum-stat-card">
            <div className="stat-icon-wrapper stat-info">
              <span>👥</span>
            </div>
            <div className="stat-content">
              <span className="stat-label">Active Users</span>
              <span className="stat-value">{stats.activeUsers}</span>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {posts.length > 0 && (
        <div className="forum-search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="modern-empty-state">
          <div className="empty-icon">💬</div>
          <h3>No posts yet</h3>
          <p>Be the first to start a discussion in the community</p>
          <button className="btn-new-post" onClick={() => setModalOpen(true)}>
            <span className="btn-icon">+</span>
            Create First Post
          </button>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="modern-empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No posts found</h3>
          <p>Try a different search term</p>
          <button className="btn-secondary-small" onClick={() => setSearchQuery('')}>
            Clear Search
          </button>
        </div>
      ) : (
        <>
          {searchQuery && (
            <div className="search-results-info">
              Showing <strong>{filteredPosts.length}</strong> of <strong>{posts.length}</strong> posts
            </div>
          )}
          <div className="forum-posts-list">
            {filteredPosts.map(post => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        </>
      )}

      <CreatePostModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onCreate={handlePostCreated}
      />
    </div>
  );
}
