import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TaskCard from './TaskCard.jsx';

/**
 * TaskList - A React component for displaying and managing a list of tasks
 * 
 * This component provides a comprehensive task management interface with
 * filtering, sorting, and task status management capabilities.
 * 
 * @param {Object} props - Component properties
 * @param {Array} props.tasks - Array of task objects
 * @param {Function} props.onTaskUpdate - Callback for task updates
 * @param {Function} props.onTaskSelect - Callback for task selection
 * @returns {JSX.Element} TaskList component
 */
const TaskList = ({ tasks = [], onTaskUpdate, onTaskSelect }) => {
  const [filteredTasks, setFilteredTasks] = useState(tasks);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');

  // Update filtered tasks when tasks prop or filters change
  useEffect(() => {
    let result = [...tasks];

    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(task => task.status === filterStatus);
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      result = result.filter(task => task.category === filterCategory);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(task => 
        task.title.toLowerCase().includes(term) ||
        (task.description && task.description.toLowerCase().includes(term)) ||
        (task.category && task.category.toLowerCase().includes(term))
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      // Handle date sorting
      if (sortBy === 'created_at') {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      }

      // Handle string sorting
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredTasks(result);
  }, [tasks, filterStatus, filterCategory, sortBy, sortOrder, searchTerm]);

  const handleStatusChange = (taskId, newStatus) => {
    if (onTaskUpdate) {
      onTaskUpdate(taskId, { status: newStatus });
    }
  };

  const handleTaskSelect = (task) => {
    if (onTaskSelect) {
      onTaskSelect(task);
    }
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(tasks.map(task => task.category).filter(Boolean))];
    return categories.sort();
  };

  const getTaskStats = () => {
    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      blocked: tasks.filter(t => t.status === 'blocked').length
    };
    return stats;
  };

  const stats = getTaskStats();
  const categories = getUniqueCategories();

  return (
    <div style={{ 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px'
    }}>
      {/* Header with stats */}
      <div style={{
        marginBottom: '20px',
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <h2 style={{ margin: '0 0 16px 0', color: '#111827' }}>Task Management Dashboard</h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '16px',
          marginBottom: '16px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#374151' }}>{stats.total}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Total</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fbbf24' }}>{stats.pending}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Pending</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>{stats.in_progress}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>In Progress</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{stats.completed}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Completed</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{stats.blocked}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Blocked</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          alignItems: 'end'
        }}>
          {/* Search */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
              Search Tasks
            </label>
            <input
              type="text"
              placeholder="Search by title, description, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#ffffff'
              }}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
              Filter by Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
              Sort By
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  flex: '1',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="created_at">Date Created</option>
                <option value="title">Title</option>
                <option value="status">Status</option>
                <option value="category">Category</option>
                <option value="priority">Priority</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div>
        {filteredTasks.length > 0 ? (
          <>
            <div style={{
              marginBottom: '16px',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Showing {filteredTasks.length} of {tasks.length} tasks
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '16px'
            }}>
              {filteredTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onTaskSelect={handleTaskSelect}
                />
              ))}
            </div>
          </>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#9ca3af'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>No tasks found</div>
            <div style={{ fontSize: '14px' }}>
              {searchTerm || filterStatus !== 'all' || filterCategory !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'Get started by creating your first task'
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

TaskList.propTypes = {
  tasks: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.string.isRequired,
    category: PropTypes.string,
    priority: PropTypes.string,
    created_at: PropTypes.string,
    assigned_agent: PropTypes.string,
    dependencies: PropTypes.arrayOf(PropTypes.string)
  })),
  onTaskUpdate: PropTypes.func,
  onTaskSelect: PropTypes.func
};

TaskList.defaultProps = {
  tasks: [],
  onTaskUpdate: null,
  onTaskSelect: null
};

export default TaskList;