import React from 'react';
import PropTypes from 'prop-types';

/**
 * TaskCard - A React component for displaying task information
 * 
 * This component displays task details in a card format, showing
 * task title, description, status, category, and priority.
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.task - Task object containing task details
 * @param {Function} props.onStatusChange - Callback for status changes
 * @param {Function} props.onTaskSelect - Callback when task is selected
 * @returns {JSX.Element} TaskCard component
 */
const TaskCard = ({ task, onStatusChange, onTaskSelect }) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: '#fbbf24', // yellow
      in_progress: '#16a34a', // green
      completed: '#10b981', // green
      blocked: '#ef4444', // red
      archived: '#6b7280' // gray
    };
    return colors[status] || '#6b7280';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      research: '🔬',
      'linter-error': '🔴',
      'build-error': '🔥',
      'start-error': '⚠️',
      error: '❌',
      'missing-feature': '🆕',
      bug: '🐛',
      enhancement: '✨',
      refactor: '♻️',
      documentation: '📚',
      chore: '🧹',
      'missing-test': '🧪',
      'test-setup': '⚙️',
      'test-refactor': '🔄',
      'test-performance': '📊',
      'test-linter-error': '🔍',
      'test-error': '🚫',
      'test-feature': '🔧'
    };
    return icons[category] || '📋';
  };

  const handleStatusChange = (newStatus) => {
    if (onStatusChange) {
      onStatusChange(task.id, newStatus);
    }
  };

  const handleCardClick = () => {
    if (onTaskSelect) {
      onTaskSelect(task);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div 
      className="task-card"
      onClick={handleCardClick}
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        margin: '8px 0',
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Status indicator */}
      <div
        style={{
          position: 'absolute',
          top: '0',
          right: '0',
          width: '4px',
          height: '100%',
          backgroundColor: getStatusColor(task.status),
          borderTopRightRadius: '8px',
          borderBottomRightRadius: '8px'
        }}
      />

      {/* Header with category and priority */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '18px' }}>{getCategoryIcon(task.category)}</span>
          <span style={{
            backgroundColor: '#f3f4f6',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500',
            color: '#374151'
          }}>
            {task.category || 'uncategorized'}
          </span>
        </div>
        
        {task.priority && (
          <span style={{
            backgroundColor: task.priority === 'critical' ? '#fee2e2' : 
                           task.priority === 'high' ? '#fef3c7' : '#e5e7eb',
            color: task.priority === 'critical' ? '#dc2626' : 
                   task.priority === 'high' ? '#d97706' : '#374151',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600'
          }}>
            {task.priority}
          </span>
        )}
      </div>

      {/* Task title */}
      <h3 style={{
        margin: '0 0 8px 0',
        fontSize: '16px',
        fontWeight: '600',
        color: '#111827',
        lineHeight: '1.4'
      }}>
        {task.title}
      </h3>

      {/* Task description */}
      {task.description && (
        <p style={{
          margin: '0 0 12px 0',
          fontSize: '14px',
          color: '#6b7280',
          lineHeight: '1.5',
          display: '-webkit-box',
          WebkitLineClamp: '3',
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {task.description}
        </p>
      )}

      {/* Task metadata */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: '#9ca3af'
      }}>
        <div>
          <strong>Status:</strong>
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            style={{
              marginLeft: '4px',
              padding: '2px 4px',
              fontSize: '11px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: '#ffffff'
            }}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        
        <div>
          Created: {formatDate(task.created_at)}
        </div>
      </div>

      {/* Assigned agent indicator */}
      {task.assigned_agent && (
        <div style={{
          marginTop: '8px',
          fontSize: '11px',
          color: '#6b7280'
        }}>
          <strong>Assigned:</strong> {task.assigned_agent}
        </div>
      )}

      {/* Dependencies indicator */}
      {task.dependencies && task.dependencies.length > 0 && (
        <div style={{
          marginTop: '4px',
          fontSize: '11px',
          color: '#f59e0b'
        }}>
          <strong>Dependencies:</strong> {task.dependencies.length} task(s)
        </div>
      )}
    </div>
  );
};

TaskCard.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.oneOf(['pending', 'in_progress', 'completed', 'blocked', 'archived']).isRequired,
    category: PropTypes.string,
    priority: PropTypes.oneOf(['low', 'medium', 'high', 'critical']),
    created_at: PropTypes.string,
    assigned_agent: PropTypes.string,
    dependencies: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onStatusChange: PropTypes.func,
  onTaskSelect: PropTypes.func
};

TaskCard.defaultProps = {
  onStatusChange: null,
  onTaskSelect: null
};

export default TaskCard;