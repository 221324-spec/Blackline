import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import { createResource } from '../services/api';
import './Resources.css';


const categoryIcons = {
  'Strategy': '🎯',
  'Technical Analysis': '📈',
  'Risk Management': '⚖️',
  'Psychology': '🧠',
  'Market Analysis': '📊',
  'Trading Tools': '🛠️',
  'Beginner': '🌱',
  'Advanced': '🚀',
  'default': '📚'
};


const difficultyColors = {
  'Beginner': 'difficulty-beginner',
  'Intermediate': 'difficulty-intermediate',
  'Advanced': 'difficulty-advanced'
};

function ResourceCard({ resource }) {
  const icon = categoryIcons[resource.category] || categoryIcons.default;
  const difficultyClass = difficultyColors[resource.difficulty] || 'difficulty-intermediate';
  
  return (
    <div className="modern-resource-card">
      <div className="resource-icon-header">
        <div className="resource-icon-circle">
          <span className="resource-icon">{icon}</span>
        </div>
        <div className="resource-meta-badges">
          <span className="resource-category-badge">{resource.category}</span>
          {resource.difficulty && (
            <span className={`difficulty-badge ${difficultyClass}`}>
              {resource.difficulty}
            </span>
          )}
        </div>
      </div>
      
      <h3 className="resource-card-title">{resource.title}</h3>
      
      <p className="resource-card-body">
        {resource.body.length > 150 
          ? `${resource.body.substring(0, 150)}...` 
          : resource.body
        }
      </p>
      
      <div className="resource-card-footer">
        <span className="resource-date-badge">
          📅 {new Date(resource.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </span>
        <button className="resource-view-btn">
          View →
        </button>
      </div>
    </div>
  );
}

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    body: '',
    category: 'Strategy',
    difficulty: 'Beginner'
  });
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role);
      } catch (err) {
        console.error('Token decode error:', err);
      }
    }

    api.getResources()
      .then(setResources)
      .catch(() => setResources([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateResource = async (e) => {
    e.preventDefault();
    if (!newResource.title || !newResource.body) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setCreateLoading(true);
      await createResource(newResource);
      alert('✅ Resource submitted successfully! It will be visible after admin approval.');
      setShowCreateModal(false);
      setNewResource({
        title: '',
        body: '',
        category: 'Strategy',
        difficulty: 'Beginner'
      });
      
      const updatedResources = await api.getResources();
      setResources(updatedResources);
    } catch (error) {
      console.error('Failed to create resource:', error);
      alert('❌ Failed to create resource. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  
  const categories = [...new Set(resources.map(r => r.category))];
  const difficulties = [...new Set(resources.map(r => r.difficulty).filter(Boolean))];

 
  const filteredResources = resources.filter(resource => {
    const matchesCategory = categoryFilter === 'all' || resource.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === 'all' || resource.difficulty === difficultyFilter;
    const matchesSearch = searchQuery === '' || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.body.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

 
  const stats = {
    total: resources.length,
    beginner: resources.filter(r => r.difficulty === 'Beginner').length,
    intermediate: resources.filter(r => r.difficulty === 'Intermediate').length,
    advanced: resources.filter(r => r.difficulty === 'Advanced').length
  };

  if (loading) {
    return (
      <div className="modern-resources-page">
        <div className="loading-spinner">Loading resources...</div>
      </div>
    );
  }

  return (
    <div className="modern-resources-page">
      {/* Page Header */}
      <div className="resources-page-header">
        <div className="header-content">
          <h1>📚 Learning Resources</h1>
          <p className="page-description">
            {userRole === 'Mentor' 
              ? 'Share your knowledge and help traders grow'
              : 'Educational content to help you become a better trader'
            }
          </p>
        </div>
        {userRole === 'Mentor' && (
          <button 
            className="btn-create-resource"
            onClick={() => setShowCreateModal(true)}
          >
            ➕ Create New Resource
          </button>
        )}
      </div>

      {/* Create Resource Modal */}
      {showCreateModal && userRole === 'Mentor' && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📚 Create New Resource</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateResource}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Advanced Risk Management Strategies"
                  value={newResource.title}
                  onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    className="form-select"
                    value={newResource.category}
                    onChange={(e) => setNewResource({...newResource, category: e.target.value})}
                  >
                    <option value="Strategy">Strategy</option>
                    <option value="Technical Analysis">Technical Analysis</option>
                    <option value="Risk Management">Risk Management</option>
                    <option value="Psychology">Psychology</option>
                    <option value="Market Analysis">Market Analysis</option>
                    <option value="Trading Tools">Trading Tools</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Difficulty Level *</label>
                  <select
                    className="form-select"
                    value={newResource.difficulty}
                    onChange={(e) => setNewResource({...newResource, difficulty: e.target.value})}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Content *</label>
                <textarea
                  className="form-textarea"
                  placeholder="Share your knowledge, strategies, tips, and insights..."
                  rows="8"
                  value={newResource.body}
                  onChange={(e) => setNewResource({...newResource, body: e.target.value})}
                  required
                />
              </div>

              <div className="form-info">
                <p>ℹ️ Your resource will be submitted for admin approval before being published.</p>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={createLoading}
                >
                  {createLoading ? 'Submitting...' : ' Submit for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Section */}
      {resources.length > 0 && (
        <div className="resources-stats-grid">
          <div className="resources-stat-card">
            <div className="stat-icon-wrapper stat-primary">
              <span>📚</span>
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Resources</span>
              <span className="stat-value">{stats.total}</span>
            </div>
          </div>
          
          <div className="resources-stat-card">
            <div className="stat-icon-wrapper stat-beginner">
              <span>🌱</span>
            </div>
            <div className="stat-content">
              <span className="stat-label">Beginner</span>
              <span className="stat-value">{stats.beginner}</span>
            </div>
          </div>
          
          <div className="resources-stat-card">
            <div className="stat-icon-wrapper stat-intermediate">
              <span>📈</span>
            </div>
            <div className="stat-content">
              <span className="stat-label">Intermediate</span>
              <span className="stat-value">{stats.intermediate}</span>
            </div>
          </div>
          
          <div className="resources-stat-card">
            <div className="stat-icon-wrapper stat-advanced">
              <span>🚀</span>
            </div>
            <div className="stat-content">
              <span className="stat-label">Advanced</span>
              <span className="stat-value">{stats.advanced}</span>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="resources-filters-section">
        {/* Search Bar */}
        <div className="resources-search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search resources by title or content..."
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

        {/* Category Filters */}
        {categories.length > 0 && (
          <div className="filter-section">
            <label className="filter-section-label">
              <span className="filter-icon">📁</span>
              Category
            </label>
            <div className="filter-pills">
              <button
                className={categoryFilter === 'all' ? 'filter-pill active' : 'filter-pill'}
                onClick={() => setCategoryFilter('all')}
              >
                All ({resources.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={categoryFilter === cat ? 'filter-pill active' : 'filter-pill'}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {categoryIcons[cat] || categoryIcons.default} {cat} 
                  ({resources.filter(r => r.category === cat).length})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty Filters */}
        {difficulties.length > 0 && (
          <div className="filter-section">
            <label className="filter-section-label">
              <span className="filter-icon">📊</span>
              Difficulty Level
            </label>
            <div className="filter-pills">
              <button
                className={difficultyFilter === 'all' ? 'filter-pill active' : 'filter-pill'}
                onClick={() => setDifficultyFilter('all')}
              >
                All Levels
              </button>
              {difficulties.map(diff => (
                <button
                  key={diff}
                  className={difficultyFilter === diff ? 'filter-pill active' : 'filter-pill'}
                  onClick={() => setDifficultyFilter(diff)}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {(categoryFilter !== 'all' || difficultyFilter !== 'all' || searchQuery) && (
          <div className="active-filters-summary">
            <span>
              Showing <strong>{filteredResources.length}</strong> of <strong>{resources.length}</strong> resources
            </span>
            <button
              className="clear-all-filters-btn"
              onClick={() => {
                setCategoryFilter('all');
                setDifficultyFilter('all');
                setSearchQuery('');
              }}
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <div className="modern-empty-state">
          <div className="empty-icon">
            {searchQuery || categoryFilter !== 'all' || difficultyFilter !== 'all' ? '🔍' : '📚'}
          </div>
          <h3>
            {searchQuery || categoryFilter !== 'all' || difficultyFilter !== 'all' 
              ? 'No resources match your filters' 
              : 'No resources available'}
          </h3>
          <p>
            {searchQuery || categoryFilter !== 'all' || difficultyFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Check back later for new educational content'}
          </p>
          {(searchQuery || categoryFilter !== 'all' || difficultyFilter !== 'all') && (
            <button
              className="btn-clear-filters"
              onClick={() => {
                setCategoryFilter('all');
                setDifficultyFilter('all');
                setSearchQuery('');
              }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="resources-content-grid">
          {filteredResources.map(resource => (
            <ResourceCard key={resource._id} resource={resource} />
          ))}
        </div>
      )}
    </div>
  );
}
